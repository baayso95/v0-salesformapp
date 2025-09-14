"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, Sparkles, Heart } from "lucide-react"

interface WelcomeDialogProps {
  isOpen: boolean
  onClose: () => void
  username: string
}

export function WelcomeDialog({ isOpen, onClose, username }: WelcomeDialogProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [animationStep, setAnimationStep] = useState(0)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      // Animation sequence
      const timer1 = setTimeout(() => setAnimationStep(1), 100)
      const timer2 = setTimeout(() => setAnimationStep(2), 600)
      const timer3 = setTimeout(() => setAnimationStep(3), 1200)

      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
      }
    }
  }, [isOpen])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      setAnimationStep(0)
      onClose()
    }, 300)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className={`relative transition-all duration-500 ease-out ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <Card className="w-[500px] bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 border-2 border-pink-200 shadow-2xl overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div
              className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-pink-300 to-purple-400 rounded-full opacity-20 transition-transform duration-1000 ${animationStep >= 1 ? "scale-100 rotate-45" : "scale-0"}`}
            ></div>
            <div
              className={`absolute -bottom-10 -left-10 w-24 h-24 bg-gradient-to-br from-indigo-300 to-pink-400 rounded-full opacity-20 transition-transform duration-1000 delay-300 ${animationStep >= 2 ? "scale-100 rotate-90" : "scale-0"}`}
            ></div>
            <div
              className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-10 transition-transform duration-1500 delay-500 ${animationStep >= 3 ? "scale-100" : "scale-0"}`}
            ></div>
          </div>

          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 text-gray-500 hover:text-gray-700 hover:bg-white/50"
          >
            <X className="w-4 h-4" />
          </Button>

          <CardContent className="p-8 text-center relative z-10">
            {/* Logo */}
            <div
              className={`mb-6 transition-all duration-700 ${animationStep >= 1 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
            >
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGO%20DESIGNER.jpg-Bbt0O4WQXVS9oWTngAw2NzG3Tif6Ky.jpeg"
                alt="Designer Women's Logo"
                className="w-20 h-20 mx-auto rounded-full border-4 border-pink-200 shadow-lg"
              />
            </div>

            {/* Welcome text */}
            <div
              className={`mb-6 transition-all duration-700 delay-200 ${animationStep >= 1 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
            >
              <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3">
                Bonjour {username} !
              </h2>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Heart className="w-5 h-5 text-pink-500" />
                <h3 className="text-xl font-semibold text-gray-700">Bienvenue chez Designer Woman's</h3>
                <Heart className="w-5 h-5 text-pink-500" />
              </div>
            </div>

            {/* Animated sparkles */}
            <div
              className={`mb-6 transition-all duration-700 delay-400 ${animationStep >= 2 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
            >
              <div className="flex justify-center gap-4 mb-4">
                <Sparkles
                  className={`w-6 h-6 text-pink-400 transition-transform duration-1000 ${animationStep >= 3 ? "rotate-12 scale-110" : ""}`}
                />
                <Sparkles
                  className={`w-8 h-8 text-purple-400 transition-transform duration-1000 delay-100 ${animationStep >= 3 ? "rotate-45 scale-110" : ""}`}
                />
                <Sparkles
                  className={`w-6 h-6 text-indigo-400 transition-transform duration-1000 delay-200 ${animationStep >= 3 ? "-rotate-12 scale-110" : ""}`}
                />
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">
                Vous êtes maintenant connecté(e) à votre espace de gestion.
                <br />
                Prêt(e) à créer de nouvelles fiches de vente ?
              </p>
            </div>

            {/* Action button */}
            <div
              className={`transition-all duration-700 delay-600 ${animationStep >= 3 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
            >
              <Button
                onClick={handleClose}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                Commencer à travailler
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
