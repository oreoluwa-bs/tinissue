import { Outlet } from "@remix-run/react";

export default function AuthLayout() {
  return (
    <div className="h-screen max-h-screen overflow-hidden">
      <div className="grid h-full lg:grid-cols-2">
        <Outlet />
        <div className="h-full bg-primary"></div>
      </div>
    </div>
  );
}
