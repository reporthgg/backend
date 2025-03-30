"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <body>
      <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="light">
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </AuthProvider>
    </body>
  );
}
