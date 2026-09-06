import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: "Virtual Cigarette Interaction System",
  description: "A private, local AR smoking interaction built for real-time performance.",
  openGraph: {
    title: "Virtual Cigarette Interaction System",
    description: "Real-time AR interaction powered entirely on your device.",
    images: [{ url: "/og.png", width: 1672, height: 941, alt: "Virtual Cigarette — Real-Time AR Interaction" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Virtual Cigarette Interaction System",
    description: "Real-time AR interaction powered entirely on your device.",
    images: ["/og.png"],
  },
};

// viewportFit: "cover" lets the experience draw underneath notches/rounded
// corners on mobile instead of letterboxing around them; the control panel,
// FAB, and status banners then inset themselves from the real safe area via
// env(safe-area-inset-*) in globals.css.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
