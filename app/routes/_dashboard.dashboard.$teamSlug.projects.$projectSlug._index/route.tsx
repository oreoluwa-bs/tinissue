import {
  json,
  // redirect,
  // type ActionArgs,
  type LoaderArgs,
} from "@remix-run/node";
import { Link, useFetcher, useLoaderData, useParams } from "@remix-run/react";
import { requireUserId } from "~/features/auth";
import { getProject } from "~/features/projects";
import { getProjectMilestones } from "~/features/projects/milestones";
import { statusValues } from "~/features/projects/milestones/shared";
import { MilestoneKanbanCard } from "./milestone-card";
import { Button } from "~/components/ui/button";
import { PlusCircleIcon } from "lucide-react";
import { CreateMilestoneForm } from "./create-milestone-form";
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

// export async function action({ request }: ActionArgs) {
//   const userId = await requireUserId(request);
//   const formData = await request.formData();
//   const formObject = Object.fromEntries(formData) as { [x: string]: any };

//   switch (request.method) {
//     case "POST":
//       const credentials = createProjectSchema.safeParse({
//         ...formObject,
//         ...(formObject.teamId && { teamId: Number(formObject.teamId) }),
//       });

//       if (!credentials.success) {
//         return json(
//           {
//             fields: formObject,
//             fieldErrors: credentials.error.flatten().fieldErrors,
//             formErrors: credentials.error.flatten().formErrors.join(", "),
//           },
//           { status: 400 },
//         );
//       }

//       try {
//         await createProject(credentials.data, userId);

//         return json(
//           {
//             fields: formObject,
//             fieldErrors: null,
//             formErrors: null,
//           },
//           { status: 201 },
//         );
//       } catch (error) {
//         return json(
//           {
//             fields: formObject,
//             fieldErrors: null,
//             formErrors: "Invalid Email/Password",
//           },
//           { status: 400 },
//         );
//       }

//     default:
//       return json(
//         {
//           fields: formObject,
//           fieldErrors: null,
//           formErrors: "Method not found",
//         },
//         { status: 400 },
//       );
//   }
// }

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
                const cliked = e.target as HTMLElement;

                console.log(cliked.getAttribute("role") === "button");

                if (cliked.getAttribute("role") === "button") {
                  e.preventDefault(); // Prevent anchor navigation
                  e.stopPropagation(); // Stop event propagation
                }
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
