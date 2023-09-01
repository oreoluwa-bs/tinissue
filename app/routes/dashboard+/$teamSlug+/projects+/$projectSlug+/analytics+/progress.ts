import { json, type LoaderArgs } from "@remix-run/node";
import { requireUserId } from "~/features/auth";
import {
  getProject,
  projectDoneProgressInPercentage,
  projectProgressSegementation,
} from "~/features/projects";

export async function loader({ params, request }: LoaderArgs) {
  await requireUserId(request);
  const url = new URL(request.url);

  const project = (await getProject(params.projectSlug as string | number))
    .project;

  switch (url.searchParams.get("type")) {
    case "mini":
      return json({ data: await projectDoneProgressInPercentage(project.id) });

    default:
      return json({ data: await projectProgressSegementation(project.id) });
  }
}
