import type { Form } from "@remix-run/react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { FormError } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { statusValues } from "~/features/projects/milestones/shared";

interface CreateMilestoneFormProps {
  Form: typeof Form;
  data: any;
  state: "submitting" | "idle" | "loading";
  project: { id: number; slug: string };
  members: {
    id: number;
    fullName: string;
    firstName: string | null;
    lastName: string | null;
    profilePhoto: string;
  }[];
  status: "BACKLOG" | "TODO" | "IN PROGRESS" | "DONE" | "CANCELLED";
  teamSlug: string;
}

export function CreateMilestoneForm({
  Form,
  data,
  state,
  project,
  members,
  status = "BACKLOG",
  teamSlug,
}: CreateMilestoneFormProps) {
  return (
    <>
      {(data?.formErrors?.length ?? 0) > 0 ? (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{data?.formErrors}</AlertDescription>
        </Alert>
      ) : null}

      <Form
        method="POST"
        action={`/dashboard/${teamSlug}/projects/${project.slug}/milestones`}
      >
        <input
          type="number"
          name="projectId"
          id="projectId"
          placeholder="Project"
          hidden
          defaultValue={project.id}
          // defaultValue={data?.fields?.type}
          // aria-invalid={Boolean(data?.fieldErrors?.type)}
          // aria-errormessage={data?.fieldErrors?.type?.join(", ")}
        />
        {data?.fieldErrors?.projectId && (
          <FormError>{data?.fieldErrors?.projectId}</FormError>
        )}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="mb-2">
              Milestone Name
            </Label>
            <Input
              name="name"
              id="name"
              placeholder="Write PRD for Feature X"
              defaultValue={data?.fields?.name}
              aria-invalid={Boolean(data?.fieldErrors?.name)}
              aria-errormessage={data?.fieldErrors?.name?.join(", ")}
            />
            <FormError>{data?.fieldErrors?.name}</FormError>
          </div>

          <div>
            <div>
              <Label htmlFor="status" className="mb-2">
                Status
              </Label>
              <Select name="status" defaultValue={status}>
                <SelectTrigger id="status">
                  <SelectValue
                    placeholder="Select milestone status"
                    className="capitalize"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {statusValues.map((t) => {
                      return (
                        <SelectItem key={t} value={t} className="capitalize">
                          <span className="capitalize">{t.toLowerCase()}</span>
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <FormError>{data?.fieldErrors?.status}</FormError>
          </div>

          <div>
            <Label htmlFor="description" className="mb-2">
              Description
            </Label>
            <Textarea
              name="description"
              id="description"
              placeholder="What do you want to achieve?"
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
