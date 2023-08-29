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
import {
  APIError,
  InternalServerError,
  MethodNotSupported,
} from "~/lib/errors";

export async function action({ request }: ActionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const formObject = Object.fromEntries(formData) as { [x: string]: any };

  const method = request.method;

  try {
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

      await createAssignees(credentials.data, userId);

      return json(
        {
          fields: formObject,
          fieldErrors: null,
          formErrors: null,
        },
        { status: 201 },
      );
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

      await deleteAssignees(credentials.data, userId);

      return json(
        {
          fields: formObject,
          fieldErrors: null,
          formErrors: null,
        },
        { status: 201 },
      );
    }

    throw new MethodNotSupported();
  } catch (err) {
    let error = err instanceof APIError ? err : new InternalServerError();

    return json(
      {
        fields: formObject,
        fieldErrors: null,
        formErrors: error.message,
      },
      { status: error.statusCode },
    );
  }
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
