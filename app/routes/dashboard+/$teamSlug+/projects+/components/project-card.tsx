import { useFetcher, useNavigate } from "@remix-run/react";
import { useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import type { Project } from "~/db/schema/projects";

interface ProjectCardProps {
  project: Project;
  teamSlug: string;
}

export function ProjectCard({ project, teamSlug }: ProjectCardProps) {
  const navigate = useNavigate();
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.state === "idle" && !fetcher.data) {
      fetcher.load(
        `/dashboard/${teamSlug}/projects/${project.slug}/analytics/progress?type=mini`,
      );
    }
  }, [fetcher, project.slug, teamSlug]);

  const progress: number = fetcher?.data?.data?.percentage ?? 0;

  return (
    <div className="rounded-lg border border-border bg-card p-4 text-card-foreground">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{project.name}</h3>
        <div data-stop-propagation>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  role="button"
                  onClick={() => {
                    navigate(
                      `/dashboard/${teamSlug}/projects/${project.slug}/analytics`,
                    );
                  }}
                  className="relative"
                >
                  <div
                    className="radial-progress absolute text-[9px] text-muted"
                    style={{
                      position: "absolute",
                      /* @ts-ignore */
                      "--value": 100,
                      "--size": "2rem",
                      "--thickness": "6px",
                    }}
                  />
                  <div
                    className="radial-progress text-[9px] text-green-400"
                    style={{
                      /* @ts-ignore */
                      "--value": Math.round(progress),
                      "--size": "2rem",
                      "--thickness": "6px",
                    }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px] text-xs">
                {Math.round(progress)}% of milestones has been completed
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      {/* <p>{project.slug}</p> */}
    </div>
  );
}
