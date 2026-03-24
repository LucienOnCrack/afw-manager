"use client";

import Sidebar from "@/components/Sidebar";
import { useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-dvh">
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden lg:pl-56">
        {/* Mobile top bar with hamburger */}
        <div className="flex h-11 shrink-0 items-center border-b border-gray-200 bg-white px-3 lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="rounded p-1.5 text-gray-600 hover:bg-gray-50"
            aria-label="Open menu"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <span className="ml-2 text-xs font-semibold text-gray-900">Fabric Manager</span>
        </div>

        <main className="relative flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
