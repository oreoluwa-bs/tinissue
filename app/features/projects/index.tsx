import { and, eq, isNotNull, not, or, sql } from "drizzle-orm";
import { db } from "~/db/db.server";
import { projectInvites, projectMembers, projects } from "~/db/schema/projects";
import { users } from "~/db/schema/users";
import jwt from "jsonwebtoken";
import {
  getTeam,
  getTeamMember,
  getTeamMembers,
  slugifyAndAddRandomSuffix,
  verifyInvitationToken,
} from "../teams";
import {
  createProjectSchema,
  type IEditProject,
  type ICreateProject,
  editProjectSchema,
  type IInviteToProject,
  inviteToProjectSchema,
  type IRevokeInviteToProject,
  revokeInviteToProjectSchema,
} from "./shared";
import { userSelect } from "../user/utils";
import { removeEmptyFields } from "~/lib/utils";
import { defineAbilityFor } from "./permissions";
import { defineAbilityFor as defineTeamAbilityFor } from "../teams/permissions";
import { BadRequest, Unauthorised } from "~/lib/errors";
import { projectMilestones, teamInvites, teamMembers } from "~/db/schema";
import { env } from "~/env";
import { PROJECT_EVENTS, projectEvent } from "./event.server";
import { getUserByEmail } from "../user";

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

type GetProjectMembersFilters = Partial<{
  query: string;
}>;
export async function getProjectMembers(
  projectId: number,
  userId: number,
  filters?: GetProjectMembersFilters,
) {
  const hasAccess = await getProjectMember(projectId, userId);

  if (!hasAccess) {
    throw new Unauthorised();
  }
  const { query } = filters ?? {};

  const membersList = await db
    .select({
      project_members: projectMembers,
      user: userSelect(users),
    })
    .from(projectMembers)
    .where(eq(projectMembers.projectId, projectId))
    .innerJoin(
      users,
      and(
        eq(users.id, projectMembers.userId),
        (query?.trim().length ?? 0) > 0
          ? sql`CONCAT(${users.firstName},' ', ${users.lastName}) LIKE ${
              "%" + query + "%"
            }`
          : isNotNull(users.id),
      ),
    );

  // const hasAccess = membersList.filter((o) => o.team_members.userId === userId);

  const invites = await getProjectInvites(projectId, query);

  const membersAndInvitesList: {
    project_members: (typeof membersList)[0]["project_members"] | null;
    user: (typeof membersList)[0]["user"] | null;
    project_invites: (typeof invites)[0] | null;
  }[] = [...membersList.map((i) => ({ ...i, project_invites: null }))];

  invites.forEach((invite) => {
    membersAndInvitesList.push({
      project_members: null,
      user: null,
      project_invites: invite,
    });
  });

  return membersAndInvitesList;
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

/**
 * Invites
 */

const INVITE_WINDOW_IN_DAYS = 7;

async function getProjectInvites(projectId: number, query?: string) {
  const existingInvites = await db
    .select()
    .from(projectInvites)
    .where(
      and(
        eq(projectInvites.projectId, projectId),
        eq(projectInvites.accepted, false),
        (query?.trim().length ?? 0) > 0
          ? sql`${projectInvites.email} LIKE ${"%" + query + "%"}`
          : isNotNull(projectInvites.id),
      ),
    );

  return existingInvites;
}

export async function getProjectInvite(projectId: number, email: string) {
  const existingInvite = (
    await db
      .select()
      .from(projectInvites)
      .where(
        and(
          eq(projectInvites.projectId, projectId),
          eq(projectInvites.email, email),
          sql`DATEDIFF(NOW(), ${projectInvites.createdAt}) < ${INVITE_WINDOW_IN_DAYS}`,
        ),
      )
  )[0];

  return existingInvite;
}

export async function inviteToProject(data: IInviteToProject, userId: number) {
  const projectInviteData = inviteToProjectSchema.parse(data);

  const projectMembersList = await getProjectMembers(
    projectInviteData.projectId,
    userId,
  );

  const projectMember = projectMembersList.find(
    (i) => i.project_members!.userId === userId,
  );

  if (!projectMember || !projectMember.project_members) {
    throw new Unauthorised(
      "You do not have permission to invite a user to this team",
    );
  }

  const ability = defineAbilityFor(projectMember.project_members);

  if (ability.cannot("update", "Project")) {
    throw new Unauthorised(
      "You do not have permission to invite a user to this project",
    );
  }

  const existingInvite = await db
    .select()
    .from(projectInvites)
    .where(
      and(
        eq(projectInvites.projectId, projectInviteData.projectId),
        eq(projectInvites.email, projectInviteData.email),
        sql`DATEDIFF(NOW(), ${projectInvites.createdAt}) < ${INVITE_WINDOW_IN_DAYS}`,
      ),
    );

  /**
   * Refactor
   * - existing invite expiry
   */

  if (
    existingInvite.length > 0 ||
    projectMembersList.find((i) => i.user?.email === projectInviteData.email)
      ?.user
  ) {
    throw new BadRequest("You have already invited this user.");
  }

  await db.transaction(async (tx) => {
    // existing teamMember
    const existingTeamMember = (
      await getTeamMembers(
        // invitor team id
        projectMember.project_members!.teamId,
        userId,
      )
    ).find((m) => m.user?.email === projectInviteData.email);

    let existingTeamInvite: typeof teamInvites.$inferSelect | null = null;

    if (!existingTeamMember || !existingTeamMember.team_members) {
      // Check if exists
      existingTeamInvite = (
        await db
          .select()
          .from(teamInvites)
          .where(
            and(
              eq(teamInvites.email, projectInviteData.email),
              eq(
                teamInvites.teamId,
                // invitor team id
                projectMember.project_members!.teamId,
              ),
            ),
          )
      )[0];

      //  Create team invite
      if (!existingTeamInvite) {
        await db.insert(teamInvites).values({
          email: projectInviteData.email,
          // invitor team id
          teamId: projectMember.project_members!.teamId,
          // invitor team id
        });

        existingTeamInvite = (
          await db
            .select()
            .from(teamInvites)
            .where(
              and(
                eq(teamInvites.email, projectInviteData.email),
                eq(
                  teamInvites.teamId,
                  // invitor team id
                  projectMember.project_members!.teamId,
                ),
              ),
            )
        )[0];
      }
    }

    // Create project invite
    await db.insert(projectInvites).values({
      email: projectInviteData.email,
      projectId: projectInviteData.projectId,
      teamInviteId: existingTeamInvite?.id ?? null,
    });
  });

  // await db.insert(teamInvites).values({
  //   teamId: projectInviteData.teamId,
  //   email: projectInviteData.email,
  // });

  const project = await getProject(projectInviteData.projectId);

  // // Generate token
  const token = jwt.sign(
    {
      projectId: projectInviteData.projectId,
      email: projectInviteData.email,
      scope: "project",
    },
    env.JWT_SECRET,
    { expiresIn: `${INVITE_WINDOW_IN_DAYS}d` },
  );

  // TODO: Remove field from from table after expiry
  projectEvent.emit(PROJECT_EVENTS.NEW_INVITE, {
    user: { email: projectInviteData.email },
    project: { name: project.project.name },
    invitee: { name: projectMember.user!.firstName },
    token: {
      token,
      expiryInDays: INVITE_WINDOW_IN_DAYS,
    },
  });
}

export async function revokeInviteToProject(
  data: IRevokeInviteToProject,
  userId: number,
) {
  const projectInviteData = revokeInviteToProjectSchema.parse(data);

  const projectMembersList = await getProjectMembers(
    projectInviteData.projectId,
    userId,
  );

  const projectMember = projectMembersList.find(
    (i) => i.project_members!.userId === userId,
  );

  if (!projectMember || !projectMember.project_members) {
    throw new Unauthorised(
      "You do not have permission to revoke this user's invite to this project",
    );
  }

  const ability = defineAbilityFor(projectMember.project_members);

  if (ability.cannot("update", "Project")) {
    throw new Unauthorised(
      "You do not have permission to revoke this user's invite to this project",
    );
  }

  const existingProjectInvite = (
    await db
      .select()
      .from(projectInvites)
      .where(
        and(
          eq(projectInvites.id, projectInviteData.inviteId),
          eq(projectInvites.projectId, projectInviteData.projectId),
        ),
      )
  )[0];

  if (!existingProjectInvite) return;

  // It's delelte is cascaded
  if (existingProjectInvite.teamInviteId) {
    await db
      .delete(teamInvites)
      .where(eq(teamInvites.id, existingProjectInvite.teamInviteId));
  } else {
    await db
      .delete(projectInvites)
      .where(eq(projectInvites.id, existingProjectInvite.id));
  }
}

export async function acceptInviteToProject(token: string) {
  const claims = verifyInvitationToken(token);

  if (typeof claims === "string") {
    throw new BadRequest(claims);
  }

  const user = await getUserByEmail(claims["email"]);

  if (!user) {
    throw new Unauthorised(undefined, { email: claims["email"] });
  }

  const project = (await getProject(claims["projectId"])).project;

  await db.transaction(async (tx) => {
    const invitation = await getProjectInvite(project.id, claims["email"]);

    // This is if the user is not already a team member
    if (invitation.teamInviteId) {
      // Auto accept teamInvite
      await tx.insert(teamMembers).values({
        teamId: project.teamId,
        userId: user.id,
        role: "MEMBER",
      });

      await tx
        .delete(teamInvites)
        .where(eq(teamInvites.id, invitation.teamInviteId));
    }

    await tx.insert(projectMembers).values({
      projectId: project.id,
      teamId: project.teamId,
      userId: user.id,
      role: "MEMBER",
    });

    await tx.delete(projectInvites).where(eq(projectInvites.id, invitation.id));
  });

  const team = await getTeam(project.teamId);

  return {
    team,
  };
}
