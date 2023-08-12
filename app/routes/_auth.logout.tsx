import type { ActionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { logout } from "~/auth";

export const action = async ({ request }: ActionArgs) => {
  return logout(request);
};

export const loader = async () => redirect("/");
