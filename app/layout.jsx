import { AuthProvider } from "@/lib/auth-context";
import { OnboardingProvider } from "@/lib/onboarding-context";
import "./globals.css";

export const metadata = {
  title: "UlavanSanthai — Verified wholesale agri marketplace",
  description:
    "Connect farmers, manufacturers, processors and bulk buyers. Verified sellers, private documents, direct enquiries.",
  icons: {
    icon: "/logo-icon.png",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport = { themeColor: "#0f3d2e", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
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

