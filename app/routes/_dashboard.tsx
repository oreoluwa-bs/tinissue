import { json, redirect, type LoaderArgs } from "@remix-run/node";
import { NavLink, Outlet, useLoaderData } from "@remix-run/react";
import { eq, sql } from "drizzle-orm";
import { FolderKanban, LayoutDashboard } from "lucide-react";
import { requireUserId } from "~/auth";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { db } from "~/db/db.server";
import { users } from "~/db/schema/users";
import { cn } from "~/lib/utils";

export async function loader({ params, request }: LoaderArgs) {
  const userId = await requireUserId(request);

  const userRows = await db
    .selectDistinct({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      fullName: sql`CONCAT(${users.firstName},' ', ${users.lastName})`,
      initials: sql`CONCAT(LEFT(${users.firstName}, 1),LEFT(${users.lastName}, 1))`,
      email: users.email,
      profilePhoto: sql`CONCAT('','')`,
    })
    .from(users)
    .where(eq(users.id, userId));

  const user = userRows[0];

  if (!user) {
    return redirect(`/login?redirectTo=${request.url}`);
  }

  return json({
    user,
  });
}

export default function DashboardLayout() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <>
      {/* <Navbar /> */}
      <div className="grid min-h-screen grid-cols-[200px_1fr]">
        <Sidebar />
        <div>
          <Navbar user={loaderData.user} />
          <div className="px-6">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
}

const routes = [
  {
    url: "/dashboard",
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    url: "/dashboard/projects",
    id: "projects",
    label: "Projects",
    icon: FolderKanban,
  },
];

function Sidebar() {
  return (
    <div className="h-full border-r border-gray-300 bg-gray-200">
      <ul>
        {routes.map((route) => {
          return (
            <li key={route.id}>
              <NavLink
                to={route.url}
                className={cn(
                  "relative flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                )}
              >
                <route.icon />
                <span className="ml-2">{route.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface NavbarProps {
  user: ReturnType<typeof useLoaderData<typeof loader>>["user"];
}

function Navbar({ user }: NavbarProps) {
  return (
    <div className="bg-gray-20h0 border-b border-gray-300 px-6 py-2">
      <div className="flex  items-center justify-end">
        {/* <ul>Logout</ul> */}
        <Avatar>
          <AvatarImage src={user.profilePhoto} alt={user.fullName} />
          <AvatarFallback>{user.initials}</AvatarFallback>
        </Avatar>
        <Button size="sm">Logout</Button>
      </div>
    </div>
  );
}
