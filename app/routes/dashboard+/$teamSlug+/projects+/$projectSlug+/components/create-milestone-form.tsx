import type { Form } from "@remix-run/react";
import { AlertCircle, CalendarIcon, CheckIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~/components/ui/command";
import { FormError } from "~/components/ui/form";
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
import { statusValues } from "~/features/projects/milestones/shared";
import { cn } from "~/lib/utils";
import { RichTextEditor } from "../milestones+/components/rich-text-editor";
import format from "date-fns/format";
import { Calendar } from "~/components/ui/calendar";

interface CreateMilestoneFormProps {
  Form: typeof Form;
  data: any;
  state: "submitting" | "idle" | "loading";
  project: { id: number; slug: string };
  members: {
    id: number;
    fullName: string;
    firstName: string | null;
    initials: string;
    lastName: string | null;
    profilePhoto: string | null;
  }[];
  status: "BACKLOG" | "TODO" | "IN PROGRESS" | "DONE" | "CANCELLED";
  teamSlug: string;
}

export function CreateMilestoneForm({
  Form,
  data,
  state,
  project,
  members,
  status = "BACKLOG",
  teamSlug,
}: CreateMilestoneFormProps) {
  const ref = useRef<HTMLFormElement | null>(null);
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState<string>(
    data?.fields?.description,
  );

  const [assignedMembers, setAssignedMembers] = useState<number[]>(
    data?.fields?.assigneesId ?? [],
  );

  const [dueAt, setDueAt] = useState<Date>();
  const [dueAtTime, setDueAtTime] = useState<string>("09:00");

  // useEffect(() => {
  //   if (state === "idle" && data) {
  //     if (!data.fieldErrors && !data.formErrors) {
  //       ref.current?.reset();
  //     }
  //   }
  // }, [data, state]);

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

  return (
    <>
      {(data?.formErrors?.length ?? 0) > 0 ? (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{data?.formErrors}</AlertDescription>
        </Alert>
      ) : null}

      <Form
        ref={ref}
        method="POST"
        action={`/dashboard/${teamSlug}/projects/${project.slug}/milestones?index`}
      >
        <input
          type="number"
          name="projectId"
          id="projectId"
          placeholder="Project"
          hidden
          defaultValue={project.id}
          // defaultValue={data?.fields?.type}
          // aria-invalid={Boolean(data?.fieldErrors?.type)}
          // aria-errormessage={data?.fieldErrors?.type?.join(", ")}
        />
        {data?.fieldErrors?.projectId && (
          <FormError>{data?.fieldErrors?.projectId}</FormError>
        )}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="mb-2">
              Milestone Name
            </Label>
            <Input
              name="name"
              id="name"
              placeholder="Write PRD for Feature X"
              defaultValue={data?.fields?.name}
              aria-invalid={Boolean(data?.fieldErrors?.name)}
              aria-errormessage={data?.fieldErrors?.name?.join(", ")}
            />
            <FormError>{data?.fieldErrors?.name}</FormError>
          </div>

          <div>
            <div>
              <Label htmlFor="status" className="mb-2">
                Status
              </Label>
              <Select name="status" defaultValue={status}>
                <SelectTrigger id="status">
                  <SelectValue
                    placeholder="Select milestone status"
                    className="capitalize"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {statusValues.map((t) => {
                      return (
                        <SelectItem key={t} value={t} className="capitalize">
                          <span className="capitalize">{t.toLowerCase()}</span>
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <FormError>{data?.fieldErrors?.status}</FormError>
          </div>

          <div>
            <Label htmlFor="description" className="mb-2">
              Description
            </Label>
            <input
              name="description"
              id="description"
              placeholder="What do you want to achieve?"
              defaultValue={description}
              aria-invalid={Boolean(data?.fieldErrors?.description)}
              aria-errormessage={data?.fieldErrors?.description?.join(", ")}
              hidden
            />
            <RichTextEditor
              className={cn(
                "min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              )}
              // placeholder="What do you want to achieve?"
              defaultContent={description}
              onChange={({ editor }) => {
                setDescription(editor.getHTML());
              }}
            />
            <FormError>{data?.fieldErrors?.description}</FormError>
          </div>

          <div className="flex gap-4">
            <div>
              <Label htmlFor="assignees" className="mb-2">
                Assignees
              </Label>
              {assignedMembers.map((member) => {
                return (
                  <input
                    key={member}
                    name="assigneesId[]"
                    className="w-5"
                    defaultValue={member}
                    hidden
                  />
                );
              })}
              <div>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      name="assignees"
                      id="assignees"
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                    >
                      {assignedMembers.length > 0
                        ? assignedMembers.map((value) => {
                            const member = members.find(
                              (framework) => framework.id === value,
                            );

                            return (
                              <Avatar
                                key={member?.id}
                                className="mr-2 h-6 w-6 text-xs"
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
                          })
                        : "Select Assignees"}
                      {/* <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" /> */}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Command>
                      <CommandInput
                        placeholder="Search Assignees..."
                        className="h-9"
                      />
                      {/* <CommandEmpty>No framework found.</CommandEmpty> */}
                      <CommandGroup>
                        {members.map((member) => {
                          const isSelected = assignedMembers.includes(
                            member.id,
                          );

                          return (
                            <CommandItem
                              key={member.id}
                              onSelect={() => {
                                setAssignedMembers((prev) => {
                                  const exists = prev.includes(member.id);

                                  if (exists) {
                                    return prev.filter((v) => v !== member.id);
                                  }

                                  return [...prev, member.id];
                                });
                                // setOpen(false)
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
              <FormError>{data?.fieldErrors?.assigneesId}</FormError>
            </div>
            <div className="flex-1">
              <Label className="mb-2" htmlFor="dueAt">
                Due Date
              </Label>
              <input
                name="dueAt"
                value={dueAt?.toUTCString() ?? undefined}
                hidden
              />
              <div>
                <Popover>
                  <PopoverTrigger asChild>
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
          </div>

          <div>
            <Button
              type="submit"
              disabled={state === "submitting"}
              className="w-full"
            >
              Create
            </Button>
          </div>
        </div>
      </Form>
    </>
  );
}
