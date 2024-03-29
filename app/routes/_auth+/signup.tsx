import { json, redirect, type ActionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import { AlertCircle } from "lucide-react";
import { ZodError } from "zod";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button, buttonVariants } from "~/components/ui/button";
import { FormError } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  commitAuthSession,
  credentialsSignUp,
  getAuthSession,
} from "~/features/auth";
import { AUTH_EVENTS, authEvent } from "~/features/auth/event.server";
import { credentialsSignupSchema } from "~/features/auth/shared";
import {
  APIError,
  InternalServerError,
  MethodNotSupported,
} from "~/lib/errors";

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const formObject = Object.fromEntries(formData);

  const method = request.method;

  try {
    if (method === "POST") {
      const credentials = credentialsSignupSchema.safeParse(formObject);

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

      const user = await credentialsSignUp(credentials.data);

      if (!user) {
        return json(
          {
            fields: formObject,
            fieldErrors: null,
            formErrors:
              "Could not create your account right now. Please try again later",
          },
          { status: 400 },
        );
      }

      const session = await getAuthSession(request);
      session.flash(
        "NEW_USER",
        "Your account has been created! Please login to continue.",
      );
      authEvent.emit(AUTH_EVENTS.NEW_USER, user);

      return redirect(
        (formObject["redirectTo"] as string)?.trim()?.length > 0
          ? (formObject["redirectTo"] as string)
          : "/login",
        {
          headers: {
            "Set-Cookie": await commitAuthSession(session),
          },
        },
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

export default function LoginRoute() {
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();

  return (
    <main className="self-center px-6">
      <div className="mx-auto max-w-md">
        <h2 className="mb-7 text-3xl font-bold">Create an Account</h2>

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
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="firstName" className="mb-2">
                  First Name
                </Label>
                <Input
                  name="firstName"
                  id="firstName"
                  placeholder="John"
                  defaultValue={actionData?.fields?.firstName}
                  aria-invalid={Boolean(actionData?.fieldErrors?.firstName)}
                  aria-errormessage={actionData?.fieldErrors?.firstName?.join(
                    ", ",
                  )}
                />
                <FormError>{actionData?.fieldErrors?.firstName}</FormError>
              </div>
              <div>
                <Label htmlFor="lastName" className="mb-2">
                  Last Name
                </Label>
                <Input
                  name="lastName"
                  id="lastName"
                  placeholder="Doe"
                  defaultValue={actionData?.fields?.lastName}
                  aria-invalid={Boolean(actionData?.fieldErrors?.lastName)}
                  aria-errormessage={actionData?.fieldErrors?.lastName?.join(
                    ", ",
                  )}
                />
                <FormError>{actionData?.fieldErrors?.lastName}</FormError>
              </div>
            </div>
            <div>
              <Label htmlFor="email" className="mb-2">
                Email Address
              </Label>
              <Input
                type="email"
                name="email"
                id="email"
                placeholder="Email"
                readOnly={Boolean(searchParams.get("prefill[email]"))}
                defaultValue={
                  actionData?.fields?.email ??
                  searchParams.get("prefill[email]") ??
                  undefined
                }
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
              <Button className="w-full">Sign up</Button>
              <p className="mt-4 text-center">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className={buttonVariants({
                    variant: "link",
                    className: "px-0",
                  })}
                >
                  Log in now
                </Link>
              </p>
            </div>
          </div>
        </Form>
      </div>
    </main>
  );
}
