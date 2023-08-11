import type { LinksFunction, V2_MetaFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import styles from "./globals.css";

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

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
