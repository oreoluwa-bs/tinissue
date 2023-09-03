import { defer, type LoaderArgs } from "@remix-run/node";
import { Await, useLoaderData } from "@remix-run/react";
import { Suspense } from "react";
import { requireUserId } from "~/features/auth";
import { getProject, projectProgressSegementation } from "~/features/projects";
import { NotFound } from "~/lib/errors";
import { ProgressSegmentationChart } from "./components/progress-segment-chart";

export async function loader({ params, request }: LoaderArgs) {
  await requireUserId(request);

  const project = (await getProject(params["projectSlug"] as string)).project;

  if (!project) {
    throw new NotFound();
  }

  return defer({
    project,
    progressSegmentation: projectProgressSegementation(project.id),
  });
}

export default function AnalyticsRoute() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <main>
      <h3 className="mb-4 text-xl">Analytics</h3>

      <Suspense fallback={<>...LOADING</>}>
        <Await
          resolve={loaderData.progressSegmentation}
          errorElement={<p>Error loading chart!</p>}
        >
          {(resolve) => (
            <ProgressSegmentationChart
              data={resolve.segments.map((t) => ({
                label: t.status,
                value: t.count,
              }))}
            />
          )}
        </Await>
      </Suspense>
    </main>
  );
}
