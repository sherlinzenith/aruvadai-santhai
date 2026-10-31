import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/auth-context";
import { OnboardingProvider } from "@/lib/onboarding-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "UlavanSanthai — Verified wholesale agri marketplace",
  description:
    "Connect farmers, manufacturers, processors and bulk buyers. Verified sellers, private documents, direct enquiries. Join for ₹365.",
  icons: {
    icon: "/logo-icon.png",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = { themeColor: "#0f3d2e", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <OnboardingProvider>{children}</OnboardingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
