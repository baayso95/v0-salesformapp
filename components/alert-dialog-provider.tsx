"use client"

import type React from "react"
import { useState, useCallback } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react"

interface AlertOptions {
  title: string
  message: string
  variant?: "success" | "error" | "warning" | "info"
  confirmText?: string
}

interface AlertState extends AlertOptions {
  isOpen: boolean
  onConfirm: () => void
}

let alertState: AlertState | null = null
let setAlertState: ((state: AlertState | null) => void) | null = null

export function useAlert() {
  const showAlert = useCallback((options: AlertOptions): Promise<void> => {
    return new Promise((resolve) => {
      if (!setAlertState) {
        resolve()
        return
      }

      const state: AlertState = {
        ...options,
        isOpen: true,
        onConfirm: () => {
          setAlertState(null)
          resolve()
        },
      }

      setAlertState(state)
    })
  }, [])

  return { showAlert }
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AlertState | null>(null)

  // Set the global state setter
  setAlertState = setState
  alertState = state

  const getIcon = (variant?: string) => {
    switch (variant) {
      case "success":
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case "error":
        return <XCircle className="w-6 h-6 text-red-500" />
      case "warning":
        return <AlertTriangle className="w-6 h-6 text-orange-500" />
      case "info":
        return <Info className="w-6 h-6 text-blue-500" />
      default:
        return <Info className="w-6 h-6 text-gray-500" />
    }
  }

  const getVariantStyles = (variant?: string) => {
    switch (variant) {
      case "success":
        return {
          content: "border-green-200 bg-gradient-to-br from-green-50 to-green-100",
          title: "text-green-800",
          description: "text-green-700",
          confirm:
            "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold shadow-lg transform hover:scale-105 transition-all duration-200",
        }
      case "error":
        return {
          content: "border-red-200 bg-gradient-to-br from-red-50 to-red-100",
          title: "text-red-800",
          description: "text-red-700",
          confirm:
            "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-lg transform hover:scale-105 transition-all duration-200",
        }
      case "warning":
        return {
          content: "border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100",
          title: "text-orange-800",
          description: "text-orange-700",
          confirm:
            "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg transform hover:scale-105 transition-all duration-200",
        }
      case "info":
        return {
          content: "border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100",
          title: "text-blue-800",
          description: "text-blue-700",
          confirm:
            "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg transform hover:scale-105 transition-all duration-200",
        }
      default:
        return {
          content: "border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100",
          title: "text-gray-800",
          description: "text-gray-700",
          confirm:
            "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold shadow-lg transform hover:scale-105 transition-all duration-200",
        }
    }
  }

  if (!state) return <>{children}</>

  const styles = getVariantStyles(state.variant)

  return (
    <>
      {children}
      <AlertDialog open={state.isOpen} onOpenChange={() => state.onConfirm()}>
        <AlertDialogContent className={`${styles.content} max-w-md animate-in zoom-in-95 duration-300`}>
          <AlertDialogHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-white shadow-lg">{getIcon(state.variant)}</div>
            </div>
            <AlertDialogTitle className={`text-xl font-bold ${styles.title}`}>{state.title}</AlertDialogTitle>
            <AlertDialogDescription className={`text-base ${styles.description} leading-relaxed`}>
              {state.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center pt-6">
            <AlertDialogAction onClick={state.onConfirm} className={styles.confirm}>
              {state.confirmText || "OK"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
