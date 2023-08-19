import { render, screen, userEvent } from "test/utils";
import { CreateProjectForm } from "./create-project-form";

const mockInput = vi.fn().mockImplementation((props) => <form {...props} />);
vi.mock("@remix-run/react", (props) => {
  mockInput(props);
  return <form {...props} />;
});

describe("Create Project Form", () => {
  beforeEach(() => {
    render(
      <CreateProjectForm
        Form={mockInput as any}
        data={{ formErrors: [] }}
        state="idle"
        teams={[
          {
            id: 1,
            slug: "slug",
            name: "Team",
            type: "PERSONAL",
            createdAt: new Date(),
            profileImage: null,
            deletedAt: null,
            updatedAt: null,
          },
        ]}
        currentTeamSlug="slug"
      />,
    );
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  it("should find name input", async () => {
    expect(screen.getByPlaceholderText(/Product/i)).toHaveAttribute(
      "name",
      "name",
    ); // OK
  });

  it("should fill name input", async () => {
    await userEvent.type(screen.getByPlaceholderText(/Product/i), "Hello", {});

    expect(screen.getByPlaceholderText(/Product/i)).toHaveValue("Hello");
  });

  it("should fill description input", async () => {
    await userEvent.type(screen.getByPlaceholderText(/Describe/i), "Hello", {});

    expect(screen.getByPlaceholderText(/Describe/i)).toHaveValue("Hello");
  });

  it("should display default values on fields", async () => {
    render(
      <CreateProjectForm
        Form={mockInput as any}
        data={{
          fields: {
            name: "Farabale",
            description: "Captain Crunch",
          },
        }}
        state="idle"
        teams={[
          {
            id: 1,
            slug: "slug",
            name: "Team",
            type: "PERSONAL",
            createdAt: new Date(),
            profileImage: null,
            deletedAt: null,
            updatedAt: null,
          },
        ]}
        currentTeamSlug="slug"
      />,
    );
    expect(screen.getAllByPlaceholderText(/Product/i)[1]).toHaveValue(
      "Farabale",
    );
    expect(screen.getAllByPlaceholderText(/Describe/i)[1]).toHaveValue(
      "Captain Crunch",
    );
  });

  it("should display not error on form error response", async () => {
    expect(screen.queryByText(/Error/i)).not.toBeInTheDocument();
  });
  it("should display error on form error response", async () => {
    render(
      <CreateProjectForm
        Form={mockInput as any}
        data={{ formErrors: ["Error 1"] }}
        state="idle"
        teams={[
          {
            id: 1,
            slug: "slug",
            name: "Team",
            type: "PERSONAL",
            createdAt: new Date(),
            profileImage: null,
            deletedAt: null,
            updatedAt: null,
          },
        ]}
        currentTeamSlug="slug"
      />,
    );
    expect(screen.getByText(/Error 1/i)).toBeInTheDocument();
  });
  it("should display error message on name and description input fields", async () => {
    render(
      <CreateProjectForm
        Form={mockInput as any}
        data={{
          fieldErrors: {
            name: ["Wrong name"],
            description: ["Captain Crunch"],
          },
        }}
        state="idle"
        teams={[
          {
            id: 1,
            slug: "slug",
            name: "Team",
            type: "PERSONAL",
            createdAt: new Date(),
            profileImage: null,
            deletedAt: null,
            updatedAt: null,
          },
        ]}
        currentTeamSlug="slug"
      />,
    );
    expect(screen.getByText(/Wrong name/i)).toBeInTheDocument();
    expect(screen.getByText(/Captain crunch/i)).toBeInTheDocument();
  });
});
