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

export const removeEmptyFields = <T extends { [key: string]: any }>(
  data: T,
) => {
  const newObject = { ...data };

  Object.keys(newObject).forEach((key) => {
    if (newObject[key] === "" || newObject[key] == null) {
      delete newObject[key];
    }
  });

  return newObject;
};

export function sleep(delay = 5000) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, delay);
  });
}

export function generateAvatarThumbnail(
  text: string,
  options?: Partial<{ debug: boolean }>,
) {
  const extra = options && formatURLSearchParams(options).toString;

  return `/thumbnaills/gen/avatar?text=${text}${
    extra && `&${formatURLSearchParams}`
  }`;
}

const formatURLSearchParams = (data: Record<string, any>) => {
  let modifiedData: Record<string, string> = {};

  Object.keys(data).forEach((key: string) => {
    modifiedData[key] = data[key];
  });

  return new URLSearchParams(modifiedData);
};
