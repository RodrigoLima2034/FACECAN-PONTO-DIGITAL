import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FACECAN • Ponto Facial",
  description: "Sistema empresarial de controle de ponto facial",
  applicationName: "FACECAN",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
  themeColor: "#0f1419",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
