import { json, type LoaderArgs } from "@remix-run/node";
import {
  Link,
  NavLink,
  Outlet,
  useLoaderData,
  useLocation,
} from "@remix-run/react";
import { requireUserId } from "~/features/auth";
import { cn } from "~/lib/utils";

import { getProject, getProjectMember } from "~/features/projects";
import { NotFound } from "~/lib/errors";
import { buttonVariants } from "~/components/ui/button";
import { HomeIcon } from "lucide-react";

export async function loader({ params, request }: LoaderArgs) {
  const userId = await requireUserId(request);

  const project = await getProject(params.projectSlug as string);

  if (!project.project) {
    throw new NotFound();
  }

  const currentProjectMember = await getProjectMember(
    project.project.id,
    userId,
  );

  if (!currentProjectMember) {
    throw new NotFound();
  }

  return json({
    project: project.project,
    currentProjectMember,
    teamSlug: params["teamSlug"],
  });
}

export let handle = { mainNav: { hidden: true } };

export default function ProjectLayout() {
  const loaderData = useLoaderData<typeof loader>();
  const location = useLocation();
  const basePath = location.pathname.split(`/${loaderData.project.slug}`)[0];

  return (
    <div>
      <div className="sticky top-[57px] z-20 bg-background">
        <Navbar
          basePath={basePath + `/${loaderData.project.slug}`}
          teamSlug={loaderData.teamSlug!}
          currentMember={loaderData.currentProjectMember}
        />
      </div>
      <Outlet />
    </div>
  );
}

const routes = [
  {
    url: () => ``,
    id: "overview",
    label: "Overview",
    // hidden: ({ role }: { role: "OWNER" | "ADMIN" | "MEMBER" }) => {
    //   return !["OWNER", "ADMIN"].includes(role);
    // },
    isEnd: true,
  },
  {
    url: `/analytics`,
    id: "analytics",
    label: "Analytics",
    // hidden: ({ role }: { role: "OWNER" | "ADMIN" | "MEMBER" }) => {
    //   return !["OWNER", "ADMIN"].includes(role);
    // },
    isEnd: true,
  },
  {
    url: `/settings`,
    id: "settings",
    label: "Settings",
    hidden: ({ role }: { role: "OWNER" | "ADMIN" | "MEMBER" }) => {
      return !["OWNER", "ADMIN"].includes(role);
    },
    isEnd: true,
  },
];

function Navbar({
  teamSlug,
  basePath,
  currentMember,
}: {
  teamSlug: string;
  basePath: string;
  currentMember: {
    userId: number;
    teamId: number;
    role: "OWNER" | "ADMIN" | "MEMBER" | null;
    projectId: number;
  };
}) {
  return (
    <header className="-mx-0 flex items-center justify-between py-1">
      <Link
        to={basePath.split(`/${teamSlug}`)[0] + `/${teamSlug}`}
        className={cn(
          buttonVariants({
            variant: "link",
            size: "icon",
            className: "-ml-3 hover:no-underline",
          }),
        )}
      >
        <HomeIcon strokeWidth={1.5} />
        {/* Back */}
      </Link>
      <div className="mx-2 h-[40px] w-[1px] rotate-12 bg-border" />
      <div
        className="inline-flex flex-1 items-center border-b py-1"
        role="navigation"
      >
        {routes.map((route) => {
          const url = typeof route.url === "function" ? route.url() : route.url;

          if (route?.hidden?.({ role: currentMember.role! })) return null;

          return (
            <NavLink
              key={route.id}
              to={basePath + url}
              className={({ isActive }) =>
                cn(
                  "group relative inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-3 py-1 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                )
              }
              end={route.isEnd}
            >
              {({ isActive }) => (
                <>
                  <span className="">{route.label}</span>
                  <span
                    className={cn(
                      "absolute bottom-[-4px] left-0 h-[1px] w-full",
                      isActive && "bg-primary",
                    )}
                  />
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </header>
  );
}
