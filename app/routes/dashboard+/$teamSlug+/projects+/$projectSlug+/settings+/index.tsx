import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
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
import { Textarea } from "~/components/ui/textarea";
import { requireUserId } from "~/features/auth";
import { getProject } from "~/features/projects";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { AlertCircle } from "lucide-react";

export async function loader({ params, request }: LoaderArgs) {
  const userId = await requireUserId(request);
  // const url = new URL(request.url);

  const project = await getProject(params.projectSlug as string);

  return json({
    project: project.project,
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
          project={loaderData.project}
          teamSlug={loaderData.teamSlug ?? ""}
        />

        <hr />

        <DeleteProject
          project={loaderData.project}
          teamSlug={loaderData.teamSlug ?? ""}
        />
      </div>
    </main>
  );
}

interface BaseSettingsProps {
  project: {
    id: number;
    slug: string | null;
    name: string;
    description: string | null;
    teamId: number;
  };
  teamSlug: string;
}

interface EditProjectFormProps extends BaseSettingsProps {}

function EditProjectForm({ project, teamSlug }: EditProjectFormProps) {
  const fetcher = useFetcher();

  const defaultValues = {
    ...project,
    ...(fetcher.data?.fields ? fetcher.data.fields : {}),
  };

  return (
    <div>
      <h3 className="mb-4 text-xl">Edit Project</h3>
      {(fetcher.data?.formErrors?.length ?? 0) > 0 ? (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{fetcher.data?.formErrors}</AlertDescription>
        </Alert>
      ) : null}
      <fetcher.Form
        method="PATCH"
        action={`/dashboard/${teamSlug}/projects/${project.slug}?index`}
      >
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

          <div>
            <Label htmlFor="description" className="mb-2">
              Description
            </Label>
            <Textarea
              name="description"
              id="description"
              placeholder="Describe the project"
              defaultValue={defaultValues.description}
              aria-invalid={Boolean(fetcher.data?.fieldErrors?.description)}
              aria-errormessage={fetcher.data?.fieldErrors?.description?.join(
                ", ",
              )}
            />
            <FormError>{fetcher.data?.fieldErrors?.description}</FormError>
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

function DeleteProject({ project, teamSlug }: BaseSettingsProps) {
  const fetcher = useFetcher();

  return (
    <div>
      <h3 className="mb-4 text-xl">Delete Project</h3>
      <p className="mb-5 text-muted-foreground">
        Permanently remove your project and all of its contents from the
        platform. This action is not reversible, so please continue with
        caution.
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
            <Button variant="destructive">Delete Project</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                project and remove all data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <fetcher.Form
                method="DELETE"
                action={`/dashboard/${teamSlug}/projects/${project.slug}?index`}
              >
                <AlertDialogAction
                  type="submit"
                  disabled={fetcher.state === "submitting"}
                  className={buttonVariants({ variant: "destructive" })}
                >
                  Delete Project
                </AlertDialogAction>
              </fetcher.Form>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
