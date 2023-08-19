import type { Form } from "@remix-run/react";
import { AlertCircle, CheckIcon } from "lucide-react";
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
import { Textarea } from "~/components/ui/textarea";
import { statusValues } from "~/features/projects/milestones/shared";
import { cn } from "~/lib/utils";

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
    profilePhoto: string;
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
  const [assignedMembers, setAssignedMembers] = useState<number[]>(
    data?.fields?.assigneesId ?? [],
  );

  // useEffect(() => {
  //   if (state === "idle" && data) {
  //     if (!data.fieldErrors && !data.formErrors) {
  //       ref.current?.reset();
  //     }
  //   }
  // }, [data, state]);

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
            <Textarea
              name="description"
              id="description"
              placeholder="What do you want to achieve?"
              defaultValue={data?.fields?.description}
              aria-invalid={Boolean(data?.fieldErrors?.description)}
              aria-errormessage={data?.fieldErrors?.description?.join(", ")}
            />
            <FormError>{data?.fieldErrors?.description}</FormError>
          </div>

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
                  value={member}
                  hidden
                />
              );
            })}
            <div>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    name="assignees"
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
                                src={member?.profilePhoto}
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
                        const isSelected = assignedMembers.includes(member.id);

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
