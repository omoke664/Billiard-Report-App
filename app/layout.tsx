import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

// Display face — used for headings and every numeral in the app (the
// "scoreboard" treatment). Geometric and slightly mechanical.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
});

// Body face — neutral and highly legible for labels, lists, and copy.
const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Billiard Tracker",
  description: "Track M-Pesa payments and billiard table revenue",
  manifest: "/manifest.json",
  icons: [
    { rel: "icon", url: "/icon-192.svg" },
    { rel: "apple-touch-icon", url: "/icon-192.svg" },
  ],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF9F6" },
    { media: "(prefers-color-scheme: dark)", color: "#0A1628" },
  ],
};

// Sets the `dark` class on <html> before first paint, so there's no
// light-mode flash for users whose stored/system preference is dark.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var isDark = stored ? stored === "dark" : prefersDark;
    if (isDark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Billiard Tracker" />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-light-bg text-light-text dark:bg-dark-bg dark:text-dark-text transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}