import { cn, generateAvatarGradient } from "./utils";

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
