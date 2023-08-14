import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

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
}

export function MilestoneKanbanCard({
  milestone,
  assignees = [],
}: ProjectCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-card-foreground">
      <span className="inline-block text-[10px] text-gray-400">
        {milestone.slug}
      </span>
      <h3 className="font-medium">{milestone.name}</h3>
      <p className="text-xs text-gray-400">{milestone.description}</p>

      <div className="mt-5 inline-flex -space-x-1">
        {assignees.map((assignee) => (
          <Avatar
            key={assignee.id}
            className="h-7 w-7 text-xs outline outline-foreground/10"
          >
            <AvatarImage src={assignee.profilePhoto} alt={assignee.fullName} />
            <AvatarFallback>{assignee.initials}</AvatarFallback>
          </Avatar>
        ))}
      </div>
    </div>
  );
}
