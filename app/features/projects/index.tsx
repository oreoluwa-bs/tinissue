import { and, eq, isNotNull, or, sql } from "drizzle-orm";
import { db } from "~/db/db.server";
import { projectMembers, projects } from "~/db/schema/projects";
import { users } from "~/db/schema/users";
import { slugifyAndAddRandomSuffix } from "../teams";
import { createProjectSchema, type ICreateProject } from "./shared";
import { userSelect } from "../user/utils";

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

export async function getUserTeamProjects(
  teamId: number,
  userId: number,
  filters?: Partial<{
    search: string;
    limit: number;
    page: number;
  }>,
) {
  const { limit = 30, page = 1, search } = filters ?? {};

  const projectList = await db
    .select()
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.teamId, teamId),
        eq(projectMembers.userId, userId),
        eq(projectMembers.projectId, projects.id),
        (search?.trim().length ?? 0) > 0
          ? sql`lower(${projects.name}) like lower(${"%" + search + "%"})`
          : isNotNull(projects.name),
      ),
    )
    .innerJoin(projects, eq(projectMembers.teamId, teamId))
    .limit(limit)
    .offset(limit * (page - 1));

  return {
    result: projectList.map((item) => item.projects),
    limit,
    page,
    meta: {
      total: projectList.length,
    },
  };
}

export async function getProject(idOrSlug: string | number) {
  const projectList = await db
    .select({
      projects: projects,
      project_members: projectMembers,
      users: userSelect(users),
    })
    .from(projects)
    .where(
      or(
        eq(projects.id, idOrSlug as number),
        eq(projects.slug, idOrSlug as string),
      ),
    )
    .innerJoin(projectMembers, eq(projectMembers.projectId, projects.id))
    .innerJoin(users, eq(users.id, projectMembers.userId));

  const project = {
    project: projectList[0].projects,
    members: projectList.map((i) => ({
      // projectMember: i.project_members,
      ...i.users,
    })),
  };

  return project;
}
