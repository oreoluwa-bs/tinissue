import type { LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { Button, buttonVariants } from "~/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { FormError } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { requireUserId } from "~/features/auth";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getTeam } from "~/features/teams";

export async function loader({ params, request }: LoaderArgs) {
  const userId = await requireUserId(request);
  // const url = new URL(request.url);

  const team = await getTeam(params.teamSlug!);

  if (team.type === "PERSONAL") {
    return redirect("/404");
  }

  return json({
    team,
    teamSlug: params.teamSlug,
    userId,
  });
}

export default function GeneralRoute() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <main>
      {/* <h2 className="mb-6 text-primary">General Settings</h2> */}

      <div className="space-y-7">
        <EditProjectForm
          team={{
            ...loaderData.team,
            createdAt: new Date(loaderData.team.createdAt),
            updatedAt: loaderData.team.updatedAt
              ? new Date(loaderData.team.updatedAt)
              : null,
            deletedAt: loaderData.team.deletedAt
              ? new Date(loaderData.team.deletedAt)
              : null,
          }}
          teamSlug={loaderData.teamSlug ?? ""}
        />

        <hr />

        <DeleteTeam
          team={{
            ...loaderData.team,
            createdAt: new Date(loaderData.team.createdAt),
            updatedAt: loaderData.team.updatedAt
              ? new Date(loaderData.team.updatedAt)
              : null,
            deletedAt: loaderData.team.deletedAt
              ? new Date(loaderData.team.deletedAt)
              : null,
          }}
          teamSlug={loaderData.teamSlug ?? ""}
        />
      </div>
    </main>
  );
}

interface BaseSettingsProps {
  team: {
    name: string | null;
    type: "PERSONAL" | "TEAM";
    id: number;
    createdAt: Date;
    updatedAt: Date | null;
    deletedAt: Date | null;
    slug: string | null;
    profileImage: string | null;
  };
  teamSlug: string;
}

interface EditProjectFormProps extends BaseSettingsProps {}

function EditProjectForm({ team, teamSlug }: EditProjectFormProps) {
  const fetcher = useFetcher();

  const defaultValues = {
    ...team,
    ...(fetcher.data?.fields ? fetcher.data.fields : {}),
  };

  return (
    <div>
      <h3 className="mb-4 text-xl">Edit Team</h3>
      {(fetcher.data?.formErrors?.length ?? 0) > 0 ? (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{fetcher.data?.formErrors}</AlertDescription>
        </Alert>
      ) : null}
      <fetcher.Form method="PATCH" action={`/dashboard/${team.slug}/`}>
        {/* <input
        name="id"
        id="id"
        placeholder="Project"
        hidden
        defaultValue={defaultValues.id}
        // aria-invalid={Boolean(fetcher.data?.fieldErrors?.id)}
        // aria-errormessage={fetcher.data?.fieldErrors?.id?.join(", ")}
      /> */}
        {fetcher.data?.fieldErrors?.id && (
          <FormError>{fetcher.data?.fieldErrors?.id}</FormError>
        )}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="mb-2">
              Project Name
            </Label>
            <Input
              name="name"
              id="name"
              placeholder="Product"
              defaultValue={defaultValues?.name}
              aria-invalid={Boolean(fetcher.data?.fieldErrors?.name)}
              aria-errormessage={fetcher.data?.fieldErrors?.name?.join(", ")}
            />
            <FormError>{fetcher.data?.fieldErrors?.name}</FormError>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={fetcher.state === "submitting"}>
              Save Changes
            </Button>
          </div>
        </div>
      </fetcher.Form>
    </div>
  );
}

function DeleteTeam({ team, teamSlug }: BaseSettingsProps) {
  const fetcher = useFetcher();

  return (
    <div>
      <h3 className="mb-4 text-xl">Delete Team</h3>
      <p className="mb-5 text-muted-foreground">
        Deleted teams are available for 14 days, before they are permanently
        deleted.
      </p>

      {(fetcher.data?.formErrors?.length ?? 0) > 0 ? (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{fetcher.data?.formErrors}</AlertDescription>
        </Alert>
      ) : null}

      {fetcher.data?.fieldErrors?.id && (
        <FormError>{fetcher.data?.fieldErrors?.id}</FormError>
      )}

      <div className="flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete Team</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                Deleted teams are available for 14 days, before they are
                permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <fetcher.Form method="DELETE" action={`/dashboard/${teamSlug}/`}>
                <AlertDialogAction
                  type="submit"
                  disabled={fetcher.state === "submitting"}
                  className={buttonVariants({ variant: "destructive" })}
                >
                  Delete Team
                </AlertDialogAction>
              </fetcher.Form>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
