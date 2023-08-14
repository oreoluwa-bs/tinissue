import { db } from "~/db/db.server";
import type { ICreateProjectMilestone } from "./shared";
import { createProjectMilestoneSchema } from "./shared";
import { slugifyAndAddRandomSuffix } from "~/features/teams";
import {
  projectMilestoneAssignees,
  projectMilestones,
  projects,
  users,
} from "~/db/schema";
import { eq, or } from "drizzle-orm";
import { userSelect } from "~/features/user/utils";

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

    await tx.insert(projectMilestoneAssignees).values(
      projectData.assigneesId.map((userId) => ({
        projectMilestoneId: newMilestone.id,
        userId,
      })),
    );
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
    .innerJoin(
      projects,
      or(
        eq(projects.id, projectIdOrSlug as number),
        eq(projects.slug, projectIdOrSlug as string),
      ),
    )
    .innerJoin(
      projectMilestoneAssignees,
      eq(projectMilestoneAssignees.projectMilestoneId, projectMilestones.id),
    )
    .innerJoin(users, eq(projectMilestoneAssignees.userId, users.id));

  const groupedMilestones = milestones.reduce(
    (acc, milestone) => {
      const prevAssign = acc[milestone.milestones.id]?.assignees ?? [];

      acc[milestone.milestones.id] = {
        milestone: milestone.milestones,
        assignees: [...prevAssign, milestone.assignees],
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
