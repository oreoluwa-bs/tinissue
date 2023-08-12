import { json, redirect, type LoaderArgs } from "@remix-run/node";
import {
  Form,
  NavLink,
  Outlet,
  useFetcher,
  useLoaderData,
} from "@remix-run/react";
import {
  ChevronsUpDown,
  FolderKanban,
  LayoutDashboard,
  PlusCircleIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { requireUserId } from "~/auth";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "~/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { CreateTeamForm } from "./_dashboard.dashboard.team.new";
import { getTeam, getUserTeams } from "~/features/teams";
import { getUserProfile } from "~/features/user";

export async function loader({ params, request }: LoaderArgs) {
  const userId = await requireUserId(request);

  const user = await getUserProfile(userId);

  if (!user) {
    return redirect(`/login?redirectTo=${request.url}`);
  }

  const userTeams = await getUserTeams(userId);

  const currentTeam = await getTeam(params["teamSlug"]);

  return json({
    user,
    teams: userTeams,
    currentTeam,
  });
}

export default function DashboardLayout() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <div className="relative flex min-h-screen flex-col">
      <Navbar
        user={loaderData.user}
        teams={loaderData.teams}
        currentTeam={loaderData.currentTeam}
      />
      <div className="flex-1 bg-gray-200 px-6">
        <Outlet />
        {/* <div className="h-[2000px] bg-red-200" /> */}
      </div>
    </div>
  );
}

const routes = [
  {
    url: (id: string) => `/dashboard/${id}`,
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    url: (id: string) => `/dashboard/${id}/projects`,
    id: "projects",
    label: "Projects",
    icon: FolderKanban,
  },
];

interface NavbarProps {
  user: ReturnType<typeof useLoaderData<typeof loader>>["user"];
  teams: ReturnType<typeof useLoaderData<typeof loader>>["teams"];
  currentTeam: ReturnType<typeof useLoaderData<typeof loader>>["currentTeam"];
}

function Navbar({ user, teams, currentTeam }: NavbarProps) {
  return (
    <header className="sticky top-0 border-b border-gray-300 bg-white px-6 py-2">
      <div className="flex  items-center justify-between">
        <div className="inline-flex items-center gap-5">
          <img src="/favicon.ico" alt="logo" className="w-8" />
          {/*  */}
          <TeamSwitcher teams={teams} currentTeam={currentTeam} />
        </div>

        <div className="inline-flex items-center gap-2">
          <Avatar>
            <AvatarImage src={user.profilePhoto} alt={user.fullName} />
            <AvatarFallback>{user.initials}</AvatarFallback>
          </Avatar>
          <Form method="POST" action="/logout">
            <Button size="sm">Logout</Button>
          </Form>
        </div>
      </div>
      <div className="-mx-3 flex items-center justify-between py-1">
        <div className="inline-flex items-center">
          {routes.map((route) => {
            const url =
              typeof route.url === "function"
                ? route.url(currentTeam.slug!)
                : route.url;

            return (
              <NavLink
                key={route.id}
                to={url}
                className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-3 py-1 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
              >
                <route.icon />
                <span className="ml-2">{route.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </header>
  );
}

function TeamSwitcher({
  teams,
  currentTeam,
}: {
  teams: NavbarProps["teams"];
  currentTeam: NavbarProps["currentTeam"];
}) {
  const [showNewTeamDialog, setShowNewTeamDialog] = useState(false);
  const [open, setOpen] = useState(false);

  const newTeam = useFetcher();

  useEffect(() => {
    if (showNewTeamDialog && newTeam.state === "idle" && newTeam.data) {
      console.log(newTeam);

      if (!newTeam.data.fieldErrors && !newTeam.data.formErrors) {
        setShowNewTeamDialog(false);
      }
    }
  }, [newTeam, newTeam.data, newTeam.state, showNewTeamDialog]);

  return (
    <Dialog open={showNewTeamDialog} onOpenChange={setShowNewTeamDialog}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select a team"
            className={"w-[200px] justify-between"}
          >
            <Avatar className="mr-2 h-5 w-5">
              <AvatarImage
                src={currentTeam.profileImage ?? "/favicon.ico"}
                alt={currentTeam.name ?? ""}
              />
              <AvatarFallback>{currentTeam.name?.[0]}</AvatarFallback>
            </Avatar>
            {currentTeam.name}
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          {/* Menu */}
          <Command>
            {/* <CommandInput placeholder="Type a command or search..." /> */}
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Teams">
                {teams.map((item) => {
                  const thisTeam = item.teams;
                  return (
                    <CommandItem key={thisTeam?.slug}>
                      <NavLink
                        to={`/dashboard/${thisTeam?.slug}`}
                        className="flex w-full"
                        key={thisTeam?.slug}
                        end
                      >
                        <Avatar className="mr-2 h-5 w-5 text-xs">
                          <AvatarImage
                            src={`${thisTeam?.profileImage ?? "/favicon.ico"}`}
                            alt={thisTeam?.name ?? ""}
                          />
                          <AvatarFallback>{thisTeam?.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <span>{thisTeam?.name}</span>
                      </NavLink>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <DialogTrigger asChild>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      setShowNewTeamDialog(true);
                    }}
                  >
                    <PlusCircleIcon className="mr-2 h-5 w-5" />
                    Create Team
                  </CommandItem>
                </DialogTrigger>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create team</DialogTitle>
          <DialogDescription>
            Add a new team to manage your projects.
          </DialogDescription>
        </DialogHeader>

        <CreateTeamForm
          Form={newTeam.Form}
          data={newTeam.data}
          state={newTeam.state}
        />
      </DialogContent>
    </Dialog>
  );
}
