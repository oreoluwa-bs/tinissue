import {
  type LoaderArgs,
  redirect,
  type ActionArgs,
  json,
} from "@remix-run/node";
import { requireUserId } from "~/features/auth";
import { deleteTeam, editTeam, getTeam } from "~/features/teams";
import { editTeamSchema } from "~/features/teams/shared";

export async function action({ params, request }: ActionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const formObject = Object.fromEntries(formData) as { [x: string]: any };

  const method = request.method;

  const team = await getTeam(params.teamSlug as string);

  if (!team)
    return json(
      {
        fields: formObject,
        fieldErrors: null,
        formErrors: "Team not found",
      },
      { status: 404 },
    );

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

    try {
      await editTeam(credentials.data, userId);

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
    try {
      await deleteTeam(team.id, userId);

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
