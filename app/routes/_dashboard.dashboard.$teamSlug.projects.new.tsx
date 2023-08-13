import type { ActionArgs } from "@remix-run/node";
import type { Form } from "@remix-run/react";
import { json } from "@remix-run/node";
import { AlertCircle } from "lucide-react";
import { requireUserId } from "~/features/auth";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { FormError } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useParams } from "@remix-run/react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { createProject } from "~/features/projects";
import { createProjectSchema } from "~/features/projects/shared";
import { type Team } from "~/db/schema/teams";
import { Textarea } from "~/components/ui/textarea";

export async function action({ request }: ActionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const formObject = Object.fromEntries(formData) as { [x: string]: any };

  switch (request.method) {
    case "POST":
      const credentials = createProjectSchema.safeParse({
        ...formObject,
        ...(formObject.teamId && { teamId: Number(formObject.teamId) }),
      });

      if (!credentials.success) {
        return json(
          {
            fields: formObject,
            fieldErrors: credentials.error.flatten().fieldErrors,
            formErrors: credentials.error.flatten().formErrors.join(", "),
          },
          { status: 400 },
        );
      }

      try {
        await createProject(credentials.data, userId);

        return json(
          {
            fields: formObject,
            fieldErrors: null,
            formErrors: null,
          },
          { status: 201 },
        );
      } catch (error) {
        return json(
          {
            fields: formObject,
            fieldErrors: null,
            formErrors: "Invalid Email/Password",
          },
          { status: 400 },
        );
      }

    default:
      return json(
        {
          fields: formObject,
          fieldErrors: null,
          formErrors: "Method not found",
        },
        { status: 400 },
      );
  }
}

interface CreateProjectFormProps {
  Form: typeof Form;
  data: any;
  state: "submitting" | "idle" | "loading";
  teams: Team[];
}

// used here and in the route
export function CreateProjectForm({
  Form,
  data,
  state,
  teams,
}: CreateProjectFormProps) {
  const params = useParams();

  const currentTeamSlug = params["teamSlug"] as string;
  const currentTeam = teams.find((t) => t.slug === currentTeamSlug);

  return (
    <>
      {(data?.formErrors?.length ?? 0) > 0 ? (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{data?.formErrors}</AlertDescription>
        </Alert>
      ) : null}

      <Form method="POST" action={`/dashboard/${currentTeamSlug}/projects/new`}>
        {/* <input
          name="type"
          id="type"
          placeholder="Type"
          hidden
          defaultValue={data?.fields?.type ?? "TEAM"}
          // defaultValue={data?.fields?.type}
          // aria-invalid={Boolean(data?.fieldErrors?.type)}
          // aria-errormessage={data?.fieldErrors?.type?.join(", ")}
        />
        {data?.fieldErrors?.type && (
          <FormError>{data?.fieldErrors?.type}</FormError>
        )} */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Project Name</Label>
            <Input
              name="name"
              id="name"
              placeholder="Product"
              defaultValue={data?.fields?.name}
              aria-invalid={Boolean(data?.fieldErrors?.name)}
              aria-errormessage={data?.fieldErrors?.name?.join(", ")}
            />
            <FormError>{data?.fieldErrors?.name}</FormError>
          </div>

          <div>
            <div hidden>
              <Label htmlFor="teamId">Team</Label>
              <Select name="teamId" defaultValue={currentTeam?.id.toString()}>
                <SelectTrigger id="teamId">
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {teams.map((t) => {
                      return (
                        <SelectItem key={t.id} value={t.id.toString()}>
                          {t.name}
                        </SelectItem>
                      );
                    })}
                    {/* <SelectLabel>Fruits</SelectLabel> */}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <FormError>{data?.fieldErrors?.teamId}</FormError>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              name="description"
              id="description"
              placeholder="Describe the project"
              defaultValue={data?.fields?.description}
              aria-invalid={Boolean(data?.fieldErrors?.description)}
              aria-errormessage={data?.fieldErrors?.description?.join(", ")}
            />
            <FormError>{data?.fieldErrors?.description}</FormError>
          </div>

          <div>
            <Button
              type="submit"
              disabled={state === "submitting"}
              className="w-full"
            >
              Create
            </Button>
          </div>
        </div>
      </Form>
    </>
  );
}
