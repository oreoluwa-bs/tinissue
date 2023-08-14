import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import uniqolor from "uniqolor";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateAvatarGradient(...str: (string | number)[]) {
  const colors = str.map((item) => uniqolor(item));
  const toSTR = colors.map(({ color }) => color).join(",");

  return {
    colors,
    gradient: `linear-gradient(to right, ${toSTR})`,
    isLight: colors[0].isLight,
  };
}
