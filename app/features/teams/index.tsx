import { and, eq, isNotNull, isNull, or, sql } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { db } from "~/db/db.server";
import { users } from "~/db/schema";
import { teamInvites, teamMembers, teams } from "~/db/schema/teams";
import { env } from "~/env";
import { BadRequest, NotFound, Unauthorised } from "~/lib/errors";
import { generateAvatarThumbnail, removeEmptyFields } from "~/lib/utils";
import { getUserByEmail } from "../user";
import { userSelect } from "../user/utils";
import { TEAM_EVENTS, teamEvent } from "./event.server";
import { defineAbilityFor } from "./permissions";
import {
  createTeamSchema,
  deleteTeamMemberSchema,
  editTeamMemberSchema,
  editTeamSchema,
  inviteToTeamSchema,
  revokeInviteToTeamSchema,
  type ICreateTeam,
  type IDeleteTeamMember,
  type IEditTeam,
  type IEditTeamMember,
  type IInviteToTeam,
  type IRevokeInviteToTeam,
} from "./shared";

export function slugifyAndAddRandomSuffix(
  str: string,
  length: number = 5,
): string {
  const slug = str
    .toLowerCase()
    .replace(/[^\w-]+/g, "-")
    .replace(/-+/g, "-");

  const suffix = Math.random().toString(36).substring(2, length);

  return `${slug}-${suffix}`;
}

export async function createTeam(
  teamInfo: ICreateTeam,
  creatorId: number,
  customSlug?: string,
) {
  const teamData = createTeamSchema.parse(teamInfo);

  await db.transaction(async (tx) => {
    const slug = customSlug ?? slugifyAndAddRandomSuffix(teamData.name);

    // teamData.type === "TEAM" ?
    const defaultProfile = generateAvatarThumbnail(
      teamData.name
        .split(" ")
        .map((i) => i[0].toUpperCase()) // Get initials
        .join(""),
    );
    // : null;

    await tx.insert(teams).values({
      name: teamData.name,
      profileImage: teamData.profileImage ?? defaultProfile,
      type: teamData.type,
      slug,
    });

    const newTeam = (
      await tx.select({ id: teams.id }).from(teams).where(eq(teams.slug, slug))
    )[0];

    await tx.insert(teamMembers).values({
      teamId: newTeam.id,
      userId: creatorId,
      role: "OWNER",
    });
  });
}

export async function getUserTeams(userId: number) {
  const userTeams = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.userId, userId))
    .innerJoin(
      teams,
      and(eq(teamMembers.teamId, teams.id), isNull(teams.deletedAt)),
    );

  return userTeams;
}

export async function getPendingDeletedTeams(userId: number) {
  const userTeams = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.userId, userId))
    .innerJoin(
      teams,
      and(eq(teamMembers.teamId, teams.id), isNotNull(teams.deletedAt)),
    );

  return userTeams;
}

export async function getTeam(idOrSlug: string | number) {
  const team = (
    await db
      .select()
      .from(teams)
      .where(
        and(
          or(
            eq(teams.id, idOrSlug as number),
            eq(teams.slug, idOrSlug as string),
          ),
          isNull(teams.deletedAt),
        ),
      )
  )[0];

  return team;
}

type GetTeamMembersFilters = Partial<{
  query: string;
}>;
export async function getTeamMembers(
  teamId: number,
  userId: number,
  filters?: GetTeamMembersFilters,
) {
  const hasAccess = await getTeamMember(teamId, userId);

  if (!hasAccess) {
    throw new Unauthorised();
  }
  const { query } = filters ?? {};

  const membersList = await db
    .select({
      team_members: teamMembers,
      user: userSelect(users),
    })
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId)))
    .innerJoin(
      users,
      and(
        eq(teamMembers.userId, users.id),
        (query?.trim().length ?? 0) > 0
          ? sql`CONCAT(${users.firstName},' ', ${users.lastName}) LIKE ${
              "%" + query + "%"
            }`
          : isNotNull(users.id),
      ),
    );

  // const hasAccess = membersList.filter((o) => o.team_members.userId === userId);

  const invites = await getTeamInvites(teamId, query);

  const membersAndInvitesList: {
    team_members: (typeof membersList)[0]["team_members"] | null;
    user: (typeof membersList)[0]["user"] | null;
    team_invites: (typeof invites)[0] | null;
  }[] = [...membersList.map((i) => ({ ...i, team_invites: null }))];

  invites.forEach((invite) => {
    membersAndInvitesList.push({
      team_members: null,
      user: null,
      team_invites: invite,
    });
  });

  return membersAndInvitesList;
}

export async function getTeamMember(teamId: number, userId: number) {
  return (
    await db
      .select()
      .from(teamMembers)
      .where(
        and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)),
      )
  )[0];
}

export async function editTeamMember(data: IEditTeamMember, userId: number) {
  const teamData = editTeamMemberSchema.parse(data);

  const teamMember = await getTeamMember(teamData.id, userId);

  const ability = defineAbilityFor(teamMember);

  if (ability.cannot("edit", "Team")) {
    throw new Unauthorised(
      "You do not have permission to edit this team member",
    );
  }

  await db
    .update(teamMembers)
    .set({ role: teamData.role })
    .where(
      and(
        eq(teamMembers.teamId, teamData.id),
        eq(teamMembers.userId, teamData.userId),
      ),
    );
}

export async function deleteTeamMember(
  data: IDeleteTeamMember,
  userId: number,
) {
  const teamData = deleteTeamMemberSchema.parse(data);

  const teamMember = await getTeamMember(teamData.id, userId);

  const ability = defineAbilityFor(teamMember);

  if (ability.cannot("delete", "Team")) {
    throw new Unauthorised(
      "You do not have permission to remove this team member",
    );
  }

  await db
    .delete(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, teamData.id),
        eq(teamMembers.userId, teamData.userId),
      ),
    );
}

export async function editTeam(data: IEditTeam, userId: number) {
  const teamData = editTeamSchema.parse(data);

  const { id, ...valuesToUpdate } = removeEmptyFields(teamData);

  const teamMember = await getTeamMember(id, userId);

  const ability = defineAbilityFor(teamMember);

  if (ability.cannot("update", "Team")) {
    throw new Unauthorised("You do not have permission to edit this team");
  }

  await db
    .update(teams)
    .set({ ...valuesToUpdate })
    .where(eq(teams.id, id));
}

export async function deleteTeam(teamId: number, userId: number) {
  const teamMember = await getTeamMember(teamId, userId);

  const ability = defineAbilityFor(teamMember);

  if (ability.cannot("delete", "Team")) {
    throw new Unauthorised("You do not have permission to delete this team");
  }

  // await db.delete(teams).where(eq(teams.id, teamId));

  // await db.
  await db
    .update(teams)
    .set({ deletedAt: new Date() })
    .where(eq(teams.id, teamId));
}

/**
 * Team Invitations
 */
async function getTeamInvites(teamId: number, query?: string) {
  const existingInvites = await db
    .select()
    .from(teamInvites)
    .where(
      and(
        eq(teamInvites.teamId, teamId),
        eq(teamInvites.accepted, false),
        (query?.trim().length ?? 0) > 0
          ? sql`${teamInvites.email} LIKE ${"%" + query + "%"}`
          : isNotNull(teamInvites.id),
      ),
    );

  return existingInvites;
}

export async function getTeamInvite(teamId: number, email: string) {
  const existingInvite = (
    await db
      .select()
      .from(teamInvites)
      .where(
        and(
          eq(teamInvites.teamId, teamId),
          eq(teamInvites.email, email),
          sql`DATEDIFF(NOW(), ${teamInvites.createdAt}) < ${INVITE_WINDOW_IN_DAYS}`,
        ),
      )
  )[0];

  return existingInvite;
}

const INVITE_WINDOW_IN_DAYS = 7;

export async function inviteToTeam(data: IInviteToTeam, userId: number) {
  const teamInviteData = inviteToTeamSchema.parse(data);

  const teamMembers = (
    await getTeamMembers(teamInviteData.teamId, userId)
  ).filter((i) => Boolean(i.team_members));

  const teamMember = teamMembers.find((i) => i.team_members!.userId === userId);

  if (!teamMember || !teamMember.team_members) {
    throw new Unauthorised(
      "You do not have permission to invite a user to this team",
    );
  }

  const ability = defineAbilityFor(teamMember.team_members);

  if (ability.cannot("edit", "Team")) {
    throw new Unauthorised(
      "You do not have permission to invite a user to this team",
    );
  }

  const existingInvite = await db
    .select()
    .from(teamInvites)
    .where(
      and(
        eq(teamInvites.teamId, teamInviteData.teamId),
        eq(teamInvites.email, teamInviteData.email),
        sql`DATEDIFF(NOW(), ${teamInvites.createdAt}) < ${INVITE_WINDOW_IN_DAYS}`,
      ),
    );

  /**
   * Refactor
   * - existing invite expiry
   */

  if (
    existingInvite.length > 0 ||
    teamMembers.find((i) => i.user?.email === teamInviteData.email)?.user
  ) {
    throw new BadRequest("You have already invited this user.");
    // return;
  }

  await db.insert(teamInvites).values({
    teamId: teamInviteData.teamId,
    email: teamInviteData.email,
  });

  const team = await getTeam(teamInviteData.teamId);

  // Generate token
  const token = jwt.sign(
    { teamId: teamInviteData.teamId, email: teamInviteData.email },
    env.JWT_SECRET,
    { expiresIn: `${INVITE_WINDOW_IN_DAYS}d` },
  );

  // TODO: Remove field from from table after expiry
  teamEvent.emit(TEAM_EVENTS.NEW_INVITE, {
    user: { email: teamInviteData.email },
    team: { name: team.name },
    invitee: { name: teamMember.user!.firstName },
    token: {
      token,
      expiryInDays: INVITE_WINDOW_IN_DAYS,
    },
  });
}

export async function revokeInviteToTeam(
  data: IRevokeInviteToTeam,
  userId: number,
) {
  const teamInviteData = revokeInviteToTeamSchema.parse(data);

  const teamMembers = (
    await getTeamMembers(teamInviteData.teamId, userId)
  ).filter((i) => Boolean(i.team_members));

  const teamMember = teamMembers.find((i) => i.team_members!.userId === userId);

  if (!teamMember || !teamMember.team_members) {
    throw new Unauthorised(
      "You do not have permission to revoke this user's invite to this team",
    );
  }

  const ability = defineAbilityFor(teamMember.team_members);

  if (ability.cannot("update", "Team")) {
    throw new Unauthorised(
      "You do not have permission to revoke this user's invite to this team",
    );
  }

  await db
    .delete(teamInvites)
    .where(
      and(
        eq(teamInvites.id, teamInviteData.inviteId),
        eq(teamInvites.teamId, teamInviteData.teamId),
      ),
    );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function revokeInviteToTeamThree(
  inviteId: number,
  userId: number,
) {
  const existingInvite = (
    await db.select().from(teamInvites).where(eq(teamInvites.id, inviteId))
  )[0];

  if (!existingInvite) {
    throw new NotFound();
  }

  const teamMembers = (
    await getTeamMembers(existingInvite.teamId, userId)
  ).filter((i) => Boolean(i.team_members));

  const teamMember = teamMembers.find((i) => i.team_members!.userId === userId);

  if (!teamMember || !teamMember.team_members) {
    throw new Unauthorised(
      "You do not have permission to revoke this user's invite to this team",
    );
  }

  const ability = defineAbilityFor(teamMember.team_members);

  if (ability.cannot("update", "Team")) {
    throw new Unauthorised(
      "You do not have permission to revoke this user's invite to this team",
    );
  }

  await db
    .delete(teamInvites)
    .where(
      and(
        eq(teamInvites.id, existingInvite.id),
        eq(teamInvites.teamId, existingInvite.teamId),
      ),
    );
}

export async function acceptInviteToTeam(token: string) {
  const claims = verifyInvitationToken(token);

  if (typeof claims === "string") {
    throw new BadRequest(claims);
  }

  const user = await getUserByEmail(claims["email"]);

  if (!user) {
    throw new Unauthorised(undefined, { email: claims["email"] });
  }

  const team = await getTeam(claims["teamId"]);

  await db.transaction(async (tx) => {
    // await tx
    //   .update(teamInvites)
    //   .set({
    //     accepted: true,
    //   })
    //   .where(
    //     and(
    //       eq(teamInvites.teamId, claims["teamId"]),
    //       eq(teamInvites.email, claims["email"]),
    //     ),
    //   );

    await tx.insert(teamMembers).values({
      teamId: claims["teamId"],
      userId: user.id,
      role: "MEMBER",
    });

    await tx
      .delete(teamInvites)
      .where(
        and(
          eq(teamInvites.teamId, claims["teamId"]),
          eq(teamInvites.email, claims["email"]),
        ),
      );
  });

  return {
    team,
  };
}

export function verifyInvitationToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET);
}
