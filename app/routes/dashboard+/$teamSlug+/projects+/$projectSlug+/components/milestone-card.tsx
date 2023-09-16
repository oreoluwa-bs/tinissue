import {
  CalendarIcon,
  CheckIcon,
  MoreHorizontalIcon,
  UserCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  // DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

import { cn, convertToPlain } from "~/lib/utils";
import { useFetcher } from "@remix-run/react";
import { useToast } from "~/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import {
  AlertDialogAction,
  AlertDialogCancel,
} from "@radix-ui/react-alert-dialog";
import { buttonVariants } from "~/components/ui/button";
import { DropdownMenuSub } from "@radix-ui/react-dropdown-menu";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Calendar } from "~/components/ui/calendar";
import format from "date-fns/format";
import {
  getDueStatus,
  getDueStatusColor,
} from "../milestones+/components/utils/dueAt";

interface ProjectCardProps {
  milestone: {
    id: number;
    slug: string | null;
    name: string;
    dueAt: Date | null;
    createdAt: Date;
    updatedAt: Date | null;
    description: string | null;
    status: "BACKLOG" | "TODO" | "IN PROGRESS" | "DONE" | "CANCELLED";
    projectId: number;
  };

  assignees?: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
    fullName: string;
    initials: string;
    profilePhoto: string;
  }[];
  members?: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
    fullName: string;
    initials: string;
    profilePhoto: string | null;
  }[];

  projectSlug: string;
  teamSlug: string;

  onAddAssignee?: (milestoneId: number, assigneeId: number) => void;
  onDeleteAssignee?: (milestoneId: number, assigneeId: number) => void;

  meta?: {
    nextStat: ProjectCardProps["milestone"]["status"] | null;
    prevStat: ProjectCardProps["milestone"]["status"] | null;
  };
}

function Noop(...v: any) {}

export function MilestoneKanbanCard({
  milestone,
  assignees = [],
  members = [],
  onAddAssignee = Noop,
  onDeleteAssignee = Noop,
  projectSlug,
  teamSlug,
  meta,
}: ProjectCardProps) {
  const [openAssignees, setOpenAssignees] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-card p-4 text-card-foreground">
      <div className="flex items-center justify-between">
        <div>
          <span className="inline-block text-[10px] text-gray-400">
            {milestone.slug}
          </span>
          <h3 className="font-medium">{milestone.name}</h3>
        </div>

        <CardMenu
          milestone={milestone}
          projectSlug={projectSlug}
          teamSlug={teamSlug}
          meta={meta}
        />
      </div>
      <p className="line-clamp-2 text-xs text-gray-400">
        {convertToPlain(milestone.description ?? "")}
      </p>

      <div className="mt-5 inline-flex items-center gap-3">
        <Popover open={openAssignees} onOpenChange={setOpenAssignees}>
          <PopoverTrigger asChild>
            <div
              className="group inline-flex"
              role="button"
              data-testid="assignee-propover-trigger"
              aria-expanded={openAssignees}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpenAssignees(true);
              }}
            >
              {assignees.length > 0 ? (
                <div className="inline-flex -space-x-1">
                  {assignees.slice(0, 4).map((value) => {
                    const member = members.find(
                      (framework) => framework.id === value.id,
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
                        <AvatarFallback>{member?.initials}</AvatarFallback>
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
            </div>
          </PopoverTrigger>
          <PopoverContent data-stop-propagation>
            <Command>
              <CommandInput placeholder="Search Members..." className="h-9" />
              {/* <CommandEmpty>No framework found.</CommandEmpty> */}
              <CommandGroup>
                {members.map((member) => {
                  const isSelected = assignees
                    .map((i) => i.id)
                    .includes(member.id);

                  return (
                    <CommandItem
                      key={member.id}
                      onSelect={() => {
                        if (isSelected) {
                          onDeleteAssignee(milestone.id, member.id);
                          return;
                        }
                        onAddAssignee(milestone.id, member.id);
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

        <DueDate
          milestone={milestone}
          projectSlug={projectSlug}
          teamSlug={teamSlug}
        />
      </div>
    </div>
  );
}

function CardMenu({
  milestone,
  teamSlug,
  projectSlug,
  meta,
}: {
  milestone: ProjectCardProps["milestone"];
  teamSlug: string;
  projectSlug: string;
  meta: ProjectCardProps["meta"];
}) {
  // const [openDialog, setOpenDialog] = useState<"DELETE_MILESTONE" | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const fetcher = useFetcher();

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

  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <MoreHorizontalIcon className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent data-stop-propagation>
        {/* <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Billing</DropdownMenuItem>
      <DropdownMenuItem>Subscription</DropdownMenuItem> */}
        <DropdownMenuSub data-stop-propagation>
          <DropdownMenuSubTrigger>Move</DropdownMenuSubTrigger>
          <DropdownMenuPortal data-stop-propagation>
            <DropdownMenuSubContent data-stop-propagation>
              {meta?.prevStat && (
                <DropdownMenuItem
                  onSelect={() => {
                    fetcher.submit(
                      { status: meta.prevStat },
                      {
                        method: "PATCH",
                        action: `/dashboard/${teamSlug}/projects/${projectSlug}/milestones/${milestone.id}/status`,
                      },
                    );
                  }}
                >
                  Move Left
                </DropdownMenuItem>
              )}
              {meta?.nextStat && (
                <DropdownMenuItem
                  onSelect={() => {
                    fetcher.submit(
                      { status: meta.nextStat },
                      {
                        method: "PATCH",
                        action: `/dashboard/${teamSlug}/projects/${projectSlug}/milestones/${milestone.id}/status`,
                      },
                    );
                  }}
                >
                  Move Right
                </DropdownMenuItem>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <AlertDialog
        // open={openDialog === "DELETE_MILESTONE"}
        // onOpenChange={(v) => {
        //   setOpenDialog(v ? "DELETE_MILESTONE" : null);
        // }}
        >
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                // setOpenDialog("DELETE_MILESTONE");
              }}
              className="text-destructive focus:bg-destructive"
            >
              Delete
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent data-stop-propagation>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                project and remove all data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>

              <AlertDialogAction
                type="submit"
                disabled={fetcher.state === "submitting"}
                className={buttonVariants({ variant: "destructive" })}
                onClick={(e) => {
                  // e.preventDefault();
                  fetcher.submit(
                    {},
                    {
                      method: "DELETE",
                      action: `/dashboard/${teamSlug}/projects/${projectSlug}/milestones/${milestone.id}`,
                    },
                  );
                  setIsDropdownOpen(false);
                }}
              >
                Delete Milestone
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DueDate({
  milestone,
  teamSlug,
  projectSlug,
}: {
  milestone: ProjectCardProps["milestone"];
  teamSlug: string;
  projectSlug: string;
}) {
  const fetcher = useFetcher();

  const defaultDate = isNaN(
    Date.parse(fetcher?.data?.dueAt ?? milestone?.dueAt),
  )
    ? undefined
    : new Date(fetcher?.data?.dueAt ?? milestone?.dueAt);
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
    const key = e.target.name as keyof typeof milestone;

    if (milestone[key] === value) return;

    fetcher.submit(
      {
        name: milestone.name,
        [key]: value,
        id: milestone.id,
      },
      {
        method: "PATCH",
        action: `/dashboard/${teamSlug}/projects/${projectSlug}/milestones/${milestone.id}`,
      },
    );
  }

  const isFormDisabled = false;

  return (
    <div className="leading-none">
      <Popover
        open={openAssigneesPopover}
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
          setOpenAssigneesPopover(v);
        }}
      >
        <PopoverTrigger disabled={isFormDisabled} asChild>
          <div
            role="button"
            id="dueAt"
            className={cn(
              "group w-full justify-start gap-1 text-left text-xs font-normal",
              "inline-flex items-center",
            )}
            data-testid="dueat-propover-trigger"
            aria-expanded={openAssigneesPopover}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpenAssigneesPopover(true);
            }}
          >
            <CalendarIcon
              className={cn(
                "h-6 w-6 opacity-25 group-hover:opacity-100",
                !["DONE", "CANCELLED"].includes(milestone.status) &&
                  getDueStatusColor(getDueStatus(dueAt ?? null)),
              )}
              strokeWidth="1.5px"
            />
            {dueAt ? format(dueAt, "d MMM") : null}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" data-stop-propagation>
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
  );
}
