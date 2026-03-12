import type React from "react"
import type { Metadata } from "next"
import { JetBrains_Mono, Geist, Geist_Mono } from "next/font/google"
import { AppShell } from "@/components/app-shell"
import "./globals.css"

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "NEON ERP | Panel de Control",
  description: "Sistema ERP interno para gestión de proyectos, clientes y operaciones — Netlab",
  icons: {
    icon: "/icon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" dir="ltr" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${jetbrainsMono.variable} font-mono bg-[#0c0c0c] text-slate-300 antialiased min-h-screen selection:bg-[#22c55e] selection:text-black`}
      >
        <a href="#main-content" className="skip-to-content">
          Saltar al contenido principal
        </a>
        <div id="main-content">
          <AppShell>
            {children}
          </AppShell>
        </div>
      </body>
    </html>
  )
}
