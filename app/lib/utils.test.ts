import {
  cn,
  convertToPlain,
  generateAvatarGradient,
  removeEmptyFields,
  sleep,
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
    expect(newObj.age).toBeUndefined();
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

describe("Convert HTML to plain text", () => {
  it("Should convert html to plain text", () => {
    const htmlString =
      "<div><h1>Bears Beets Battlestar Galactica </h1>\n<p>Quote by Dwight Schrute</p></div>";

    const output = convertToPlain(htmlString);

    expect(output).toEqual(
      "Bears Beets Battlestar Galactica\nQuote by Dwight Schrute",
    );
  });
});
