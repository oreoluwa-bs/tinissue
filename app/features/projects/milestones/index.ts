import { db } from "~/db/db.server";
import type {
  ICreateAssignees,
  ICreateProjectMilestone,
  IDeleteAssignee,
  IDeleteMilestone,
  IEditMilestone,
} from "./shared";
import {
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

export async function createMilestone(data: ICreateProjectMilestone) {
  const projectData = createProjectMilestoneSchema.parse(data);

  await db.transaction(async (tx) => {
    const slug = slugifyAndAddRandomSuffix(projectData.name);

    await tx.insert(projectMilestones).values({
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

export async function getProjectMilestone(projectIdOrSlug: number | string) {
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
        eq(projectMilestones.id, projectIdOrSlug as number),
        eq(projectMilestones.slug, projectIdOrSlug as string),
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

async function canEditMilestone(milestoneId: number, userId: number) {
  const milestone = await db
    .select()
    .from(projectMilestones)
    .where(eq(projectMilestones.id, milestoneId))
    .innerJoin(
      projectMilestoneAssignees,
      and(
        eq(projectMilestoneAssignees.projectMilestoneId, milestoneId),
        eq(projectMilestoneAssignees.userId, userId),
      ),
    );

  console.log(milestone);

  if (milestone.length < 1 || !milestone[0])
    throw new Error("You are not authorized");

  return milestone[0];
}

export async function editMilestone(data: IEditMilestone, userId: number) {
  const milestoneData = editMilestoneSchema.parse(data);

  await canEditMilestone(milestoneData.id, userId);

  const valuesToUpdate = removeEmptyFields(milestoneData);

  await db.update(projectMilestones).set({
    // ...milestone.project_milestones,
    ...valuesToUpdate,
  });
}

export async function deleteMilestone(data: IDeleteMilestone, userId: number) {
  const milestoneData = deleteMilestoneSchema.parse(data);

  await canEditMilestone(milestoneData.id, userId);

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

  // await canEditMilestone(assigneesData.milestoneId, userId);

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

  // await canEditMilestone(assigneeData.milestoneId, userId);

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
