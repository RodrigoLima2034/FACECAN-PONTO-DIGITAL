import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata={title:"Ponto Facial — Transp Machado",description:"Registro de ponto facial"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}