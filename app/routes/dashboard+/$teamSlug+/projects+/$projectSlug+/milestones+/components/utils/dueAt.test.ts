import { getDueStatus, getDueStatusColor } from "./dueAt";

describe("Get Due Status color", () => {
  it("Should return appropriate values", () => {
    const due = getDueStatusColor("DUE");
    const overdue = getDueStatusColor("OVERDUE");
    const duesoon = getDueStatusColor("DUE SOON");
    const notdue = getDueStatusColor("NOT DUE");

    expect(due).toContain("red");
    expect(overdue).toContain("red");
    expect(duesoon).toContain("orange");
    expect(notdue).toContain("muted");
  });
});

describe("Get Due Status", () => {
  beforeEach(() => {
    // tell vitest we use mocked time
    vi.useFakeTimers();
  });

  afterEach(() => {
    // restoring date after each test run
    vi.useRealTimers();
  });

  it("Should return OVERDUE", () => {
    const date = new Date(2030, 1, 3, 13);
    vi.setSystemTime(date);

    const output = getDueStatus(new Date(2030, 1, 1, 13));
    expect(output).toEqual("OVERDUE");
  });

  it("Should return DUE", () => {
    const date = new Date(2030, 1, 1, 13);
    vi.setSystemTime(date);

    const output = getDueStatus(date);
    expect(output).toEqual("DUE");
  });

  it("Should return NOT DUE", () => {
    const date = new Date(2030, 0, 1, 13);
    vi.setSystemTime(date);

    const output = getDueStatus(new Date(2030, 1, 1, 13));
    expect(output).toEqual("NOT DUE");
  });

  it("Should return DUE SOON", () => {
    const date = new Date(2030, 1, 8, 13);
    vi.setSystemTime(date);

    const output = getDueStatus(new Date(2030, 1, 10, 13));
    expect(output).toEqual("DUE SOON");
  });
});
