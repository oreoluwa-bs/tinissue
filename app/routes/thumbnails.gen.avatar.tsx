import { type LoaderArgs } from "@remix-run/node";
import satori, { type SatoriOptions } from "satori";
import svg2img from "svg2img";
import uniqolor from "uniqolor";

export async function loader({ params, request }: LoaderArgs) {
  const url = new URL(request.url);

  const text = url.searchParams.get("text") ?? "AU";
  const bgColor = uniqolor(text);

  const jsx = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        width: "100%",
        fontSize: 32,
        backgroundColor: bgColor.color,
        color: bgColor.isLight ? "black" : "white",
      }}
    >
      {text}
    </div>
  );

  const svg = await satori(jsx, {
    width: 60,
    height: 60,
    fonts: await getFont("Karla", [400]),
    debug: url.searchParams.get("debug") === "true",
  });

  const { data, error } = await new Promise(
    (
      resolve: (value: { data: Buffer | null; error: Error | null }) => void,
    ) => {
      svg2img(svg, (error, buffer) => {
        if (error) {
          resolve({ data: null, error });
        } else {
          resolve({ data: buffer, error: null });
        }
      });
    },
  );

  if (error) {
    return new Response(error.toString(), {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
  return new Response(data, {
    headers: {
      //   "Content-Type": "image/svg+xml",
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600", //cache for one hour
    },
  });
}

async function getFont(
  font: string,
  weights = [400, 500, 600, 700],
  text = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\!@#$%^&*()_+-=<>?[]{}|;:,.`'’\"–—",
) {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${font}:wght@${weights.join(
      ";",
    )}&text=${encodeURIComponent(text)}`,
    {
      headers: {
        // Make sure it returns TTF.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
      },
    },
  ).then((response) => response.text());
  const resource = css.matchAll(
    /src: url\((.+)\) format\('(opentype|truetype)'\)/g,
  );
  return Promise.all(
    [...resource]
      .map((match) => match[1])
      .map((url) => fetch(url).then((response) => response.arrayBuffer()))
      .map(async (buffer, i) => ({
        name: font,
        style: "normal",
        weight: weights[i],
        data: await buffer,
      })),
  ) as Promise<SatoriOptions["fonts"]>;
}
