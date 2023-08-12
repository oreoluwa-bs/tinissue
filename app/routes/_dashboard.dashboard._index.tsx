import type { LoaderArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { requireUserId } from "~/features/auth";
import { getUserTeams } from "~/features/teams";

export async function loader({ params, request }: LoaderArgs) {
  const userId = await requireUserId(request);

  const userTeams = await getUserTeams(userId);

  const pickedTeam = userTeams[0]; // swapp for persisted option

  if (pickedTeam) {
    return redirect(`/dashboard/${pickedTeam.teams?.slug}`);
  }
}
