import {
  act,
  createRemixStub,
  render,
  screen,
  userEvent,
  waitFor,
} from "test/utils";
import { MilestoneKanbanCard } from "./milestone-card";

const onDeleteAssignee = vi.fn();
const onAddAssignee = vi.fn();

const milestone = {
  id: 1,
  slug: "slug",
  name: "Go to School",
  createdAt: new Date(),
  updatedAt: new Date(),
  description: null,
  status: "BACKLOG" as const,
  projectId: 1,
};

const members = [
  {
    id: 1,
    firstName: "James",
    lastName: "Doe",
    email: "jd@test.com",
    fullName: "James Doe",
    initials: "JD",
    profilePhoto: "/image.png",
  },
  {
    id: 2,
    firstName: "Mane",
    lastName: "Doe",
    email: "md@test.com",
    fullName: "Manes Doe",
    initials: "MD",
    profilePhoto: "/image.png",
  },
];

const assignees = [members[0]];

const RemixStub = createRemixStub([
  {
    id: "rootRoute",
    path: "/",
    action: async ({ request }) => {
      return null;
    },
    element: (
      <MilestoneKanbanCard
        milestone={milestone}
        assignees={assignees}
        members={members}
        onAddAssignee={onAddAssignee}
        onDeleteAssignee={onDeleteAssignee}
        projectSlug="1"
        teamSlug="1"
      />
    ),
  },
]);

describe("Milestone Card", () => {
  beforeEach(() => {
    render(<RemixStub />);
  });

  it("should render the milestone title/name", () => {
    expect(screen.getByText(/Go to School/i)).toBeInTheDocument();
  });

  it("should render assignees in assignee list", () => {
    expect(screen.getByText(/JD/i)).toBeInTheDocument();
  });

  it("should select assignee and call onDelete", async () => {
    act(() => {
      userEvent.click(screen.getByTestId("assignee-propover-trigger"));
    });

    await waitFor(() => {
      userEvent.click(screen.getByText(members[0].fullName));
      expect(onDeleteAssignee).toHaveBeenCalled();
    });
  });

  it("should select assignee and call onAdd", async () => {
    act(() => {
      userEvent.click(screen.getByTestId("assignee-propover-trigger"));
    });

    await waitFor(() => {
      userEvent.click(screen.getByText(members[1].fullName));
      expect(onAddAssignee).toHaveBeenCalled();
    });
    // });
  });
});
