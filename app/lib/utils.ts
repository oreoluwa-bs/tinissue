import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import uniqolor from "uniqolor";
import { convert } from "html-to-text";

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
    if (newObject[key] === "" || newObject[key] === undefined) {
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

  return `/thumbnails/gen/avatar?text=${text}${
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

export function blockPropagation(e: React.MouseEvent<HTMLElement, MouseEvent>) {
  let clickedElement = e.target as HTMLElement | null;

  while (clickedElement) {
    if (clickedElement.getAttribute("data-stop-propagation")) {
      // The clicked element or one of its parents has the stop-prop data attribute.
      // console.log("stopped");
      e.preventDefault(); // Prevent anchor navigation
      e.stopPropagation(); // Stop event propagation
    }

    if (e.currentTarget === clickedElement) {
      clickedElement = null;
    }
    clickedElement = clickedElement?.parentElement ?? null;
  }
}

export function convertToPlain(html: string) {
  return convert(html, { wordwrap: 130 });
}
