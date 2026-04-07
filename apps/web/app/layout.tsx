import type { Metadata } from "next";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { QueryProvider } from "@/components/layout/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "MPC Platform — AI-Driven Model Predictive Control",
  description:
    "Industrial hydrogen station operations monitoring, simulation, and optimization platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
