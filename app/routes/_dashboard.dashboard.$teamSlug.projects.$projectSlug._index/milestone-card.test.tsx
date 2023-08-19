import { render, screen } from "test/utils";
import { MilestoneKanbanCard } from "./milestone-card";

describe("Milestone Card", () => {
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

  const assignees = [
    {
      id: 1,
      firstName: "James",
      lastName: "Doe",
      email: "jd@test.com",
      fullName: "James Doe",
      initials: "JD",
      profilePhoto: "/image.png",
    },
  ];

  it("should render the milestone title/name", () => {
    render(<MilestoneKanbanCard milestone={milestone} />);

    expect(screen.getByText(/Go to School/i)).toBeInTheDocument();
  });

  it("should render assignees in assignee list", () => {
    render(
      <MilestoneKanbanCard
        milestone={milestone}
        assignees={assignees}
        members={assignees}
      />,
    );
    expect(screen.getByText(/JD/i)).toBeInTheDocument();
  });
});
