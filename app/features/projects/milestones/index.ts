import { db } from "~/db/db.server";
import type {
  IChangeMilestoneStatus,
  ICreateAssignees,
  ICreateProjectMilestone,
  IDeleteAssignee,
  IDeleteMilestone,
  IEditMilestone,
} from "./shared";
import {
  changeMilestoneStatusSchema,
  createAssigneesSchema,
  createProjectMilestoneSchema,
  deleteAssigneeSchema,
  deleteMilestoneSchema,
  editMilestoneSchema,
} from "./shared";
import { slugifyAndAddRandomSuffix } from "~/features/teams";
import {
  projectMilestoneAssignees,
  projectMilestones,
  projects,
  users,
} from "~/db/schema";
import { and, eq, or } from "drizzle-orm";
import { userSelect } from "~/features/user/utils";
import { removeEmptyFields } from "~/lib/utils";
import { getProjectMember } from "../index";
import { defineAbilityFor } from "./permissions";
import { Unauthorised } from "~/lib/errors";

export async function createMilestone(
  data: ICreateProjectMilestone,
  userId: number,
) {
  const projectData = createProjectMilestoneSchema.parse(data);

  const projectMember = await getProjectMember(projectData.projectId, userId);

  const ability = defineAbilityFor(projectMember);

  if (ability.cannot("create", "Milestone")) {
    throw new Unauthorised(
      "You do not have permission to create this milestone",
    );
  }

  await db.transaction(async (tx) => {
    const slug = slugifyAndAddRandomSuffix(projectData.name);

    await tx.insert(projectMilestones).values({
      dueAt: projectData.dueAt,
      name: projectData.name,
      projectId: projectData.projectId,
      description: projectData.description,
      //   projectBoardId: projectData.boardId,
      status: data.status,
      slug,
    });

    const newMilestone = (
      await tx
        .select({ id: projectMilestones.id })
        .from(projectMilestones)
        .where(eq(projectMilestones.slug, slug))
    )[0];

    projectData.assigneesId.length > 0 &&
      (await tx.insert(projectMilestoneAssignees).values(
        projectData.assigneesId.map((userId) => ({
          projectMilestoneId: newMilestone.id,
          userId,
        })),
      ));
  });
}

export async function getProjectMilestones(projectIdOrSlug: number | string) {
  //   const milestones = await db.query.projectMilestones.findMany({
  //     where(fields, operators) {
  //       return operators.or(
  //         operators.eq(fields.projectId, projectIdOrSlug as number),
  //         operators.eq(fields.slug, projectIdOrSlug as string),
  //       );
  //     },
  //     with: {
  //       assignees: true,
  //     },
  //   });

  const milestones = await db
    .select({
      milestones: projectMilestones,
      assignees: userSelect(users),
    })
    .from(projectMilestones)
    .where(
      or(
        eq(projects.id, projectIdOrSlug as number),
        eq(projects.slug, projectIdOrSlug as string),
      ),
    )
    .innerJoin(projects, eq(projects.id, projectMilestones.projectId))
    .leftJoin(
      projectMilestoneAssignees,
      eq(projectMilestoneAssignees.projectMilestoneId, projectMilestones.id),
    )
    .leftJoin(users, eq(projectMilestoneAssignees.userId, users.id));

  const groupedMilestones = milestones.reduce(
    (acc, milestone) => {
      const prevAssign = acc[milestone.milestones.id]?.assignees ?? [];

      acc[milestone.milestones.id] = {
        milestone: milestone.milestones,
        // @ts-ignore
        assignees: milestone.assignees
          ? // @ts-ignore
            [...prevAssign, milestone.assignees]
          : prevAssign,
      };
      return acc;
    },
    {} as {
      [k: string]: {
        milestone: (typeof milestones)[0]["milestones"];
        assignees: (typeof milestones)[0]["assignees"][];
      };
    },
  );

  //   return milestones;
  //   return groupMilestonesWithAssignees(milestones);
  return Object.values(groupedMilestones);
}

export async function getProjectMilestone(milestoneIdOrSlug: number | string) {
  //   const milestones = await db.query.projectMilestones.findMany({
  //     where(fields, operators) {
  //       return operators.or(
  //         operators.eq(fields.projectId, milestoneIdOrSlug as number),
  //         operators.eq(fields.slug, milestoneIdOrSlug as string),
  //       );
  //     },
  //     with: {
  //       assignees: true,
  //     },
  //   });

  const milestones = await db
    .select({
      milestones: projectMilestones,
      assignees: userSelect(users),
    })
    .from(projectMilestones)
    .where(
      or(
        eq(projectMilestones.id, milestoneIdOrSlug as number),
        eq(projectMilestones.slug, milestoneIdOrSlug as string),
      ),
    )
    .leftJoin(
      projectMilestoneAssignees,
      eq(projectMilestoneAssignees.projectMilestoneId, projectMilestones.id),
    )
    .leftJoin(users, eq(projectMilestoneAssignees.userId, users.id));

  const groupedMilestones = milestones.reduce(
    (acc, milestone) => {
      const prevAssign = acc[milestone.milestones.id]?.assignees ?? [];

      acc[milestone.milestones.id] = {
        milestone: milestone.milestones,
        // @ts-ignore
        assignees: milestone.assignees
          ? // @ts-ignore
            [...prevAssign, milestone.assignees]
          : prevAssign,
      };
      return acc;
    },
    {} as {
      [k: string]: {
        milestone: (typeof milestones)[0]["milestones"];
        assignees: (typeof milestones)[0]["assignees"][];
      };
    },
  );

  return Object.values(groupedMilestones)[0];
}

// function groupMilestonesWithAssignees(data: any) {
//   const groupedData = {};

//   data.forEach((item: any) => {
//     const milestoneSlug = item.milestones.slug;

//     if (!groupedData[milestoneSlug]) {
//       groupedData[milestoneSlug] = {
//         ...item.milestones,
//         assignees: [],
//       };
//     }

//     groupedData[milestoneSlug].assignees.push(item.assignees);
//   });

//   return Object.values(groupedData);
// }

// async function canEditMilestone(milestoneId: number, userId: number) {
//   const milestone = await db
//     .select()
//     .from(projectMilestones)
//     .where(eq(projectMilestones.id, milestoneId))
//     .innerJoin(
//       projectMilestoneAssignees,
//       and(
//         eq(projectMilestoneAssignees.projectMilestoneId, milestoneId),
//         eq(projectMilestoneAssignees.userId, userId),
//       ),
//     );

//   console.log(milestone);

//   if (milestone.length < 1 || !milestone[0])
//     throw new Unauthorised("You are not authorized");

//   return milestone[0];
// }

export async function editMilestone(data: IEditMilestone, userId: number) {
  const milestoneData = editMilestoneSchema.parse(data);

  const milestone = (
    await db
      .select()
      .from(projectMilestones)
      .where(eq(projectMilestones.id, milestoneData.id))
  )[0];

  const projectMember = await getProjectMember(milestone.projectId, userId);

  const ability = defineAbilityFor(projectMember);

  if (ability.cannot("edit", "Milestone")) {
    throw new Unauthorised("You do not have permission to edit this milestone");
  }

  const { id, assigneesId, ...valuesToUpdate } =
    removeEmptyFields(milestoneData);

  await db
    .update(projectMilestones)
    .set({
      // ...milestone.project_milestones,
      ...valuesToUpdate,
    })
    .where(eq(projectMilestones.id, id));
}

export async function deleteMilestone(data: IDeleteMilestone, userId: number) {
  const milestoneData = deleteMilestoneSchema.parse(data);

  const milestone = (
    await db
      .select()
      .from(projectMilestones)
      .where(eq(projectMilestones.id, milestoneData.id))
  )[0];

  const projectMember = await getProjectMember(milestone.projectId, userId);

  const ability = defineAbilityFor(projectMember);

  if (ability.cannot("delete", "Milestone")) {
    throw new Unauthorised(
      "You do not have permission to delete this milestone",
    );
  }

  await db
    .delete(projectMilestones)
    .where(eq(projectMilestones.id, milestoneData.id));
}

/**
 *
 * ASSIGNEESS
 */

export async function createAssignees(data: ICreateAssignees, userId: number) {
  const assigneesData = createAssigneesSchema.parse(data);

  const milestone = (
    await db
      .select()
      .from(projectMilestones)
      .where(eq(projectMilestones.id, assigneesData.milestoneId))
  )[0];

  const projectMember = await getProjectMember(milestone.projectId, userId);

  const ability = defineAbilityFor(projectMember);

  if (ability.cannot("edit", "Milestone")) {
    throw new Unauthorised(
      "You do not have permission to assign a user to this milestone",
    );
  }

  assigneesData.assigneesId.length > 0 &&
    (await db.insert(projectMilestoneAssignees).values(
      assigneesData.assigneesId.map((aId) => ({
        projectMilestoneId: assigneesData.milestoneId,
        userId: aId,
      })),
    ));
}

export async function deleteAssignees(data: IDeleteAssignee, userId: number) {
  const assigneeData = deleteAssigneeSchema.parse(data);

  const milestone = (
    await db
      .select()
      .from(projectMilestones)
      .where(eq(projectMilestones.id, assigneeData.milestoneId))
  )[0];

  const projectMember = await getProjectMember(milestone.projectId, userId);

  const ability = defineAbilityFor(projectMember);

  if (ability.cannot("edit", "Milestone")) {
    throw new Unauthorised(
      "You do not have permission to unassign a user to this milestone",
    );
  }

  await db
    .delete(projectMilestoneAssignees)
    .where(
      and(
        eq(
          projectMilestoneAssignees.projectMilestoneId,
          assigneeData.milestoneId,
        ),
        eq(projectMilestoneAssignees.userId, assigneeData.assigneeId),
      ),
    );
}

export async function changeMilestoneStatus(
  data: IChangeMilestoneStatus,
  userId: number,
) {
  const milestoneData = changeMilestoneStatusSchema.parse(data);

  const milestone = (
    await db
      .select()
      .from(projectMilestones)
      .where(eq(projectMilestones.id, milestoneData.id))
  )[0];

  const projectMember = await getProjectMember(milestone.projectId, userId);

  const ability = defineAbilityFor(projectMember);

  if (ability.cannot("update", "Milestone", "status")) {
    throw new Unauthorised(
      "You do not have permission to change the status of this milestone",
    );
  }

  const { id, status } = removeEmptyFields(milestoneData);

  await db
    .update(projectMilestones)
    .set({ status })
    .where(eq(projectMilestones.id, id));
}
