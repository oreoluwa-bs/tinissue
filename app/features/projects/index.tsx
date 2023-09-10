import { and, eq, isNotNull, not, or, sql } from "drizzle-orm";
import { db } from "~/db/db.server";
import { projectMembers, projects } from "~/db/schema/projects";
import { users } from "~/db/schema/users";
import { getTeamMember, slugifyAndAddRandomSuffix } from "../teams";
import {
  createProjectSchema,
  type IEditProject,
  type ICreateProject,
  editProjectSchema,
} from "./shared";
import { userSelect } from "../user/utils";
import { removeEmptyFields } from "~/lib/utils";
import { defineAbilityFor } from "./permissions";
import { defineAbilityFor as defineTeamAbilityFor } from "../teams/permissions";
import { Unauthorised } from "~/lib/errors";
import { projectMilestones } from "~/db/schema";

export async function createProject(data: ICreateProject, creatorId: number) {
  const projectData = createProjectSchema.parse(data);

  const teamMember = await getTeamMember(projectData.teamId, creatorId);
  const ability = defineTeamAbilityFor(teamMember);

  if (ability.cannot("create", "Project")) {
    throw new Error(
      "You do not have permission to create a project in this team",
    );
  }

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
      role: "OWNER",
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
    project: projectList[0]?.projects,
    members: projectList.map((i) => ({
      // projectMember: i.project_members,
      ...i.users,
    })),
  };

  return project;
}

export async function editProject(data: IEditProject, userId: number) {
  const projectData = editProjectSchema.parse(data);

  const { id, ...valuesToUpdate } = removeEmptyFields(projectData);

  // await canEditMilestone(milestoneData.id, userId);
  // user Info
  const projectMember = await getProjectMember(id, userId);

  const ability = defineAbilityFor(projectMember);

  if (ability.cannot("update", "Project")) {
    throw new Unauthorised("You do not have permission to edit this project");
  }

  await db
    .update(projects)
    .set({ ...valuesToUpdate })
    .where(eq(projects.id, id));
}

export async function deleteProject(id: number, userId: number) {
  const projectMember = await getProjectMember(id, userId);

  const ability = defineAbilityFor(projectMember);

  if (ability.cannot("delete", "Project")) {
    throw new Unauthorised("You do not have permission to delete this project");
  }

  await db.delete(projects).where(eq(projects.id, id));
}

export async function getProjectMember(projectId: number, userId: number) {
  return (
    await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId),
        ),
      )
  )[0];
}

/**
 * Analytics
 */

export async function projectProgressSegementation(projectId: number) {
  const distinctMilestoneStatusCount = await db
    .select({
      count: sql<number>`count(*)`,
      status: projectMilestones.status,
    })
    .from(projectMilestones)
    .where(
      and(
        eq(projectMilestones.projectId, projectId),
        not(eq(projectMilestones.status, "CANCELLED")),
      ),
    )
    .groupBy(projectMilestones.status);

  const milestoneCount = distinctMilestoneStatusCount.reduce((prev, curr) => {
    return prev + curr.count;
  }, 0);

  return {
    total: milestoneCount,
    segments: distinctMilestoneStatusCount,
  };
}

export async function projectDoneProgressInPercentage(projectId: number) {
  const { segments, total } = await projectProgressSegementation(projectId);

  const doneSegment = segments.find((i) => i.status === "DONE") ?? {
    count: 0,
    status: "DONE",
  };

  const percentage = (doneSegment.count / total) * 100;

  return {
    total,
    percentage,
  };
}
