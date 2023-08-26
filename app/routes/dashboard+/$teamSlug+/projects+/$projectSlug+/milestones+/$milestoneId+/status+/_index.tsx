import { json, type ActionArgs } from "@remix-run/node";
import { requireUserId } from "~/features/auth";
import {
  changeMilestoneStatus,
  // getProjectMilestone,
} from "~/features/projects/milestones";
import { changeMilestoneStatusSchema } from "~/features/projects/milestones/shared";

export async function action({ params, request }: ActionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const formObject = Object.fromEntries(formData) as { [x: string]: any };

  const method = request.method;

  // const milestone = (await getProjectMilestone(params.milestoneId as string))
  //   .milestone;

  if (method === "PATCH") {
    const credentials = changeMilestoneStatusSchema.safeParse({
      ...formObject,
      id: params.milestoneId!,
    });

    if (!credentials.success) {
      return json(
        {
          fields: formObject,
          fieldErrors: credentials.error.flatten().fieldErrors,
          formErrors: credentials.error.flatten().formErrors.join(", "),
        },
        { status: 400 },
      );
    }

    try {
      await changeMilestoneStatus(credentials.data, userId);

      return json(
        {
          fields: formObject,
          fieldErrors: null,
          formErrors: null,
        },
        { status: 201 },
      );
    } catch (error) {
      return json(
        {
          fields: formObject,
          fieldErrors: null,

          formErrors:
            error instanceof Error
              ? error.message
              : "Something unexpected happened",
        },
        { status: 400 },
      );
    }
  }

  return json(
    {
      fields: formObject,
      fieldErrors: null,
      formErrors: "Method not found",
    },
    { status: 400 },
  );
}

// export async function loader({ params, request }: LoaderArgs) {
//   const userId = await requireUserId(request);
//   // const url = new URL(request.url);

//   const project = await getProject(params.projectSlug as string);
//   const milestones = await getProjectMilestones(params.projectSlug as string);

//   return json({
//     project,
//     milestones,
//     userId,
//   });
// }
