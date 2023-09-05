import {
  json,
  type ActionArgs,
  type LoaderArgs,
  redirect,
  type LinksFunction,
} from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect } from "react";
import { Input } from "~/components/ui/input";
// import { Textarea } from "~/components/ui/textarea";
import { useToast } from "~/components/ui/use-toast";
import { requireUserId } from "~/features/auth";
import { getProject } from "~/features/projects";
import {
  deleteMilestone,
  editMilestone,
  getProjectMilestone,
} from "~/features/projects/milestones";
import {
  deleteMilestoneSchema,
  editMilestoneSchema,
} from "~/features/projects/milestones/shared";
import {
  APIError,
  InternalServerError,
  MethodNotSupported,
} from "~/lib/errors";
import {
  RichTextEditor,
  links as editorLinks,
} from "../components/rich-text-editor";
import { cn } from "~/lib/utils";

export const links: LinksFunction = () => [...editorLinks()];

export async function action({ params, request }: ActionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const formObject = Object.fromEntries(formData) as { [x: string]: any };

  const method = request.method;

  try {
    // const milestone = (await getProjectMilestone(params.milestoneId as string))
    //   .milestone;

    if (method === "PATCH") {
      const credentials = editMilestoneSchema.safeParse({
        ...formObject,
        ...(formData.getAll("assigneesId[]").length > 0 && {
          assigneesId: formData.getAll("assigneesId[]"),
        }),
        id: params.milestoneId as string,
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

      await editMilestone(credentials.data, userId);

      return json(
        {
          fields: formObject,
          fieldErrors: null,
          formErrors: null,
        },
        { status: 201 },
      );
    }

    if (method === "DELETE") {
      const credentials = deleteMilestoneSchema.safeParse({
        // ...formObject,
        id: params.milestoneId as string,
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

      await deleteMilestone(credentials.data, userId);

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
  // const url = new URL(request.url);

  const project = await getProject(params.projectSlug as string);
  const milestone = await getProjectMilestone(params.milestoneId as string);

  if (!milestone || !project.project) {
    return redirect("/404");
  }

  return json({
    project,
    milestone,
    userId,
  });
}

export default function MilestoneRoute() {
  // const params = useParams()
  const loaderData = useLoaderData<typeof loader>();
  // console.log(loaderData);
  const milestoneFetcher = useFetcher();

  return (
    <main className="py-6">
      <div className="mb-5 flex items-center justify-between">
        {/* <h2 className="">{loaderData.milestone.milestone.name}</h2> */}
      </div>
      <DisplayMilestone
        milestone={loaderData.milestone}
        fetcher={milestoneFetcher}
      />
    </main>
  );
}

function DisplayMilestone({
  milestone,
  fetcher,
}: {
  milestone: Awaited<
    ReturnType<typeof useLoaderData<typeof loader>>
  >["milestone"];

  fetcher: ReturnType<typeof useFetcher<any>>;
}) {
  const { toast } = useToast();

  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      if (fetcher.data.fieldErrors) {
        // console.log(fetcher.data.fieldErrors);
        toast({
          title: "Something went wrong",
          description: Object.entries(fetcher.data.fieldErrors)
            .map(([key, value]) => `${key}:${value}`)
            .join("\n"),
        });
      }
      if (fetcher.data.formErrors) {
        // console.log(fetcher.data.formErrors);
        toast({
          title: "Something went wrong",
          description: fetcher.data.formErrors,
        });
      }
    }
  }, [fetcher.data, fetcher.state, toast]);

  return (
    <div>
      <form
        onBlur={(e) => {
          const value = e.target.value;
          const key = e.target.name as keyof typeof milestone.milestone;

          if (milestone.milestone[key] === value) return;

          // const formData = new FormData(e.target);
          // const formObject = Object.fromEntries(formData) as {
          //   [x: string]: any;
          // };

          // console.log(e.target);
          fetcher.submit(
            {
              name: milestone.milestone.name,
              [key]: value,
              id: milestone.milestone.id,
            },
            { method: "PATCH" },
          );
          // fetcher.submit(formObject, { method: "PATCH" });
        }}
      >
        <div className="space-y-4">
          <div>
            <Input
              className="border-0 text-xl"
              name="name"
              defaultValue={milestone.milestone.name}
            />
          </div>
          <div>
            {/* <Textarea
              name="description"
              className="border-0"
              // defaultValue={milestone.milestone.description ?? ""}
              defaultValue={description ?? ""}
            /> */}

            <RichTextEditor
              className={cn(
                "min-h-[80px] w-full rounded-md border-0 border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              )}
              placeholder="What's this milestone about?"
              defaultContent={milestone.milestone.description ?? undefined}
              onBlur={({ editor }) => {
                fetcher.submit(
                  {
                    name: milestone.milestone.name,
                    description: editor.getHTML(),
                    id: milestone.milestone.id,
                  },
                  { method: "PATCH" },
                );
              }}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
