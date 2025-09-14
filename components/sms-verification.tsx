"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Clock, RefreshCw } from "lucide-react"

interface SMSVerificationProps {
  phoneNumber: string
  onVerificationSuccess: () => void
  onCancel: () => void
}

export function SMSVerification({ phoneNumber, onVerificationSuccess, onCancel }: SMSVerificationProps) {
  const [verificationCode, setVerificationCode] = useState("")
  const [generatedCode, setGeneratedCode] = useState("")
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [isExpired, setIsExpired] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [isBlocked, setIsBlocked] = useState(false)

  const generateCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedCode(code)
    setTimeLeft(300)
    setIsExpired(false)
    setAttempts(0)
    setIsBlocked(false)

    console.log(`[v0] Code de vérification généré pour ${phoneNumber}: ${code}`)

    alert(`MODE DÉMO - Code de vérification: ${code}`)
  }

  const sendSMS = async (phone: string, code: string) => {
    try {
      // Example: await twilioClient.messages.create({
      //   body: `Votre code de vérification Designer Woman's: ${code}`,
      //   from: '+1234567890',
      //   to: phone
      // })

      console.log(`[v0] SMS envoyé au ${phone} avec le code: ${code}`)

      // Show success message instead of demo alert
      const event = new CustomEvent("showAlert", {
        detail: {
          type: "success",
          title: "SMS envoyé",
          message: `Code de vérification envoyé au ${phone}`,
        },
      })
      window.dispatchEvent(event)
    } catch (error) {
      console.error("[v0] Erreur envoi SMS:", error)
      const event = new CustomEvent("showAlert", {
        detail: {
          type: "error",
          title: "Erreur",
          message: "Impossible d'envoyer le SMS. Veuillez réessayer.",
        },
      })
      window.dispatchEvent(event)
    }
  }

  useEffect(() => {
    generateCode()
  }, [])

  useEffect(() => {
    if (timeLeft > 0 && !isExpired) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      setIsExpired(true)
    }
  }, [timeLeft, isExpired])

  const handleVerification = () => {
    if (isBlocked) return

    if (verificationCode === generatedCode && !isExpired) {
      onVerificationSuccess()
    } else {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)

      if (newAttempts >= 3) {
        setIsBlocked(true)
        const event = new CustomEvent("showAlert", {
          detail: {
            type: "error",
            title: "Compte bloqué",
            message: "Trop de tentatives échouées. Veuillez réessayer plus tard.",
          },
        })
        window.dispatchEvent(event)
      } else {
        const event = new CustomEvent("showAlert", {
          detail: {
            type: "warning",
            title: "Code incorrect",
            message: `Code incorrect. ${3 - newAttempts} tentative(s) restante(s).`,
          },
        })
        window.dispatchEvent(event)
      }
      setVerificationCode("")
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Vérification SMS</CardTitle>
          <p className="text-gray-600 mt-2">Un code de vérification a été envoyé au numéro :</p>
          <p className="font-semibold text-blue-600">{phoneNumber}</p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Code de vérification (6 chiffres)</label>
            <Input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="text-center text-2xl tracking-widest"
              maxLength={6}
              disabled={isExpired || isBlocked}
            />
          </div>

          <div className="flex items-center justify-center space-x-2 text-sm">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className={`font-medium ${isExpired ? "text-red-600" : "text-gray-600"}`}>
              {isExpired ? "Code expiré" : `Expire dans ${formatTime(timeLeft)}`}
            </span>
          </div>

          {isBlocked && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm text-center">
                Compte temporairement bloqué suite à trop de tentatives échouées.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleVerification}
              disabled={verificationCode.length !== 6 || isExpired || isBlocked}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Vérifier le code
            </Button>

            <Button
              onClick={generateCode}
              variant="outline"
              disabled={!isExpired && timeLeft > 240} // Can resend after 1 minute
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Renvoyer le code
            </Button>

            <Button onClick={onCancel} variant="ghost" className="w-full text-gray-600">
              Annuler
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            <p>Vous n'avez pas reçu le code ?</p>
            <p>Vérifiez votre numéro de téléphone ou contactez l'administrateur.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
