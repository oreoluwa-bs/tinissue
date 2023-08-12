import { db } from "~/db/db.server";
import { createTeamSchema, type ICreateTeam } from "./shared";
import { teamMembers, teams } from "~/db/schema/teams";
import { eq, or } from "drizzle-orm";

function slugifyAndAddRandomSuffix(str: string, length: number = 5): string {
  const slug = str
    .toLowerCase()
    .replace(/[^\w\-]+/g, "-")
    .replace(/-+/g, "-");

  const suffix = Math.random().toString(36).substring(2, length);

  return `${slug}-${suffix}`;
}

export async function createTeam(teamInfo: ICreateTeam, creatorId: number) {
  const teamData = createTeamSchema.parse(teamInfo);

  await db.transaction(async (tx) => {
    const slug = slugifyAndAddRandomSuffix(teamData.name);

    await tx.insert(teams).values({
      name: teamData.name,
      profileImage: teamData.profileImage,
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
    .leftJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(teamMembers.userId, userId));

  return userTeams;
}

export async function getTeam(idOrSlug: any) {
  const team = (
    await db
      .select()
      .from(teams)
      .where(or(eq(teams.id, idOrSlug), eq(teams.slug, idOrSlug)))
  )[0];

  return team;
}
