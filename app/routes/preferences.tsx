import { json, type ActionArgs } from "@remix-run/node";
import { prefs } from "~/features/preferences";

export async function action({ request }: ActionArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const cookie = await prefs.parse(cookieHeader);
  const formData = await request.formData();

  const theme = formData.get("theme") ?? "system";
  const newCookie = { ...cookie, theme: "system" };
  newCookie.theme = theme;

  return json(
    { theme },
    {
      headers: {
        "Set-Cookie": await prefs.serialize(newCookie),
      },
    },
  );
}
