import { json, type ActionArgs } from "@remix-run/node";
import { ZodError } from "zod";
import { requireUserId } from "~/features/auth";
import { createMilestone } from "~/features/projects/milestones";
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
      const credentials = {
        ...formObject,
        ...(formData.getAll("assigneesId[]").length > 0 && {
          assigneesId: formData.getAll("assigneesId[]"),
        }),
      } as any;

      await createMilestone(credentials, userId);

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
    if (err instanceof ZodError) {
      return json(
        {
          fields: formObject,
          fieldErrors: err.flatten().fieldErrors,
          formErrors: err.flatten().formErrors.join(", "),
        },
        { status: 400 },
      );
    }

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
