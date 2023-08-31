import { db } from "~/db/db.server";
import {
  createTeamSchema,
  type IEditTeam,
  type ICreateTeam,
  editTeamSchema,
  type IDeleteTeamMember,
  deleteTeamMemberSchema,
  type IEditTeamMember,
  editTeamMemberSchema,
  type IInviteToTeam,
  inviteToTeamSchema,
} from "./shared";
import { teamInvites, teamMembers, teams } from "~/db/schema/teams";
import { and, eq, isNotNull, isNull, or, sql } from "drizzle-orm";
import { generateAvatarThumbnail, removeEmptyFields } from "~/lib/utils";
import { defineAbilityFor } from "./permissions";
import { BadRequest, Unauthorised } from "~/lib/errors";
import { users } from "~/db/schema";
import { userSelect } from "../user/utils";
import { TEAM_EVENTS, teamEvent } from "./event.server";
import jwt from "jsonwebtoken";
import { env } from "~/env";

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

  return membersList;
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

  if (ability.cannot("edit", "Team")) {
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
export async function inviteToTeam(data: IInviteToTeam, userId: number) {
  const teamInviteData = inviteToTeamSchema.parse(data);

  const teamMembers = await getTeamMembers(teamInviteData.teamId, userId);

  const teamMember = teamMembers.find((i) => i.team_members.userId === userId);
  if (!teamMember || teamMember.team_members) {
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

  const INVITE_WINDOW_IN_DAYS = 7;

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

  if (existingInvite.length > 0) {
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
    { expiresIn: "7d" },
  );

  teamEvent.emit(TEAM_EVENTS.NEW_INVITE, {
    user: { email: teamInviteData.email },
    team: { name: team.name },
    invitee: { name: teamMember.user.firstName },
    token: {
      token,
      expiryInDays: INVITE_WINDOW_IN_DAYS,
    },
  });
}
