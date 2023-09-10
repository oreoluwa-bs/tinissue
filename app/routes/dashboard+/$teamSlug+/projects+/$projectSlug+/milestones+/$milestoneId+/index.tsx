import {
  json,
  redirect,
  type ActionArgs,
  type LinksFunction,
  type LoaderArgs,
} from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import format from "date-fns/format";
import { CalendarIcon, CheckIcon, Loader2Icon, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { ZodError } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~/components/ui/command";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useToast } from "~/components/ui/use-toast";
import { requireUserId } from "~/features/auth";
import { getProject } from "~/features/projects";
import {
  deleteMilestone,
  editMilestone,
  getProjectMilestone,
} from "~/features/projects/milestones";
import { statusValues } from "~/features/projects/milestones/shared";
import {
  APIError,
  InternalServerError,
  MethodNotSupported,
} from "~/lib/errors";
import { cn } from "~/lib/utils";
import {
  RichTextEditor,
  links as editorLinks,
} from "../components/rich-text-editor";

export const links: LinksFunction = () => [...editorLinks()];

export async function action({ params, request }: ActionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const formObject = Object.fromEntries(formData) as { [x: string]: any };

  const method = request.method;

  try {
    // const milestone = (await getProjectMilestone(params.milestoneId as string))
    //   .milestone;

    if (method === "PATCH") {
      const credentials = {
        ...formObject,
        ...(formData.getAll("assigneesId[]").length > 0 && {
          assigneesId: formData.getAll("assigneesId[]"),
        }),
        id: params.milestoneId as string,
      } as any;

      await editMilestone(credentials, userId);

      return json(
        {
          fields: formObject,
          fieldErrors: null,
          formErrors: null,
        },
        { status: 201 },
      );
    }

    if (method === "DELETE") {
      const credentials = {
        // ...formObject,
        id: params.milestoneId as string,
      } as any;

      await deleteMilestone(credentials, userId);

      return json(
        {
          fields: formObject,
          fieldErrors: null,
          formErrors: null,
        },
        { status: 201 },
      );
    }
    throw new MethodNotSupported();
  } catch (err) {
    if (err instanceof ZodError) {
      return json(
        {
          fields: formObject,
          fieldErrors: err.flatten().fieldErrors,
          formErrors: err.flatten().formErrors.join(", "),
        },
        { status: 400 },
      );
    }

    let error = err instanceof APIError ? err : new InternalServerError();

    return json(
      {
        fields: formObject,
        fieldErrors: null,
        formErrors: error.message,
        // meta: err.message ?? err,
      },
      { status: error.statusCode },
    );
  }
}

export async function loader({ params, request }: LoaderArgs) {
  const userId = await requireUserId(request);
  // const url = new URL(request.url);

  const project = await getProject(params.projectSlug as string);
  const milestone = await getProjectMilestone(params.milestoneId as string);

  if (!milestone || !project.project) {
    return redirect("/404");
  }

  return json({
    project,
    milestone,
    userId,
    teamSlug: params["teamSlug"],
  });
}

export default function MilestoneRoute() {
  // const params = useParams()
  const loaderData = useLoaderData<typeof loader>();
  // console.log(loaderData);
  const milestoneFetcher = useFetcher();

  return (
    <main className="py-6">
      <div className="mb-5 flex items-center justify-between">
        {/* <h2 className="">{loaderData.milestone.milestone.name}</h2> */}
      </div>
      <DisplayMilestone
        milestone={loaderData.milestone}
        fetcher={milestoneFetcher}
        projectMembers={loaderData.project.members}
        teamSlug={loaderData.teamSlug!}
        projectSlug={loaderData.project.project.slug!}
      />
    </main>
  );
}

interface DisplayMilestoneProps {
  milestone: Awaited<
    ReturnType<typeof useLoaderData<typeof loader>>
  >["milestone"];
  projectMembers: Awaited<
    ReturnType<typeof useLoaderData<typeof loader>>
  >["project"]["members"];

  fetcher: ReturnType<typeof useFetcher<any>>;
  teamSlug: string;
  projectSlug: string;
}

function DisplayMilestone({
  milestone,
  fetcher,
  projectMembers,
  teamSlug,
  projectSlug,
}: DisplayMilestoneProps) {
  const defaultDate = isNaN(
    Date.parse(fetcher?.data?.dueAt ?? milestone.milestone?.dueAt),
  )
    ? undefined
    : new Date(fetcher?.data?.dueAt ?? milestone.milestone?.dueAt);
  const [dueAt, setDueAt] = useState<Date | undefined>(defaultDate);
  const [dueAtTime, setDueAtTime] = useState<string>(
    defaultDate
      ? `${defaultDate.getHours().toString().padStart(2, "0")}:${defaultDate
          .getMinutes()
          .toString()
          .padStart(2, "0")}`
      : "09:00",
  );

  const [openAssigneesPopover, setOpenAssigneesPopover] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      if (fetcher.data.fieldErrors) {
        // console.log(fetcher.data.fieldErrors);
        toast({
          title: "Something went wrong",
          description: Object.entries(fetcher.data.fieldErrors)
            .map(([key, value]) => `${key}:${value}`)
            .join("\n"),
        });
      }
      if (fetcher.data.formErrors) {
        // console.log(fetcher.data.formErrors);
        toast({
          title: "Something went wrong",
          description: fetcher.data.formErrors,
        });
      }
    }
  }, [fetcher.data, fetcher.state, toast]);

  function handleDaySelect(date: Date | undefined) {
    if (!dueAtTime || !date) {
      setDueAt(date);
      return;
    }
    const [hours, minutes] = dueAtTime
      .split(":")
      .map((str) => parseInt(str, 10));
    const newDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hours,
      minutes,
    );
    setDueAt(newDate);
  }
  function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const time = e.target.value;
    if (!dueAt) {
      setDueAtTime(time);
      return;
    }
    const [hours, minutes] = time.split(":").map((str) => parseInt(str, 10));
    const newSelectedDate = new Date(
      dueAt.getFullYear(),
      dueAt.getMonth(),
      dueAt.getDate(),
      hours,
      minutes,
    );
    setDueAt(newSelectedDate);
    setDueAtTime(time);
  }

  function onBlur(
    e: React.FocusEvent<HTMLFormElement | HTMLInputElement, Element>,
  ) {
    const value = e.target.value;
    const key = e.target.name as keyof typeof milestone.milestone;

    if (milestone.milestone[key] === value) return;

    fetcher.submit(
      {
        name: milestone.milestone.name,
        [key]: value,
        id: milestone.milestone.id,
      },
      { method: "PATCH" },
    );
  }

  // todo if projectmember is not owner | admin
  const isFormDisabled = false;

  return (
    <div>
      <form>
        <div className="space-y-4">
          <div>
            <Input
              className="border-0 text-xl"
              name="name"
              defaultValue={milestone.milestone.name}
              onBlur={onBlur}
              disabled={isFormDisabled}
            />
          </div>

          <div className="space-y-4 px-3">
            <div className="flex flex-1 items-center  gap-2">
              <Label className="" htmlFor="status">
                Status
              </Label>
              <div>
                <Select
                  name="status"
                  defaultValue={milestone.milestone.status}
                  onValueChange={(value) => {
                    onBlur({ target: { value, name: "status" } } as any);
                  }}
                  disabled={isFormDisabled}
                >
                  <SelectTrigger id="status" className="min-w-[100px]">
                    <SelectValue
                      placeholder="Select status"
                      className="capitalize"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {statusValues.map((t) => {
                        return (
                          <SelectItem key={t} value={t} className="capitalize">
                            <span className="capitalize">
                              {t.toLowerCase()}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-1 items-center  gap-2">
              <Label className="" htmlFor="dueAt">
                Due Date
              </Label>
              <div>
                <Popover
                  onOpenChange={(v) => {
                    // Kind of like on blur. i.e if the popover changes from open to close
                    if (!v) {
                      onBlur({
                        target: {
                          value: !dueAt ? "" : dueAt.toUTCString(),
                          name: "dueAt",
                        },
                      } as any);
                    }
                  }}
                >
                  <PopoverTrigger disabled={isFormDisabled} asChild>
                    <Button
                      type="button"
                      id="dueAt"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueAt && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueAt ? (
                        format(dueAt, "PPP 'at' p")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <div className="flex items-start">
                      <Calendar
                        mode="single"
                        selected={dueAt}
                        onSelect={handleDaySelect}
                        initialFocus
                      />
                      <Label className="mb-2 px-3 py-3">
                        <span className="mb-2 inline-block">Time</span>
                        <Input
                          type="time"
                          defaultValue={dueAtTime}
                          onChange={handleTimeChange}
                        />
                      </Label>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex flex-1 items-center  gap-2">
              <Label htmlFor="assignees" className="mb-2">
                Assignees
              </Label>
              <div>
                <Popover
                  open={openAssigneesPopover}
                  onOpenChange={setOpenAssigneesPopover}
                >
                  <PopoverTrigger disabled={isFormDisabled} asChild>
                    <Button
                      className=""
                      name="assignees"
                      id="assignees"
                      type="button"
                      variant="ghost"
                      role="combobox"
                      aria-expanded={openAssigneesPopover}
                    >
                      {milestone?.assignees?.length > 0 ? (
                        <div className="inline-flex -space-x-1">
                          {milestone.assignees.slice(0, 4).map((value) => {
                            const member = projectMembers.find(
                              (framework) => framework.id === value?.id,
                            );

                            return (
                              <Avatar
                                key={member?.id}
                                className="h-7 w-7 touch-none text-xs outline outline-foreground/10"
                              >
                                <AvatarImage
                                  src={member?.profilePhoto ?? undefined}
                                  alt={member?.fullName}
                                />
                                <AvatarFallback>
                                  {member?.initials}
                                </AvatarFallback>
                              </Avatar>
                            );
                          })}
                        </div>
                      ) : (
                        <UserCircle
                          className="h-6 w-6 opacity-25 group-hover:opacity-100"
                          strokeWidth="1.5px"
                        />
                      )}
                      {/* <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" /> */}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Command>
                      <CommandInput
                        placeholder="Search Members..."
                        className="h-9"
                      />
                      {/* <CommandEmpty>No framework found.</CommandEmpty> */}
                      <CommandGroup>
                        {projectMembers.map((member) => {
                          const isSelected = milestone?.assignees
                            .map((i) => i?.id)
                            .includes(member.id);

                          return (
                            <CommandItem
                              key={member.id}
                              onSelect={() => {
                                const milestoneId = milestone.milestone.id;

                                if (isSelected) {
                                  // onDeleteAssignee(milestone.id, member.id);
                                  fetcher.submit(
                                    {
                                      milestoneId,
                                      assigneeId: member.id,
                                      errorAsToast: true,
                                    },
                                    {
                                      method: "DELETE",
                                      action: `/dashboard/${teamSlug}/projects/${projectSlug}/milestones/${milestoneId}/assignees`,
                                    },
                                  );
                                  return;
                                }

                                fetcher.submit(
                                  {
                                    milestoneId,
                                    "assigneesId[]": [member.id],
                                    errorAsToast: true,
                                  },
                                  {
                                    method: "POST",
                                    action: `/dashboard/${teamSlug}/projects/${projectSlug}/milestones/${milestoneId}/assignees`,
                                  },
                                );
                                return;
                              }}
                            >
                              {member.fullName}
                              <CheckIcon
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  isSelected ? "opacity-100" : "opacity-0",
                                )}
                              />
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <RichTextEditor
            className={cn(
              "min-h-[80px] w-full rounded-md border-0 border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
            // placeholder="What's this milestone about?"
            defaultContent={milestone.milestone.description ?? undefined}
            disabled={isFormDisabled}
            onBlur={({ editor }) => {
              fetcher.submit(
                {
                  name: milestone.milestone.name,
                  description: editor.getHTML(),
                  id: milestone.milestone.id,
                },
                { method: "PATCH" },
              );
            }}
          />
        </div>
      </form>
      <SavingIndicator active={fetcher.state !== "idle"} />
    </div>
  );
}

function SavingIndicator({ active }: { active: boolean }) {
  return (
    <div
      role="progressbar"
      aria-valuetext={active ? "Loading" : undefined}
      aria-hidden={!active}
      className={cn(
        "pointer-events-none fixed bottom-0 right-10 z-50 p-4 transition-all duration-500 ease-out",
        active ? "translate-y-0" : "translate-y-full",
        "inline-flex items-center gap-2 text-xs",
      )}
    >
      <Loader2Icon className={active ? "animate-spin" : ""} />
      <span>Saving</span>
    </div>
  );
}
