"use client";

import { Sidebar } from "./Sidebar";
import { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Административная панель
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Дежурный
              </span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
