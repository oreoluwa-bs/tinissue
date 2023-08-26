import { type LoaderArgs, redirect } from "@remix-run/node";

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
