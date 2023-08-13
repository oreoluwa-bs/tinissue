import type { ActionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { AlertCircle } from "lucide-react";
import { requireUserId } from "~/features/auth";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { FormError } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { createTeam } from "~/features/teams";
import { createTeamSchema } from "~/features/teams/shared";

export async function action({ request }: ActionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const formObject = Object.fromEntries(formData) as { [x: string]: any };

  switch (request.method) {
    case "POST":
      const credentials = createTeamSchema.safeParse(formObject);

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
        await createTeam(credentials.data, userId);

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

// used here and in the route
export function CreateTeamForm({ Form, data, state }: any) {
  return (
    <>
      {(data?.formErrors?.length ?? 0) > 0 ? (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{data?.formErrors}</AlertDescription>
        </Alert>
      ) : null}

      <Form method="POST" action="/dashboard/team">
        <input
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
        )}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
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
