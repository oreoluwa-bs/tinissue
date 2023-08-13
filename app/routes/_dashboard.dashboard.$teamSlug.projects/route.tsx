import { PlusCircleIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { CreateProjectForm } from "./create-project-form";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import {
  json,
  redirect,
  type LoaderArgs,
  type ActionArgs,
} from "@remix-run/node";
import { requireUserId } from "~/features/auth";
import { getUserTeams } from "~/features/teams";
import { Button } from "~/components/ui/button";
import type { Team } from "~/db/schema/teams";
import { getUserTeamProjects, createProject } from "~/features/projects";
import { createProjectSchema } from "~/features/projects/shared";

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

  const teamProjects = await getUserTeamProjects(currentTeam.teams.id, userId);

  return json({
    // user,
    teamProjects,
    teams: userTeams.map((item) => item.teams),
  });
}

export default function Index() {
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
    <main>
      <div className="flex items-center justify-between">
        <h2 className="">Projects</h2>
        <Dialog
          open={showNewProjectDialog}
          onOpenChange={setShowNewProjectDialog}
        >
          <DialogTrigger asChild>
            <Button>
              <PlusCircleIcon className="mr-2 h-5 w-5" />
              Create Project
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create team</DialogTitle>
              <DialogDescription>
                Add a new team to manage your projects.
              </DialogDescription>
            </DialogHeader>

            <CreateProjectForm
              teams={loaderData.teams as unknown as Team[]}
              Form={newProject.Form}
              data={newProject.data}
              state={newProject.state}
            />
          </DialogContent>
        </Dialog>
      </div>

      <section>
        {loaderData.teamProjects.map((project) => {
          return (
            <div key={project.id}>
              <h3>{project.name}</h3>
            </div>
          );
        })}
      </section>
    </main>
  );
}
