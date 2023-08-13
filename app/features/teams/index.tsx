import { db } from "~/db/db.server";
import { createTeamSchema, type ICreateTeam } from "./shared";
import { teamMembers, teams } from "~/db/schema/teams";
import { eq, or } from "drizzle-orm";

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

    await tx.insert(teams).values({
      name: teamData.name,
      profileImage: teamData.profileImage,
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
    .innerJoin(teams, eq(teamMembers.teamId, teams.id));

  return userTeams;
}

export async function getTeam(idOrSlug: string | number) {
  const team = (
    await db
      .select()
      .from(teams)
      .where(
        or(
          eq(teams.id, idOrSlug as number),
          eq(teams.slug, idOrSlug as string),
        ),
      )
  )[0];

  return team;
}
