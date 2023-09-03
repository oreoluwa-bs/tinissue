import { AlertDialogTitle } from "@radix-ui/react-alert-dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import {
  json,
  redirect,
  type ActionArgs,
  type LoaderArgs,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useFetcher,
  useLoaderData,
  useLocation,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import { createColumnHelper, type Row } from "@tanstack/react-table";
import { Loader2Icon, MoreHorizontalIcon, SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { ZodError } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button, buttonVariants } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  // DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { FormError } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useToast } from "~/components/ui/use-toast";
import { requireUserId } from "~/features/auth";
import {
  deleteTeamMember,
  editTeamMember,
  getTeam,
  getTeamMembers,
  inviteToTeam,
} from "~/features/teams";
import {
  APIError,
  InternalServerError,
  MethodNotSupported,
  NotFound,
} from "~/lib/errors";
import { cn } from "~/lib/utils";
import { MembersDataTable } from "./components/members-data-table";

export async function action({ params, request }: ActionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const formObject = Object.fromEntries(formData) as { [x: string]: any };

  const method = request.method;

  try {
    const team = await getTeam(params.teamSlug as string);

    if (!team) {
      throw new NotFound();
    }

    if (method === "POST") {
      const credentials = { teamId: team.id, ...formObject } as Parameters<
        typeof inviteToTeam
      >[0];

      await inviteToTeam(credentials, userId);
      return json(
        { fields: formObject, fieldErrors: null, formErrors: null },
        { status: 201 },
      );
    }

    if (method === "PATCH") {
      const credentials = {
        ...formObject,
        id: team.id,
      } as any;

      await editTeamMember(credentials, userId);

      return json(
        { fields: formObject, fieldErrors: null, formErrors: null },
        { status: 200 },
      );
    }

    if (method === "DELETE") {
      await deleteTeamMember(
        {
          id: team.id,
          userId: Number(formObject["userId"]),
          ...formObject,
        },
        userId,
      );

      return json(
        {
          fields: formObject,
          fieldErrors: null,
          formErrors: null,
        },
        { status: 201 },
      );
    }

    throw new MethodNotSupported();
  } catch (err) {
    if (err instanceof ZodError) {
      return json(
        {
          fields: formObject,
          fieldErrors: err.flatten().fieldErrors,
          formErrors: err.flatten().formErrors.join(", "),
        },
        { status: 400 },
      );
    }

    let error = err instanceof APIError ? err : new InternalServerError();

    return json(
      {
        fields: formObject,
        fieldErrors: null,
        formErrors: error.message,
      },
      { status: error.statusCode },
    );
  }
}

export async function loader({ params, request }: LoaderArgs) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);

  const team = await getTeam(params.teamSlug!);

  if (team.type === "PERSONAL" || !team) {
    return redirect("/404");
  }

  // await sleep(10000);
  const teamMembers = await getTeamMembers(team.id, userId, {
    query: url.searchParams.get("q") ?? undefined,
  });

  return json({
    team,
    teamSlug: params.teamSlug,
    userId,
    teamMembers,
  });
}

type ColumnRow = Awaited<ReturnType<typeof getTeamMembers>>[0];
const columnHelper = createColumnHelper<ColumnRow>();

const columns = [
  columnHelper.accessor("user.fullName", {
    header: "Member",
    cell(props) {
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-6 w-6 text-sm">
            <AvatarImage
              src={props.row.original.user.profilePhoto ?? undefined}
              alt={props.row.original.user.fullName}
            />
            <AvatarFallback>{props.row.original.user.initials}</AvatarFallback>
          </Avatar>
          <span>{props.getValue()}</span>
        </div>
      );
    },
  }),

  columnHelper.accessor("team_members.role", {
    header: "Role",
    cell(props) {
      const meta = props.column.columnDef.meta;
      // @ts-ignore
      const isAdmin = meta?.isAdmin;
      // @ts-ignore
      const isOwner = meta?.isOwner;

      const disabled =
        // @ts-ignore
        (meta?.currentUser?.userId === props.row.original.team_members.userId &&
          isOwner) ||
        (props.row.original.team_members.role === "OWNER" && !isOwner);

      return isAdmin ? (
        <SelectRole rows={props.row} disabled={disabled} isOwner={isOwner} />
      ) : (
        <span className="capitalize">{props.getValue()?.toLowerCase()}</span>
      );
    },
    maxSize: 150,
  }),

  columnHelper.display({
    id: "actions",
    cell(props) {
      const meta = props.column.columnDef.meta as any;

      return <RowActions row={props.row} meta={meta} />;
    },
    maxSize: 100,
  }),
];

function SelectRole({
  rows,
  disabled,
  isOwner,
}: {
  rows: Row<ColumnRow>;
  disabled: boolean;
  isOwner: boolean;
}) {
  const fetcher = useFetcher();

  const { toast } = useToast();

  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      if (
        (fetcher.data.formErrors?.length ?? 0) > 0 ||
        fetcher.data.fieldErrors
      ) {
        toast({
          title: "Something went wrong",
          description:
            fetcher.data.formErrors ||
            Object.entries(fetcher.data.fieldErrors)
              .map(([key, value]) => value)
              .join("\n"),
        });
      }
    }
  }, [fetcher.data, fetcher.state, toast]);

  return (
    <Select
      name="role"
      defaultValue={rows.original.team_members.role ?? "MEMBER"}
      onValueChange={(v) => {
        fetcher.submit(
          { role: v, userId: rows.original.team_members.userId },
          { method: "PATCH" },
        );
      }}
      disabled={disabled}
    >
      <SelectTrigger id="role">
        <SelectValue placeholder="Select theme" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="OWNER" disabled={!isOwner}>
            Owner
          </SelectItem>
          <SelectItem value="ADMIN">Admin</SelectItem>
          <SelectItem value="MEMBER">Member</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function RowActions({
  row,
  meta,
}: {
  row: Row<ColumnRow>;
  meta: { [key: string]: any };
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const fetcher = useFetcher();

  const { toast } = useToast();

  //  const isAdmin = meta?.isAdmin;
  const isOwner = meta?.isOwner;
  const deleteDisabled =
    (meta?.currentUser?.userId === row.original.team_members.userId &&
      isOwner) ||
    row.original.team_members.role === "OWNER";

  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      if (fetcher.data.formErrors || fetcher.data.fieldErrors) {
        toast({
          title: "Something went wrong",
          description:
            fetcher.data.formErrors ||
            Object.entries(fetcher.data.fieldErrors)
              .map(([key, value]) => `${key}:${value}`)
              .join("\n"),
        });
      }
    }
  }, [fetcher.data, fetcher.state, toast]);

  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <MoreHorizontalIcon className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
              }}
              className="text-destructive focus:bg-destructive"
              disabled={deleteDisabled}
            >
              Remove
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This would remove {row.original.user.fullName} from this team
                and prevent them from accessing any projects they are members
                of.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>

              <AlertDialogAction
                type="submit"
                // disabled={fetcher.state === "submitting"}
                className={buttonVariants({ variant: "destructive" })}
                onClick={(e) => {
                  // e.preventDefault();
                  fetcher.submit(
                    { userId: row.original.team_members.userId },
                    { method: "DELETE" },
                  );
                  setIsDropdownOpen(false);
                }}
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const MEMBER_HIDDEN_COLUMNS = ["actions"];

export default function MembersRoute() {
  const navigation = useNavigation();
  const location = useLocation();
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams, setSearchParams] = useSearchParams();
  // const fetcher = useFetcher();

  const currentMember = loaderData.teamMembers.find(
    (i) => i.team_members.userId === loaderData.userId,
  );

  const isOwner = currentMember?.team_members.role === "OWNER";
  const isAdmin = isOwner || currentMember?.team_members.role === "ADMIN";

  const isSearching =
    navigation.state !== "idle" &&
    navigation.location.pathname === location.pathname;

  const { toast } = useToast();

  useEffect(() => {
    if (navigation.state === "idle" && actionData) {
      if ((actionData.formErrors?.length ?? 0) > 0 || actionData.fieldErrors) {
        toast({
          title: "Something went wrong",
          description:
            actionData.formErrors ||
            Object.entries(actionData.fieldErrors as any)
              .map(([key, value]) => value)
              .join("\n"),
        });
      }
    }
  }, [actionData, navigation.state, toast]);

  return (
    <main>
      <h3 className="mb-4 text-xl">Manage Access</h3>

      <div>
        <div className="flex items-center py-4">
          <div className="relative inline-flex flex-1 items-center">
            <span
              className={cn("absolute left-3", isSearching && "animate-spin")}
            >
              {isSearching ? (
                <Loader2Icon className="h-4 w-4" />
              ) : (
                <SearchIcon className="h-4 w-4" />
              )}
            </span>

            <Input
              placeholder="Filter members..."
              defaultValue={searchParams.get("q") ?? undefined}
              onChange={(event) => {
                setSearchParams((prev) => {
                  const obj = Object.fromEntries(prev);
                  return {
                    ...obj,
                    q: event.target.value,
                  };
                });
              }}
              className="max-w-sm pl-10"
            />
          </div>
          {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu> */}
          <div>
            <Dialog>
              <DialogTrigger>Add Member</DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite to team</DialogTitle>
                  <DialogDescription>
                    Add a member to {loaderData.team.name}
                  </DialogDescription>
                </DialogHeader>

                <InviteToTeamForm
                  Form={Form}
                  data={actionData}
                  state={navigation.state}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <MembersDataTable
          columns={
            columns
              .map((col) => {
                col.meta = {
                  currentUser: currentMember?.team_members,
                  isOwner: isOwner,
                  isAdmin: isAdmin,
                };
                return col;
              })
              .filter((col) => {
                if (!col.id) return col;

                if (!isAdmin) {
                  return !MEMBER_HIDDEN_COLUMNS.includes(col.id);
                }

                return col;
              }) as any
          }
          data={loaderData.teamMembers}
        />
      </div>
    </main>
  );
}

type InviteToTeamFormProps = {
  Form: typeof Form;
  data: any;
  state: "submitting" | "idle" | "loading";
};
function InviteToTeamForm({ Form, data, state }: InviteToTeamFormProps) {
  return (
    <Form method="POST">
      <div className="space-y-4">
        <div>
          <Input
            type="email"
            name="email"
            id="email"
            placeholder="Email Address"
            defaultValue={data?.fields?.email}
            aria-invalid={Boolean(data?.fieldErrors?.email)}
            aria-errormessage={data?.fieldErrors?.email?.join(", ")}
          />
          <FormError>{data?.fieldErrors?.email}</FormError>
        </div>
        <div>
          <Button type="submit" disabled={state === "submitting"}>
            Invite
          </Button>
        </div>
      </div>
    </Form>
  );
}
