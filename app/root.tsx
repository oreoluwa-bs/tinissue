import type {
  LinksFunction,
  LoaderArgs,
  V2_MetaFunction,
} from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import styles from "./globals.css";
import { Toaster } from "./components/ui/toaster";
import { prefs } from "./features/preferences";
import { useEffect, useState } from "react";

export const meta: V2_MetaFunction = () => {
  return [
    { title: "Tinissue" },
    {
      name: "description",
      content:
        "Tinissue is a powerful and easy-to-use issue tracker that helps teams track projects, milestones, and other issues. Tinissue is perfect for teams of any size and it is available for free.",
    },
  ];
};

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export async function loader({ request }: LoaderArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const cookie = await prefs.parse(cookieHeader);
  return { theme: cookie?.theme ?? "system" };
}

export default function App() {
  const [systemTheme, setSystemTheme] = useState<string>("dark");
  const { theme } = useLoaderData<typeof loader>();

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");

    function toggleSystemTheme(e: MediaQueryListEvent) {
      setSystemTheme(e.matches ? "dark" : "light");
    }

    mql.addEventListener("change", toggleSystemTheme);

    return () => {
      mql.removeEventListener("change", toggleSystemTheme);
    };
  }, []);

  return (
    <html lang="en" className={theme === "system" ? systemTheme : theme}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <Toaster />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
