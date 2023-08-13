import { projectMembers, projects } from "~/db/schema/projects";
import { createProjectSchema, type ICreateProject } from "./shared";
import { db } from "~/db/db.server";
import { and, eq } from "drizzle-orm";
import { slugifyAndAddRandomSuffix } from "../teams";

export async function createProject(data: ICreateProject, creatorId: number) {
  const projectData = createProjectSchema.parse(data);

  await db.transaction(async (tx) => {
    const slug = slugifyAndAddRandomSuffix(projectData.name);
    // const slug = customSlug ?? slugifyAndAddRandomSuffix(teamData.name);

    await tx.insert(projects).values({
      name: projectData.name,
      slug,
      teamId: projectData.teamId,
      description: projectData.description,
    });

    const newProject = (
      await tx
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.slug, slug))
    )[0];

    await tx.insert(projectMembers).values({
      projectId: newProject.id,
      userId: creatorId,
      teamId: projectData.teamId,
      //   role: "",
    });
  });
}

export async function getUserTeamProjects(teamId: number, userId: number) {
  const projectList = await db
    .select()
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.teamId, teamId),
        eq(projectMembers.userId, userId),
        eq(projectMembers.projectId, projects.id),
      ),
    )
    .innerJoin(projects, eq(projectMembers.teamId, teamId));

  return projectList.map((item) => item.projects);
}
