import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TriagePilot — Commercial Insurance Submission Triage",
  description: "AI-powered submission triage for commercial insurance underwriters.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
