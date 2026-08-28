import type { Metadata } from "next";
import { DM_Serif_Display, Syne, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider, ThemeScript } from "@/components/ThemeProvider";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import MobileDrawer from "@/components/MobileDrawer";
import Providers from "@/app/providers";
import AuthGate from "@/components/AuthGate";
import ToastContainer from "@/components/ui/Toast";
import SkipToContent from "@/components/SkipToContent";

const dmSerif = DM_Serif_Display({
  weight: ["400"],
  style: ["normal"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

const syne = Syne({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Prism — Research Intelligence",
  description: "Transform complex academic content into clear, grounded, and verifiable insights.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${dmSerif.variable} ${syne.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <body style={{ fontFamily: "var(--font-sans, 'Syne', system-ui, sans-serif)" }}>
        <SkipToContent />
        <ThemeScript />
        <ThemeProvider>
          <Providers>
            <div className="flex min-h-screen w-full">
              <Sidebar />
              <MobileDrawer />
              <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
                <Topbar />
                <main id="main-content" tabIndex={-1} className="flex min-h-0 flex-1 flex-col">
                  <AuthGate>{children}</AuthGate>
                </main>
              </div>
            </div>
            <ToastContainer />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
