import {
  type LoaderArgs,
  redirect,
  type ActionArgs,
  json,
} from "@remix-run/node";
import { requireUserId } from "~/features/auth";
import { deleteTeam, editTeam, getTeam } from "~/features/teams";
import { editTeamSchema } from "~/features/teams/shared";
import {
  APIError,
  InternalServerError,
  MethodNotSupported,
  NotFound,
} from "~/lib/errors";

export async function action({ params, request }: ActionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const formObject = Object.fromEntries(formData) as { [x: string]: any };

  const method = request.method;

  try {
    const team = await getTeam(params.teamSlug as string);

    if (!team) {
      throw new NotFound();
    }

    if (method === "PATCH") {
      const credentials = editTeamSchema.safeParse({
        ...formObject,
        id: team.id,
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

      await editTeam(credentials.data, userId);

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
      await deleteTeam(team.id, userId);

      return redirect("/dashboard");
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

export async function loader({ params, request }: LoaderArgs) {
  // const userId = await requireUserId(request);

  return redirect(`/dashboard/${params.teamSlug}/projects`);
}

// export default function Index() {
//   return (
//     <main>
//       <h2 className="text-primary">Homes</h2>
//     </main>
//   );
// }
