import {
  json,
  type ActionArgs,
  type LoaderArgs,
  redirect,
  type LinksFunction,
} from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { useToast } from "~/components/ui/use-toast";
import { requireUserId } from "~/features/auth";
import { getProject } from "~/features/projects";
import {
  deleteMilestone,
  editMilestone,
  getProjectMilestone,
} from "~/features/projects/milestones";
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
import format from "date-fns/format";
import { CalendarIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { ZodError } from "zod";

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
      const credentials = {
        ...formObject,
        ...(formData.getAll("assigneesId[]").length > 0 && {
          assigneesId: formData.getAll("assigneesId[]"),
        }),
        id: params.milestoneId as string,
      } as any;

      await editMilestone(credentials, userId);

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
      const credentials = {
        // ...formObject,
        id: params.milestoneId as string,
      } as any;

      await deleteMilestone(credentials, userId);

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
        // meta: err.message ?? err,
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

  const defaultDate = isNaN(
    Date.parse(fetcher?.data?.dueAt ?? milestone.milestone?.dueAt),
  )
    ? undefined
    : new Date(fetcher?.data?.dueAt ?? milestone.milestone?.dueAt);
  const [dueAt, setDueAt] = useState<Date | undefined>(defaultDate);
  const [dueAtTime, setDueAtTime] = useState<string>(
    defaultDate
      ? `${defaultDate.getHours().toString().padStart(2, "0")}:${defaultDate
          .getMinutes()
          .toString()
          .padStart(2, "0")}`
      : "09:00",
  );

  // useEffect(() => {
  //   if (state === "idle" && data) {
  //     if (!data.fieldErrors && !data.formErrors) {
  //       ref.current?.reset();
  //     }
  //   }
  // }, [data, state]);

  function handleDaySelect(date: Date | undefined) {
    if (!dueAtTime || !date) {
      setDueAt(date);
      return;
    }
    const [hours, minutes] = dueAtTime
      .split(":")
      .map((str) => parseInt(str, 10));
    const newDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hours,
      minutes,
    );
    setDueAt(newDate);
  }
  function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const time = e.target.value;
    if (!dueAt) {
      setDueAtTime(time);
      return;
    }
    const [hours, minutes] = time.split(":").map((str) => parseInt(str, 10));
    const newSelectedDate = new Date(
      dueAt.getFullYear(),
      dueAt.getMonth(),
      dueAt.getDate(),
      hours,
      minutes,
    );
    setDueAt(newSelectedDate);
    setDueAtTime(time);
  }

  function onBlur(
    e: React.FocusEvent<HTMLFormElement | HTMLInputElement, Element>,
  ) {
    const value = e.target.value;
    const key = e.target.name as keyof typeof milestone.milestone;

    if (milestone.milestone[key] === value) return;

    fetcher.submit(
      {
        name: milestone.milestone.name,
        [key]: value,
        id: milestone.milestone.id,
      },
      { method: "PATCH" },
    );
  }

  return (
    <div>
      <form>
        <div className="space-y-4">
          <div>
            <Input
              className="border-0 text-xl"
              name="name"
              defaultValue={milestone.milestone.name}
              onBlur={onBlur}
            />
          </div>

          <div className="space-y-4 px-3">
            <div className="flex flex-1 items-center  gap-2">
              <Label className="" htmlFor="dueAt">
                Due Date
              </Label>
              <div>
                <Popover
                  onOpenChange={(v) => {
                    // Kind of like on blur. i.e if the popover changes from open to close
                    if (!v) {
                      onBlur({
                        target: {
                          value: !dueAt ? "" : dueAt.toUTCString(),
                          name: "dueAt",
                        },
                      } as any);
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      id="dueAt"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueAt && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueAt ? (
                        format(dueAt, "PPP 'at' p")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <div className="flex items-start">
                      <Calendar
                        mode="single"
                        selected={dueAt}
                        onSelect={handleDaySelect}
                        initialFocus
                      />
                      <Label className="mb-2 px-3 py-3">
                        <span className="mb-2 inline-block">Time</span>
                        <Input
                          type="time"
                          defaultValue={dueAtTime}
                          onChange={handleTimeChange}
                        />
                      </Label>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

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
      </form>
    </div>
  );
}
