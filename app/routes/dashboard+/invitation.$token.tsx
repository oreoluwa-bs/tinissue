import {
  type ActionArgs,
  json,
  type LoaderArgs,
  redirect,
} from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { AlertCircle } from "lucide-react";
import { ZodError } from "zod";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  acceptInviteToTeam,
  getTeam,
  verifyInvitationToken,
} from "~/features/teams";
import { getUserByEmail } from "~/features/user";
import {
  APIError,
  BadRequest,
  InternalServerError,
  MethodNotSupported,
  Unauthorised,
} from "~/lib/errors";

export async function action({ params, request }: ActionArgs) {
  const formData = await request.formData();
  const formObject = Object.fromEntries(formData) as { [x: string]: any };

  const method = request.method;

  try {
    if (method === "PATCH") {
      try {
        const response = await acceptInviteToTeam(formObject["token"]);

        return redirect(`/dashboard/${response.team.slug}`);
      } catch (error) {
        if (error instanceof Unauthorised) {
          return redirect(
            `/signup?redirectTo=${request.url}&prefill[email]=${error.meta.email}`,
          );
        }
      }
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
  // try {
  const claims = verifyInvitationToken(params.token!);

  if (typeof claims === "string") {
    throw new BadRequest(claims);
  }
  const team = await getTeam(claims["teamId"]);

  //   const project = await getProject(claims['projectId']);
  const user = await getUserByEmail(claims["email"]);

  return json({
    team,
    user,
    claims,
    token: params.token,
  });
  // } catch (err) {
  //   let error =
  //     err instanceof APIError
  //       ? err
  //       : err instanceof Error
  //       ? new BadRequest(err.message)
  //       : new InternalServerError();

  //   throw error;
  // }
}

export default function InvitationPage() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto flex min-w-[500px] items-center justify-center rounded-lg border border-border px-4 py-4">
        <div>
          <p>Join {loaderData.team?.name}</p>
          <div className="mt-4">
            {(actionData?.formErrors?.length ?? 0) > 0 ? (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{actionData?.formErrors}</AlertDescription>
              </Alert>
            ) : null}
            <Form method="PATCH">
              <input
                name="token"
                id="token"
                defaultValue={loaderData.token}
                hidden
              />

              <Button>Accept Invite</Button>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
