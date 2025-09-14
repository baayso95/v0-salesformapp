"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { SMSVerification } from "@/components/sms-verification"
import { Eye, EyeOff, Lock } from "lucide-react"

interface AuthUser {
  id: string
  username: string
  password: string
  firstName: string
  lastName: string
  phone: string
  role: "admin" | "user"
  isActive: boolean
  createdAt: string
  twoFactorEnabled: boolean
}

export function AuthGuard() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showSMSVerification, setShowSMSVerification] = useState(false)
  const [pendingUser, setPendingUser] = useState<AuthUser | null>(null)

  const { login, completeSMSVerification } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await login(username, password)

      if (result.success) {
        if (result.requiresSMS && result.user) {
          // Show SMS verification screen
          setPendingUser(result.user)
          setShowSMSVerification(true)
        }
        // If no SMS required, login is already completed by the context
      } else {
        setError("Nom d'utilisateur ou mot de passe incorrect")
      }
    } catch (error) {
      setError("Une erreur est survenue lors de la connexion")
    }

    setIsLoading(false)
  }

  const handleSMSVerificationSuccess = () => {
    if (pendingUser) {
      completeSMSVerification(pendingUser)
      setShowSMSVerification(false)
      setPendingUser(null)
    }
  }

  const handleSMSVerificationCancel = () => {
    setShowSMSVerification(false)
    setPendingUser(null)
    setUsername("")
    setPassword("")
  }

  if (showSMSVerification && pendingUser) {
    return (
      <SMSVerification
        phoneNumber={pendingUser.phone}
        onVerificationSuccess={handleSMSVerificationSuccess}
        onCancel={handleSMSVerificationCancel}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGO%20DESIGNER.jpg-Bbt0O4WQXVS9oWTngAw2NzG3Tif6Ky.jpeg"
              alt="Designer Women's Logo"
              className="w-16 h-16 rounded-full border-2 border-white"
            />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              DESIGNER WOMAN'S
            </CardTitle>
            <p className="text-gray-600 mt-2 font-medium">Système de Gestion des Ventes</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Nom d'utilisateur
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Entrez votre nom d'utilisateur"
                required
                className="h-12 bg-white/50 border-gray-200 focus:border-purple-400 focus:ring-purple-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Mot de passe
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe"
                  required
                  className="h-12 bg-white/50 border-gray-200 focus:border-purple-400 focus:ring-purple-400 pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm text-center">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Connexion...
                </div>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-xs text-gray-500">Authentification sécurisée avec vérification SMS</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
