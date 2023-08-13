import type { Project } from "~/db/schema/projects";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-card-foreground">
      <h3 className="font-medium">{project.name}</h3>
      {/* <p>{project.slug}</p> */}
    </div>
  );
}
