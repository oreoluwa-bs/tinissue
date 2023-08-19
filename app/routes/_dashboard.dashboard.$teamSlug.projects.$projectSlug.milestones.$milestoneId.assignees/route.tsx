import { json, type ActionArgs } from "@remix-run/node";
import { requireUserId } from "~/features/auth";
import {
  createAssignees,
  deleteAssignees,
} from "~/features/projects/milestones";
import {
  createAssigneesSchema,
  deleteAssigneeSchema,
} from "~/features/projects/milestones/shared";

export async function action({ request }: ActionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const formObject = Object.fromEntries(formData) as { [x: string]: any };

  const method = request.method;

  if (method === "POST") {
    const credentials = createAssigneesSchema.safeParse({
      ...formObject,
      ...(formData.getAll("assigneesId[]").length > 0 && {
        assigneesId: formData.getAll("assigneesId[]"),
      }),
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
      await createAssignees(credentials.data, userId);

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

  if (method === "DELETE") {
    const credentials = deleteAssigneeSchema.safeParse({
      ...formObject,
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
      await deleteAssignees(credentials.data, userId);

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
