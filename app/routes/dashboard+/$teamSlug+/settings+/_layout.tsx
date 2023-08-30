// Sidebar with links to the differentt settings

import { Link, NavLink, Outlet, useLocation } from "@remix-run/react";
import { ChevronLeftIcon, MenuIcon } from "lucide-react";
import { useState } from "react";
import { Button, buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export default function SettingsLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const basePath = location.pathname.split("/settings")[0];

  return (
    <div className="grid gap-6 py-6 md:grid-cols-[200px_1fr]">
      {/* height of sticky nav */}
      <aside
        className={cn(
          "fixed left-0 top-[105px] z-[1]  w-full  self-start transition-transform md:sticky md:px-0",

          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div
          className={cn(
            " min-h-[calc(100vh_-_105px)] w-[80%] bg-background px-4 md:w-full",
          )}
        >
          <Sidebar
            basePath={basePath + "/settings"}
            onNavigate={() => {
              setIsOpen(false);
            }}
          />
        </div>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "absolute left-0 top-0 -z-10 h-full w-full bg-background/25 blur-md transition-transform",
          )}
        ></div>
      </aside>
      <div>
        {/* <Link
          to={basePath}
          className={buttonVariants({
            variant: "link",
            className: "-ml-5 mb-6 hover:no-underline md:hidden",
          })}
        >
          <ChevronLeftIcon /> Back
        </Link> */}
        <Button
          variant="ghost"
          className="-ml-5 mb-6 md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          <MenuIcon />
        </Button>

        <Outlet />
      </div>
    </div>
  );
}

const routes = [
  {
    url: () => ``,
    id: "general-settings",
    label: "General",
    //   icon: LayoutDashboard,
    isEnd: true,
  },
  {
    url: `/members`,
    id: "members",
    label: "Members",
    //   icon: FolderKanban,
    isEnd: true,
  },
];

function Sidebar({
  basePath,
  onNavigate,
}: {
  basePath: string;
  onNavigate: () => void;
}) {
  return (
    <div>
      <Link
        to={basePath.split("/settings")[0]}
        className={buttonVariants({
          variant: "link",
          className: "hover:no-underline",
        })}
      >
        <ChevronLeftIcon /> Back
      </Link>

      <div className="flex flex-col items-center gap-2 py-4">
        {routes.map((route) => {
          const url = typeof route.url === "function" ? route.url() : route.url;

          return (
            <NavLink
              key={route.id}
              to={basePath + url}
              className={({ isActive }) =>
                cn(
                  "group inline-flex h-10 w-full items-center rounded-md bg-background px-3 py-1 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                  isActive && "bg-accent/50",
                )
              }
              onClick={() => {
                onNavigate();
              }}
              end={route.isEnd}
            >
              {/* <route.icon strokeWidth={1.5} /> */}
              <span className="ml-2">{route.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
