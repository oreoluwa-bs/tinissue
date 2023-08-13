import {
  json,
  // redirect,
  // type ActionArgs,
  type LoaderArgs,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireUserId } from "~/features/auth";
import { getProject } from "~/features/projects";

// export async function action({ request }: ActionArgs) {
//   const userId = await requireUserId(request);
//   const formData = await request.formData();
//   const formObject = Object.fromEntries(formData) as { [x: string]: any };

//   switch (request.method) {
//     case "POST":
//       const credentials = createProjectSchema.safeParse({
//         ...formObject,
//         ...(formObject.teamId && { teamId: Number(formObject.teamId) }),
//       });

//       if (!credentials.success) {
//         return json(
//           {
//             fields: formObject,
//             fieldErrors: credentials.error.flatten().fieldErrors,
//             formErrors: credentials.error.flatten().formErrors.join(", "),
//           },
//           { status: 400 },
//         );
//       }

//       try {
//         await createProject(credentials.data, userId);

//         return json(
//           {
//             fields: formObject,
//             fieldErrors: null,
//             formErrors: null,
//           },
//           { status: 201 },
//         );
//       } catch (error) {
//         return json(
//           {
//             fields: formObject,
//             fieldErrors: null,
//             formErrors: "Invalid Email/Password",
//           },
//           { status: 400 },
//         );
//       }

//     default:
//       return json(
//         {
//           fields: formObject,
//           fieldErrors: null,
//           formErrors: "Method not found",
//         },
//         { status: 400 },
//       );
//   }
// }

export async function loader({ params, request }: LoaderArgs) {
  const userId = await requireUserId(request);
  // const url = new URL(request.url);

  const project = await getProject(params.projectSlug as string);

  return json({
    project,
    userId,
  });
}

export default function ProjectRoute() {
  const loaderData = useLoaderData<typeof loader>();
  // console.log(loaderData);
  return (
    <main className="py-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="">{loaderData.project.project.name}</h2>
      </div>

      <section></section>
    </main>
  );
}
