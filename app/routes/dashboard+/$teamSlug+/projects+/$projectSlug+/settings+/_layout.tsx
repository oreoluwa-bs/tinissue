// Sidebar with links to the differentt settings

import { NavLink, Outlet, useLocation } from "@remix-run/react";
import { cn } from "~/lib/utils";

export default function SettingsLayout() {
  return (
    <div className="grid gap-6 py-6 md:grid-cols-[200px_1fr]">
      {/* height of sticky nav */}
      <aside className="sticky top-[105px] self-start">
        <Sidebar />
      </aside>
      <div>
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

function Sidebar() {
  const location = useLocation();
  const basePath = location.pathname.split("/settings")[0] + "/settings";

  return (
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
            end={route.isEnd}
          >
            {/* <route.icon strokeWidth={1.5} /> */}
            <span className="ml-2">{route.label}</span>
          </NavLink>
        );
      })}
    </div>
  );
}
