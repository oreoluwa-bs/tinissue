import { CheckIcon, UserCircle } from "lucide-react";
import { useState } from "react";
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
import { cn } from "~/lib/utils";

interface ProjectCardProps {
  milestone: {
    id: number;
    slug: string | null;
    name: string;
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
    profilePhoto: string;
  }[];

  onAddAssignee?: (milestoneId: number, assigneeId: number) => void;
  onDeleteAssignee?: (milestoneId: number, assigneeId: number) => void;
}

function Noop(...v: any) {}

export function MilestoneKanbanCard({
  milestone,
  assignees = [],
  members = [],
  onAddAssignee = Noop,
  onDeleteAssignee = Noop,
}: ProjectCardProps) {
  const [openAssignees, setOpenAssignees] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-card p-4 text-card-foreground">
      <span className="inline-block text-[10px] text-gray-400">
        {milestone.slug}
      </span>
      <h3 className="font-medium">{milestone.name}</h3>
      <p className="text-xs text-gray-400">{milestone.description}</p>

      <Popover open={openAssignees} onOpenChange={setOpenAssignees}>
        <PopoverTrigger asChild>
          <div
            className="group mt-5 inline-flex"
            role="button"
            aria-expanded={openAssignees}
            onClick={(e) => {
              e.preventDefault();
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
                        src={member?.profilePhoto}
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
        <PopoverContent>
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
    </div>
  );
}

// <div role="button" className="mt-5 inline-flex -space-x-1">
//         {assignees.map((assignee) => (
//           <Avatar
//             key={assignee.id}
//             className="h-7 w-7 text-xs outline outline-foreground/10"
//           >
//             <AvatarImage src={assignee.profilePhoto} alt={assignee.fullName} />
//             <AvatarFallback>{assignee.initials}</AvatarFallback>
//           </Avatar>
//         ))}
//       </div>
