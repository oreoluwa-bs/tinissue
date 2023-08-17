// import { PlusCircleIcon } from "lucide-react";
import {
  json,
  redirect,
  type ActionArgs,
  type LoaderArgs,
} from "@remix-run/node";
import {
  Form,
  Link,
  useFetcher,
  useLoaderData,
  useParams,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import type { Team } from "~/db/schema/teams";
import { requireUserId } from "~/features/auth";
import { createProject, getUserTeamProjects } from "~/features/projects";
import { createProjectSchema } from "~/features/projects/shared";
import { getUserTeams } from "~/features/teams";
import { CreateProjectForm } from "./create-project-form";
import { ProjectCard } from "./project-card";
import { Input } from "~/components/ui/input";

export async function action({ request }: ActionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const formObject = Object.fromEntries(formData) as { [x: string]: any };

  switch (request.method) {
    case "POST":
      const credentials = createProjectSchema.safeParse({
        ...formObject,
        ...(formObject.teamId && { teamId: Number(formObject.teamId) }),
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
        await createProject(credentials.data, userId);

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
            formErrors: "Invalid Email/Password",
          },
          { status: 400 },
        );
      }

    default:
      return json(
        {
          fields: formObject,
          fieldErrors: null,
          formErrors: "Method not found",
        },
        { status: 400 },
      );
  }
}

export async function loader({ params, request }: LoaderArgs) {
  const userId = await requireUserId(request);
  const userTeams = await getUserTeams(userId);

  const currentTeam = userTeams.find(
    (item) => item.teams.slug === params["teamSlug"],
  );

  if (!currentTeam) {
    return redirect("/404", { status: 404 });
  }

  const url = new URL(request.url);

  const teamProjects = await getUserTeamProjects(currentTeam.teams.id, userId, {
    search: url.searchParams.get("search") ?? undefined,
  });

  return json({
    // user,
    teamProjects,
    teams: userTeams.map((item) => item.teams),
  });
}

export default function Index() {
  const params = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const newProject = useFetcher();

  useEffect(() => {
    if (
      showNewProjectDialog &&
      newProject.state === "idle" &&
      newProject.data
    ) {
      if (!newProject.data.fieldErrors && !newProject.data.formErrors) {
        setShowNewProjectDialog(false);
      }
    }
  }, [newProject, newProject.data, newProject.state, showNewProjectDialog]);

  return (
    <main className="py-6">
      <div className="mb-5 flex items-center justify-between">
        {/* <h2 className="">Projects</h2> */}
        <Form>
          <div className="flex items-center gap-4">
            <Input name="search" id="search" placeholder="Search projects..." />
            <Button variant="secondary">Search</Button>
          </div>
        </Form>
        <Dialog
          open={showNewProjectDialog}
          onOpenChange={setShowNewProjectDialog}
        >
          <DialogTrigger asChild>
            <Button>
              {/* <PlusCircleIcon className="mr-2 h-5 w-5" /> */}
              Create Project
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
              <DialogDescription>
                Add a new project to your team
              </DialogDescription>
            </DialogHeader>

            <CreateProjectForm
              teams={loaderData.teams as unknown as Team[]}
              Form={newProject.Form}
              data={newProject.data}
              state={newProject.state}
              currentTeamSlug={params["teamSlug"] as string}
            />
          </DialogContent>
        </Dialog>
      </div>

      <section>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,250px),1fr))] gap-4">
          {loaderData.teamProjects.result.map((project) => {
            return (
              <Link
                key={project.id}
                to={`/dashboard/${params.teamSlug}/projects/${project.slug}`}
              >
                <ProjectCard
                  key={project.id}
                  project={{
                    ...project,
                    createdAt: new Date(project.createdAt),
                    updatedAt: project.updatedAt
                      ? new Date(project.updatedAt)
                      : null,
                  }}
                />
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
