import { db } from "~/db/db.server";
import {
  createTeamSchema,
  type IEditTeam,
  type ICreateTeam,
  editTeamSchema,
} from "./shared";
import { teamMembers, teams } from "~/db/schema/teams";
import { and, eq, isNotNull, isNull, or } from "drizzle-orm";
import { generateAvatarThumbnail, removeEmptyFields } from "~/lib/utils";
import { defineAbilityFor } from "./permissions";
import { Unauthorised } from "~/lib/errors";

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

    const defaultProfile = generateAvatarThumbnail(
      teamData.name
        .split(" ")
        .map((i) => i[0].toUpperCase()) // Get initials
        .join(""),
    );

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
