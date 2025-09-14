import type React from "react"
import type { Metadata } from "next"
import { Playfair_Display, Inter } from "next/font/google"
import { Suspense } from "react"
import { ConfirmationProvider } from "@/components/confirmation-dialog"
import { AlertProvider } from "@/components/alert-dialog-provider" // Added AlertProvider import
import { AuthProvider } from "@/contexts/auth-context"
import "./globals.css"

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  fallback: ["serif"],
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
})

export const metadata: Metadata = {
  title: "Gestion des Fiches de Vente",
  description: "Application de gestion et export de fiches de vente",
  generator: "v0.app",
  viewport: "width=device-width, initial-scale=1",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`font-sans ${playfairDisplay.variable} ${inter.variable}`}>
        <AuthProvider>
          <ConfirmationProvider>
            <AlertProvider>
              {" "}
              {/* Wrapped with AlertProvider */}
              <Suspense
                fallback={
                  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Chargement...</p>
                    </div>
                  </div>
                }
              >
                {children}
              </Suspense>
            </AlertProvider>{" "}
            {/* Closed AlertProvider */}
          </ConfirmationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
