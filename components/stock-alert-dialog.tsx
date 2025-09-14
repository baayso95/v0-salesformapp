"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const AlertTriangleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
    />
  </svg>
)

const PackageIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
    />
  </svg>
)

const XIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

interface StockAlert {
  productName: string
  requested: number
  available: number
}

interface StockAlertDialogProps {
  isOpen: boolean
  onClose: () => void
  stockAlerts: StockAlert[]
}

export function StockAlertDialog({ isOpen, onClose, stockAlerts }: StockAlertDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangleIcon />
            Rupture de Stock Détectée
          </DialogTitle>
          <DialogDescription>Les produits suivants ne sont pas disponibles en quantité suffisante :</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {stockAlerts.map((alert, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <PackageIcon />
                <div>
                  <p className="font-medium text-red-800">{alert.productName}</p>
                  <p className="text-sm text-red-600">
                    Demandé: {alert.requested} | Disponible: {alert.available}
                  </p>
                </div>
              </div>
              <Badge variant="destructive" className="bg-red-500">
                Rupture
              </Badge>
            </div>
          ))}
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertTriangleIcon />
            <div className="text-sm text-orange-800">
              <p className="font-medium mb-1">Actions recommandées :</p>
              <ul className="list-disc list-inside space-y-1 text-orange-700">
                <li>Réduire les quantités demandées</li>
                <li>Réapprovisionner le stock</li>
                <li>Contacter le fournisseur</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            <XIcon />
            Fermer et Corriger
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
