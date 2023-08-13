import type { Project } from "~/db/schema/projects";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="rounded-lg border-border bg-background/50 p-4">
      <h3 className="font-medium">{project.name}</h3>
      {/* <p>{project.slug}</p> */}
    </div>
  );
}
