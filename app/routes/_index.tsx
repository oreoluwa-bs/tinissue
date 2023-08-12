import type { LoaderArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { getUserId } from "~/features/auth";

export async function loader({ request }: LoaderArgs) {
  const userId = await getUserId(request);

  if (userId) {
    return redirect("/dashboard");
  }

  return redirect("/login?redirectTo=/dashboard");
}

export default function Index() {
  return (
    <main>
      <h2 className="text-primary">Hello</h2>
    </main>
  );
}
