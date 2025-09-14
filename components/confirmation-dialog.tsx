"use client"

import type React from "react"

import { useState, useCallback } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle, Trash2, CheckCircle, X, Clock, RefreshCw, Target } from "lucide-react"

interface ConfirmationOptions {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive" | "success" | "warning"
  icon?: "delete" | "validate" | "cancel" | "pending" | "refund" | "reset" | "warning"
}

interface ConfirmationState extends ConfirmationOptions {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

let confirmationState: ConfirmationState | null = null
let setConfirmationState: ((state: ConfirmationState | null) => void) | null = null

export function useConfirmation() {
  const confirm = useCallback((options: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!setConfirmationState) {
        resolve(false)
        return
      }

      const state: ConfirmationState = {
        ...options,
        isOpen: true,
        onConfirm: () => {
          setConfirmationState(null)
          resolve(true)
        },
        onCancel: () => {
          setConfirmationState(null)
          resolve(false)
        },
      }

      setConfirmationState(state)
    })
  }, [])

  return { confirm }
}

export function ConfirmationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmationState | null>(null)

  // Set the global state setter
  setConfirmationState = setState
  confirmationState = state

  const getIcon = (icon?: string) => {
    switch (icon) {
      case "delete":
        return <Trash2 className="w-6 h-6 text-red-500" />
      case "validate":
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case "cancel":
        return <X className="w-6 h-6 text-red-500" />
      case "pending":
        return <Clock className="w-6 h-6 text-orange-500" />
      case "refund":
        return <RefreshCw className="w-6 h-6 text-yellow-500" />
      case "reset":
        return <Target className="w-6 h-6 text-blue-500" />
      case "warning":
        return <AlertTriangle className="w-6 h-6 text-orange-500" />
      default:
        return <AlertTriangle className="w-6 h-6 text-gray-500" />
    }
  }

  const getVariantStyles = (variant?: string) => {
    switch (variant) {
      case "destructive":
        return {
          content: "border-red-200 bg-gradient-to-br from-red-50 to-red-100",
          title: "text-red-800",
          description: "text-red-700",
          confirm:
            "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-lg transform hover:scale-105 transition-all duration-200",
        }
      case "success":
        return {
          content: "border-green-200 bg-gradient-to-br from-green-50 to-green-100",
          title: "text-green-800",
          description: "text-green-700",
          confirm:
            "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold shadow-lg transform hover:scale-105 transition-all duration-200",
        }
      case "warning":
        return {
          content: "border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100",
          title: "text-orange-800",
          description: "text-orange-700",
          confirm:
            "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg transform hover:scale-105 transition-all duration-200",
        }
      default:
        return {
          content: "border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100",
          title: "text-blue-800",
          description: "text-blue-700",
          confirm:
            "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg transform hover:scale-105 transition-all duration-200",
        }
    }
  }

  if (!state) return <>{children}</>

  const styles = getVariantStyles(state.variant)

  return (
    <>
      {children}
      <AlertDialog open={state.isOpen} onOpenChange={() => state.onCancel()}>
        <AlertDialogContent className={`${styles.content} max-w-md animate-in zoom-in-95 duration-300`}>
          <AlertDialogHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-white shadow-lg">{getIcon(state.icon)}</div>
            </div>
            <AlertDialogTitle className={`text-xl font-bold ${styles.title}`}>{state.title}</AlertDialogTitle>
            <AlertDialogDescription className={`text-base ${styles.description} leading-relaxed`}>
              {state.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-3 pt-6">
            <AlertDialogCancel
              onClick={state.onCancel}
              className="bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold shadow-md transform hover:scale-105 transition-all duration-200"
            >
              {state.cancelText || "Annuler"}
            </AlertDialogCancel>
            <AlertDialogAction onClick={state.onConfirm} className={styles.confirm}>
              {state.confirmText || "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
