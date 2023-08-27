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
import { useEffect, useId, useState } from "react";
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
import {
  type Active,
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  useSensors,
  PointerSensor,
  useSensor,
} from "@dnd-kit/core";
import { cn } from "~/lib/utils";

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
  const fetcher = useFetcher();
  const [isDragging, setIsDragging] = useState(false);
  const id = useId();
  const [active, setActvie] = useState<Active | null>(null);
  // console.log(loaderData);

  const activeMilestone = loaderData.milestones.find(
    (item) => item.milestone.id === active?.data?.current?.id,
  );

  const optimisticMilestones = [...loaderData.milestones].map((item) => {
    if (item.milestone.id !== Number(fetcher.formData?.get("id"))) return item;

    return {
      ...item,
      milestone: {
        ...item.milestone,
        status:
          (fetcher.formData?.get(
            "status",
          ) as (typeof loaderData.milestones)[0]["milestone"]["status"]) ??
          item.milestone.status,
      },
    };
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

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
        <DndContext
          id={id}
          sensors={sensors}
          onDragStart={(event) => {
            setActvie(event.active);
            setIsDragging(true);
          }}
          onDragEnd={({ over, active }) => {
            // setParent(over ? over.id : null);
            if (over?.data.current && active.data.current) {
              fetcher.submit(
                { status: over.data.current.stat, id: active.data.current.id },
                {
                  method: "PATCH",
                  action: `/dashboard/${params["teamSlug"]}/projects/${loaderData.project.project}/milestones/${active.data.current.id}/status`,
                },
              );
            }
            setIsDragging(false);
          }}
          onDragCancel={() => setIsDragging(false)}
          autoScroll={true}
        >
          <div className="flex h-[75vh] flex-1 gap-4  overflow-auto">
            {statusValues.map((stat, index, arr) => {
              const milestones = optimisticMilestones.filter(
                (item) => item.milestone.status === stat,
              );

              return (
                <Board
                  key={stat}
                  stat={stat}
                  project={loaderData.project}
                  milestones={milestones}
                  // milestones={[...newMilestoneList, ...newMi]}
                  newMilestone={newMilestone}
                  teamSlug={params["teamSlug"] as string}
                  prevStat={arr[index - 1] ?? null}
                  nextStat={arr[index + 1] ?? null}
                />
              );
            })}
          </div>
          <DragOverlay dropAnimation={null}>
            {isDragging && activeMilestone ? (
              <MilestoneKanbanCard
                milestone={{
                  ...activeMilestone.milestone,
                  createdAt: new Date(activeMilestone.milestone.createdAt),
                  updatedAt: activeMilestone.milestone.updatedAt
                    ? new Date(activeMilestone.milestone.updatedAt)
                    : null,
                }}
                projectSlug={loaderData.project.project.slug!}
                teamSlug={params["teamSlug"]!}
                assignees={activeMilestone.assignees.filter(Boolean) as any}
                members={loaderData.project.members}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
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
  prevStat,
  nextStat, // isDragging,
}: {
  stat: "BACKLOG" | "TODO" | "IN PROGRESS" | "DONE" | "CANCELLED";
  newMilestone: ReturnType<typeof useFetcher<any>>;
  project: ReturnType<typeof useLoaderData<typeof loader>>["project"];
  milestones: ReturnType<typeof useLoaderData<typeof loader>>["milestones"];
  teamSlug: string;
  nextStat: "BACKLOG" | "TODO" | "IN PROGRESS" | "DONE" | "CANCELLED" | null;
  prevStat: "BACKLOG" | "TODO" | "IN PROGRESS" | "DONE" | "CANCELLED" | null;
  // isDragging?: boolean;
}) {
  const { toast } = useToast();
  const [showNewMilestoneDialog, setShowNewMilestoneDialog] = useState(false);
  const { isOver, setNodeRef } = useDroppable({
    id: `BOARD_${stat}`,
    data: {
      stat,
    },
  });

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
      className="bordr flex-shrink-0 overflow-auto rounded-lg border-border bg-border/25"
      style={{ width: 350 }}
    >
      <div className="sticky top-0 z-10 flex items-baseline justify-between bg-primary p-4  text-primary-foreground">
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
      <div
        ref={setNodeRef}
        className={cn(
          "h-full space-y-4 overflow-x-hidden  rounded-[inherit] rounded-t-none px-4 py-4",
          isOver && " ring-2 ring-inset ring-primary",
        )}
      >
        {milestones.map((milestone) => {
          return (
            <DraggableCard
              key={milestone.milestone.id}
              id={milestone.milestone.id}
            >
              <Link
                to={`/dashboard/${teamSlug}/projects/${project.project.slug}/milestones/${milestone.milestone.id}`}
                key={milestone.milestone.id}
                className={"block"}
                onClick={(e) => {
                  blockPropagation(e);
                }}
                draggable="false"
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
                  meta={{
                    nextStat,
                    prevStat,
                  }}
                />
              </Link>
            </DraggableCard>
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

function DraggableCard({
  children,
  id,
}: {
  children: React.ReactNode;
  id: string | number;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `CARD_${id}`,
    data: {
      id: id,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn("touch-none transition-opacity", isDragging && "opacity-0")}
    >
      {children}
    </div>
  );
}
