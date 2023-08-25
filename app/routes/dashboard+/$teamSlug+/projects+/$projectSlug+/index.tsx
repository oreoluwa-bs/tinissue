import {
  json,
  // redirect,
  type ActionArgs,
  type LoaderArgs,
  redirect,
} from "@remix-run/node";
import { Link, useFetcher, useLoaderData, useParams } from "@remix-run/react";
import { requireUserId } from "~/features/auth";
import { editProject, getProject, deleteProject } from "~/features/projects";
import { getProjectMilestones } from "~/features/projects/milestones";
import { statusValues } from "~/features/projects/milestones/shared";
import { MilestoneKanbanCard } from "./components/milestone-card";
import { Button, buttonVariants } from "~/components/ui/button";
import { PlusCircleIcon } from "lucide-react";
import { CreateMilestoneForm } from "./components/create-milestone-form";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTrigger,
} from "~/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { useToast } from "~/components/ui/use-toast";
import { editProjectSchema } from "~/features/projects/shared";

export async function action({ params, request }: ActionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const formObject = Object.fromEntries(formData) as { [x: string]: any };

  const method = request.method;
  const project = (await getProject(params.projectSlug as string)).project;
  if (method === "PATCH") {
    const credentials = editProjectSchema.safeParse({
      ...formObject,
      id: project.id,
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
      await editProject(credentials.data, userId);

      return json(
        {
          fields: formObject,
          fieldErrors: null,
          formErrors: null,
        },
        { status: 200 },
      );
    } catch (error) {
      return json(
        {
          fields: formObject,
          fieldErrors: null,
          formErrors: error instanceof Error ? error.message : error,
        },
        { status: 400 },
      );
    }
  }

  if (method === "DELETE") {
    try {
      await deleteProject(project.id, userId);

      return redirect(`/dashboard/${params.teamSlug}/projects`);
    } catch (error) {
      return json(
        {
          fields: formObject,
          fieldErrors: null,
          formErrors: error instanceof Error ? error.message : error,
        },
        { status: 400 },
      );
    }
  }

  return json(
    {
      fields: formObject,
      fieldErrors: null,
      formErrors: "Method not found",
    },
    { status: 400 },
  );
}

export async function loader({ params, request }: LoaderArgs) {
  const userId = await requireUserId(request);
  // const url = new URL(request.url);

  const project = await getProject(params.projectSlug as string);
  const milestones = await getProjectMilestones(params.projectSlug as string);

  return json({
    project,
    milestones,
    userId,
  });
}

export default function ProjectRoute() {
  const params = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const newMilestone = useFetcher();
  // console.log(loaderData);

  return (
    <main className="py-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="">{loaderData.project.project.name}</h2>
        <Link
          to={`/dashboard/${params.teamSlug}/projects/${params.projectSlug}/settings`}
          className={buttonVariants({ variant: "outline" })}
        >
          {/* <PlusCircleIcon className="mr-2 h-5 w-5" /> */}
          Settings
        </Link>
      </div>

      <section>
        <div className="flex h-[75vh] flex-1 gap-4 overflow-auto">
          {statusValues.map((stat) => {
            const milestones = loaderData.milestones.filter(
              (item) => item.milestone.status === stat,
            );

            return (
              <Board
                key={stat}
                stat={stat}
                project={loaderData.project}
                milestones={milestones}
                newMilestone={newMilestone}
                teamSlug={params["teamSlug"] as string}
              />
            );
          })}
        </div>
      </section>
    </main>
  );
}

function Board({
  stat,
  newMilestone,
  project,
  teamSlug,
  milestones,
}: {
  stat: "BACKLOG" | "TODO" | "IN PROGRESS" | "DONE" | "CANCELLED";
  newMilestone: ReturnType<typeof useFetcher<any>>;
  project: ReturnType<typeof useLoaderData<typeof loader>>["project"];
  milestones: ReturnType<typeof useLoaderData<typeof loader>>["milestones"];
  teamSlug: string;
}) {
  const { toast } = useToast();
  const [showNewMilestoneDialog, setShowNewMilestoneDialog] = useState(false);

  useEffect(() => {
    if (newMilestone.state === "idle" && newMilestone.data) {
      if (!newMilestone.data.fieldErrors && !newMilestone.data.formErrors) {
        setShowNewMilestoneDialog(false);
      } else {
        if (
          newMilestone.data.formErrors &&
          newMilestone.data.fields.errorAsToast
        ) {
          toast({
            title: "Something went wrong!",
            description: newMilestone.data.formErrors,
          });
        }
      }
    }
  }, [newMilestone.data, newMilestone.state, toast]);

  const isCreateSuccess =
    !newMilestone.data?.fieldErrors && !newMilestone.data?.formErrors;

  return (
    <div
      key={stat}
      className="bordr flex-shrink-0 rounded-lg border-border bg-border/25 p-4"
      style={{ width: 350 }}
    >
      <div className="flex items-baseline justify-between">
        <h3 className="font-medium capitalize">{stat.toLowerCase()}</h3>

        <Dialog
          open={showNewMilestoneDialog}
          onOpenChange={setShowNewMilestoneDialog}
        >
          <DialogTrigger asChild>
            <Button variant="ghost">
              <PlusCircleIcon className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Milestone</DialogTitle>
              <DialogDescription>
                Add a new project to your team
              </DialogDescription>
            </DialogHeader>

            <CreateMilestoneForm
              Form={newMilestone.Form}
              data={!isCreateSuccess ? newMilestone.data : {}}
              state={newMilestone.state}
              project={{
                ...project.project,
                slug: project.project.slug!,
              }}
              status={stat}
              members={project.members ?? []}
              teamSlug={teamSlug}
            />
          </DialogContent>
        </Dialog>
      </div>
      <div className="mt-4 space-y-4">
        {milestones.map((milestone) => {
          return (
            <Link
              to={`/dashboard/${teamSlug}/projects/${project.project.slug}/milestones/${milestone.milestone.id}`}
              key={milestone.milestone.id}
              className="block"
              onClick={(e) => {
                blockPropagation(e);
              }}
            >
              <MilestoneKanbanCard
                key={milestone.milestone.id}
                milestone={{
                  ...milestone.milestone,
                  createdAt: new Date(milestone.milestone.createdAt),
                  updatedAt: milestone.milestone.updatedAt
                    ? new Date(milestone.milestone.updatedAt)
                    : null,
                }}
                projectSlug={project.project.slug!}
                teamSlug={teamSlug}
                assignees={milestone.assignees.filter(Boolean) as any}
                members={project.members}
                onAddAssignee={(milestoneId, assigneeId) => {
                  newMilestone.submit(
                    {
                      milestoneId,
                      "assigneesId[]": [assigneeId],
                      errorAsToast: true,
                    },
                    {
                      method: "POST",
                      action: `/dashboard/${teamSlug}/projects/${project.project.slug}/milestones/${milestoneId}/assignees`,
                    },
                  );
                }}
                onDeleteAssignee={(milestoneId, assigneeId) => {
                  newMilestone.submit(
                    {
                      milestoneId,
                      assigneeId: assigneeId,
                      errorAsToast: true,
                    },
                    {
                      method: "DELETE",
                      action: `/dashboard/${teamSlug}/projects/${project.project.slug}/milestones/${milestoneId}/assignees`,
                    },
                  );
                }}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function blockPropagation(e: React.MouseEvent<HTMLElement, MouseEvent>) {
  let clickedElement = e.target as HTMLElement | null;

  while (clickedElement) {
    if (clickedElement.getAttribute("data-stop-propagation")) {
      // The clicked element or one of its parents has the stop-prop data attribute.
      // console.log("stopped");
      e.preventDefault(); // Prevent anchor navigation
      e.stopPropagation(); // Stop event propagation
    }

    if (e.currentTarget === clickedElement) {
      clickedElement = null;
    }
    clickedElement = clickedElement?.parentElement ?? null;
  }
}
