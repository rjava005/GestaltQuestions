import { Outlet } from "react-router-dom";

import navigationItems from "../features/NavBar";
import NavBar from "../features/NavBar/NavBar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <NavBar items={navigationItems} />

      <main className="w-full px-4 py-6 ">
        <Outlet />
      </main>
    </div>
  );
}
