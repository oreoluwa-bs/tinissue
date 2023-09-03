import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useSearchParams,
} from "@remix-run/react";
import { AlertCircle } from "lucide-react";
import { ZodError } from "zod";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button, buttonVariants } from "~/components/ui/button";
import { FormError } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  commitAuthSession,
  createAuthSession,
  credentialsLogin,
  getAuthSession,
} from "~/features/auth";
import { credentialsLoginSchema } from "~/features/auth/shared";
import {
  APIError,
  InternalServerError,
  MethodNotSupported,
} from "~/lib/errors";

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const formObject = Object.fromEntries(formData) as { [x: string]: any };

  const method = request.method;

  try {
    if (method === "POST") {
      const credentials = credentialsLoginSchema.safeParse(formObject);

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

      const user = await credentialsLogin(credentials.data);

      if (!user) {
        return json(
          {
            fields: formObject,
            fieldErrors: null,
            formErrors: "Invalid Email/Password",
          },
          { status: 400 },
        );
      }

      return createAuthSession(
        user.id,
        (formObject.redirectTo as string).trim().length > 0
          ? formObject.redirectTo
          : "/dashboard",
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

export async function loader({ request }: LoaderArgs) {
  const session = await getAuthSession(request);
  const message = session.get("NEW_USER") || null;

  return json(
    { message },
    {
      headers: {
        // only necessary with cookieSessionStorage
        "Set-Cookie": await commitAuthSession(session),
      },
    },
  );
}

export default function LoginRoute() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();

  return (
    <main className="self-center px-6">
      <div className="mx-auto max-w-md">
        <h2 className="mb-7 text-3xl font-bold">Login</h2>

        {loaderData?.message ? (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Account Creation</AlertTitle>
            <AlertDescription>{loaderData.message}</AlertDescription>
          </Alert>
        ) : null}

        {(actionData?.formErrors.length ?? 0) > 0 ? (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{actionData?.formErrors}</AlertDescription>
          </Alert>
        ) : null}

        <Form method="POST">
          <input
            name="redirectTo"
            hidden
            value={searchParams.get("redirectTo") ?? undefined}
          />
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="mb-2">
                Email Address
              </Label>
              <Input
                type="email"
                name="email"
                id="email"
                placeholder="Email"
                defaultValue={actionData?.fields?.email}
                aria-invalid={Boolean(actionData?.fieldErrors?.email)}
                aria-errormessage={actionData?.fieldErrors?.email?.join(", ")}
              />
              <FormError>{actionData?.fieldErrors?.email}</FormError>
            </div>
            <div>
              <Label htmlFor="password" className="mb-2">
                Password
              </Label>
              <Input
                type="password"
                name="password"
                id="password"
                defaultValue={actionData?.fields?.password}
                aria-invalid={Boolean(actionData?.fieldErrors?.password)}
                aria-errormessage={actionData?.fieldErrors?.password?.join(
                  ", ",
                )}
              />
              <FormError>{actionData?.fieldErrors?.password}</FormError>
            </div>

            <div>
              <Button className="w-full">Log in</Button>
              <p className="mt-4 text-center">
                Don’t have an account?{" "}
                <Link
                  to="/signup"
                  className={buttonVariants({
                    variant: "link",
                    className: "px-0",
                  })}
                >
                  Sign up now
                </Link>
              </p>
            </div>
          </div>
        </Form>
      </div>
    </main>
  );
}
