import { json, type ActionArgs, type LoaderArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect } from "react";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
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

export async function action({ params, request }: ActionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const formObject = Object.fromEntries(formData) as { [x: string]: any };

  const method = request.method;

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

    try {
      await editMilestone(credentials.data, userId);

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

          formErrors:
            error instanceof Error
              ? error.message
              : "Something unexpected happened",
        },
        { status: 400 },
      );
    }
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

    try {
      await deleteMilestone(credentials.data, userId);

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

          formErrors:
            error instanceof Error
              ? error.message
              : "Something unexpected happened",
        },
        { status: 400 },
      );
    }
  }

  return json(
    {
      fields: formObject,
      fieldErrors: null,
      formErrors: "Method not found",
    },
    { status: 400 },
  );
}

export async function loader({ params, request }: LoaderArgs) {
  const userId = await requireUserId(request);
  // const url = new URL(request.url);

  const project = await getProject(params.projectSlug as string);
  const milestone = await getProjectMilestone(params.milestoneId as string);

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
            <Textarea
              name="description"
              className="border-0"
              defaultValue={milestone.milestone.description ?? ""}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
