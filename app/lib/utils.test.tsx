import { fireEvent, render, screen } from "test/utils";
import {
  blockPropagation,
  cn,
  convertToPlain,
  generateAvatarGradient,
  generateAvatarThumbnail,
  removeEmptyFields,
  sleep,
  // formatURLSearchParams,
} from "./utils";

describe("Gradient Avatar", () => {
  it("Should return same value on diffent calls", () => {
    const val1 = generateAvatarGradient(1, 2);
    const val2 = generateAvatarGradient(1, 2);
    expect(val2.gradient).toEqual(val1.gradient);
  });
});

describe("CN", () => {
  it("Should return value as output", () => {
    const val1 = cn("James");
    expect(val1).toEqual("James");
  });
});

describe("Remove empty fields", () => {
  it("Should remove empty fields from object", () => {
    const obj = {
      name: "james",
      color: undefined,
      age: null,
    };

    const newObj = removeEmptyFields(obj);

    expect(newObj.name).toBeTruthy();
    expect(newObj.color).toBeUndefined();
    expect(newObj.age).toBeNull();
  });
});

describe("Sleep", () => {
  it("Should await for 1s", async () => {
    const start = new Date().getTime();
    await sleep(1000);
    const end = new Date().getTime();

    expect(end - start).toBeGreaterThanOrEqual(1000);
    expect(end - start).toBeLessThanOrEqual(1500); // just for offsets
  });
});

describe("Generate avatar thumbnail", () => {
  it("Should generate the avatar thumbnail", () => {
    const output = generateAvatarThumbnail("James Jones");
    expect(output).toContain("text=James Jones");
  });

  it("Should generate the appropriate url search params", () => {
    const output = generateAvatarThumbnail("James Jones", { debug: true });
    expect(output).toContain("debug=true");
  });
});

describe("Block propagation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Should not prevent parent from being clicked", () => {
    const firstFn = vi.fn();
    const secondFn = vi.fn();

    render(
      <button
        onClick={(e) => {
          blockPropagation(e);
          if (e.defaultPrevented || e.isPropagationStopped()) return;

          firstFn();
        }}
      >
        First BTN
        <div>
          <button
            onClick={() => {
              secondFn();
            }}
            data-testid="second-btn"
          >
            Second BTN
          </button>
        </div>
      </button>,
    );

    fireEvent.click(screen.getByTestId("second-btn"));

    expect(secondFn).toHaveBeenCalled();
    expect(firstFn).toHaveBeenCalled();
  });

  it("Should prevent parent from being clicked", async () => {
    const firstFn = vi.fn();
    const secondFn = vi.fn();

    render(
      <button
        onClick={(e) => {
          blockPropagation(e);
          if (e.defaultPrevented || e.isPropagationStopped()) return;
          firstFn();
        }}
      >
        First BTN
        <div data-stop-propagation>
          <button
            onClick={() => {
              secondFn();
            }}
            data-testid="second-btn"
          >
            Second BTN
          </button>
        </div>
      </button>,
    );

    fireEvent.click(screen.getByTestId("second-btn"));

    expect(secondFn).toHaveBeenCalled();
    expect(firstFn).not.toHaveBeenCalled();
  });
});

describe("Convert HTML to plain text", () => {
  it("Should convert html to plain text", () => {
    const htmlString =
      "<div><h1>Bears Beets Battlestar Galactica </h1>\n<p>Quote by Dwight Schrute</p></div>";

    const output = convertToPlain(htmlString).toLowerCase();
    const expected = "Bears Beets Battlestar Galactica".toLowerCase();

    expect(output).toContain(expected);
  });
});
