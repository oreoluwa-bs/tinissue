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
  acceptInviteToProject,
  getProject,
  getProjectInvite,
} from "~/features/projects";
import {
  acceptInviteToTeam,
  getTeam,
  getTeamInvite,
  verifyInvitationToken as verifyTeamsInvitationToken,
} from "~/features/teams";
import { getUserByEmail } from "~/features/user";
import {
  APIError,
  BadRequest,
  InternalServerError,
  MethodNotSupported,
  NotFound,
  Unauthorised,
} from "~/lib/errors";

function verifyInvitationToken(token: string) {
  return verifyTeamsInvitationToken(token);
}

export async function action({ params, request }: ActionArgs) {
  const formData = await request.formData();
  const formObject = Object.fromEntries(formData) as { [x: string]: any };

  const method = request.method;

  try {
    if (method === "PATCH") {
      const claims = verifyInvitationToken(formObject["token"]);

      if (typeof claims === "string") {
        throw new BadRequest(claims);
      }

      const scope = claims["scope"] as "project" | "team";

      if (!scope) throw new NotFound("Invalid Token");

      if (scope === "team") {
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

      if (scope === "project") {
        try {
          const response = await acceptInviteToProject(formObject["token"]);

          return redirect(`/dashboard/${response.team.slug}`);
        } catch (error) {
          if (error instanceof Unauthorised) {
            return redirect(
              `/signup?redirectTo=${request.url}&prefill[email]=${error.meta.email}`,
            );
          }
        }
      }

      throw new NotFound("Invalid Token");
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

  const scope = claims["scope"] as "project" | "team";

  if (!scope) throw new NotFound("Invalid Token");

  if (scope === "team") {
    const team = await getTeam(claims["teamId"]);

    const invite = await getTeamInvite(claims["teamId"], claims["email"]);

    if (!invite) {
      throw new NotFound("Invalid Token");
    }

    //   const project = await getProject(claims['projectId']);
    const user = await getUserByEmail(claims["email"]);

    return json({
      scope,
      data: team,
      user,
      claims,
      token: params.token,
    });
  }

  if (scope === "project") {
    const project = (await getProject(claims["projectId"])).project;

    const invite = await getProjectInvite(claims["projectId"], claims["email"]);

    if (!invite) {
      throw new NotFound("Invalid Token");
    }

    //   const project = await getProject(claims['projectId']);
    const user = await getUserByEmail(claims["email"]);

    return json({
      scope,
      data: project,
      user,
      claims,
      token: params.token,
    });
  }

  throw new NotFound("Invalid Token");
}

export default function InvitationPage() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto flex min-w-[500px] items-center justify-center rounded-lg border border-border px-4 py-4">
        {/* {loaderData.scope === "team" && ( */}
        <Join loaderData={loaderData} actionData={actionData} />
        {/* )} */}
        {/* {loaderData.scope === "project" && (
          <Join loaderData={loaderData} actionData={actionData} />
        )} */}
      </div>
    </div>
  );
}

function Join({
  actionData,
  loaderData,
}: {
  actionData: ReturnType<typeof useActionData<typeof action>>;
  loaderData: ReturnType<typeof useLoaderData<typeof loader>>;
}) {
  return (
    <div>
      <p>Join {loaderData.data?.name}</p>
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
  );
}
