import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Cctv } from "lucide-react";
import { AutoRefresh, NavLinks } from "@/components/client";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zoo Analytics",
  description: "Live and daily operations analytics from the zoo's AI camera system",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg font-sans text-ink lg:flex">
        <aside className="sticky top-0 z-10 border-b border-line bg-surface lg:h-screen lg:w-56 lg:shrink-0 lg:border-r lg:border-b-0">
          <div className="flex items-center justify-between gap-3 px-4 py-3 lg:h-full lg:flex-col lg:items-stretch lg:py-5">
            <div className="flex items-center gap-2.5 lg:mb-4 lg:px-3">
              <div className="grid size-8 place-items-center rounded-md bg-accent text-white">
                <Cctv aria-hidden className="size-4.5" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">Zoo Analytics</div>
                <div className="text-xs text-muted">AI camera operations</div>
              </div>
            </div>
            <div className="lg:order-last lg:mt-auto lg:px-3">
              <AutoRefresh />
            </div>
            <div className="hidden lg:block lg:flex-1">
              <NavLinks />
            </div>
          </div>
          <div className="px-2 pb-2 lg:hidden">
            <NavLinks />
          </div>
        </aside>
        <main className="mx-auto w-full max-w-7xl min-w-0 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </body>
    </html>
  );
}
