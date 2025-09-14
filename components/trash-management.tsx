"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Download, RotateCcw, AlertTriangle, Package } from "lucide-react"
import type { Sale } from "@/app/page"

interface TrashedStockItem {
  id: string
  nom: string
  stockDisponible: number
  stockDeBase: number
  seuilAlerte: number
  unite: "KG" | "G" | "DOUZAINE" | "DEMI-DOUZAINE" | "UNITE"
  prixUnitaire: number
  deletedAt: string
  type: "stock"
}

interface TrashManagementProps {
  onRestoreSale: (sale: Sale) => void
  isAdmin?: boolean
}

export function TrashManagement({ onRestoreSale, isAdmin = false }: TrashManagementProps) {
  const [trashedSales, setTrashedSales] = useState<Sale[]>([])
  const [trashedStockItems, setTrashedStockItems] = useState<TrashedStockItem[]>([])

  useEffect(() => {
    const savedTrash = localStorage.getItem("trash-data")
    if (savedTrash) {
      setTrashedSales(JSON.parse(savedTrash))
    }

    const savedStockTrash = localStorage.getItem("stock-trash-data")
    if (savedStockTrash) {
      setTrashedStockItems(JSON.parse(savedStockTrash))
    }
  }, [])

  useEffect(() => {
    const handleStockTrashUpdate = () => {
      const savedStockTrash = localStorage.getItem("stock-trash-data")
      if (savedStockTrash) {
        setTrashedStockItems(JSON.parse(savedStockTrash))
      }
    }

    window.addEventListener("stockTrashUpdated", handleStockTrashUpdate)
    return () => window.removeEventListener("stockTrashUpdated", handleStockTrashUpdate)
  }, [])

  useEffect(() => {
    localStorage.setItem("trash-data", JSON.stringify(trashedSales))
  }, [trashedSales])

  const exportStockTrashToCSV = () => {
    if (trashedStockItems.length === 0) {
      alert("Aucun produit de stock dans la corbeille à exporter")
      return
    }

    const headers = [
      "Date de suppression",
      "Nom du produit",
      "Stock disponible",
      "Stock de base",
      "Seuil d'alerte",
      "Unité",
      "Prix unitaire (F CFA)",
      "Valeur stock (F CFA)",
      "ID",
    ]

    const csvContent = [
      headers.join(","),
      ...trashedStockItems.map((item) =>
        [
          new Date(item.deletedAt).toLocaleDateString("fr-FR"),
          `"${item.nom}"`,
          item.stockDisponible,
          item.stockDeBase,
          item.seuilAlerte,
          item.unite,
          item.prixUnitaire,
          item.stockDisponible * item.prixUnitaire,
          item.id,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `corbeille-stock-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportTrashToCSV = () => {
    if (trashedSales.length === 0) {
      alert("Aucune donnée dans la corbeille à exporter")
      return
    }

    const headers = [
      "Date de suppression",
      "Date de vente originale",
      "Téléphone client",
      "Téléphone client 2",
      "Adresse de livraison",
      "Produits",
      "Quantités",
      "Unités",
      "Quantité par unité",
      "Prix unitaires (F CFA)",
      "Total (F CFA)",
      "Livreur",
      "Mode de paiement",
      "Mode de paiement 2",
      "Statut",
      "ID Original",
    ]

    const csvContent = [
      headers.join(","),
      ...trashedSales.map((sale) => {
        const produitsStr = sale.produits.map((p) => p.nom).join("; ")
        const quantitesStr = sale.produits.map((p) => p.quantite).join("; ")
        const unitesStr = sale.produits.map((p) => p.unite).join("; ")
        const quantiteUniteStr = sale.produits.map((p) => p.quantiteUnite).join("; ")
        const prixStr = sale.produits.map((p) => p.prixUnitaire).join("; ")
        const total = sale.produits.reduce((sum, p) => sum + p.quantite * p.prixUnitaire, 0)

        return [
          new Date().toLocaleDateString("fr-FR"),
          sale.dateVente,
          sale.telephoneClient,
          sale.telephoneClient2 || "",
          `"${sale.adresseLivraison}"`,
          `"${produitsStr}"`,
          quantitesStr,
          unitesStr,
          quantiteUniteStr,
          prixStr,
          total,
          sale.livreur,
          sale.modePaiement,
          sale.modePaiement2 || "",
          sale.status || "deleted",
          sale.id,
        ].join(",")
      }),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `corbeille-ventes-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const emptyTrash = () => {
    const totalItems = trashedSales.length + trashedStockItems.length
    if (totalItems === 0) {
      alert("La corbeille est déjà vide")
      return
    }

    if (
      confirm(
        `Êtes-vous sûr de vouloir vider définitivement la corbeille (${totalItems} éléments) ? Cette action est irréversible.`,
      )
    ) {
      setTrashedSales([])
      setTrashedStockItems([])
      localStorage.removeItem("stock-trash-data")
      alert("La corbeille a été vidée avec succès.")
    }
  }

  const restoreStockItem = (stockItem: TrashedStockItem) => {
    // Remove from trash
    const updatedTrashItems = trashedStockItems.filter((item) => item.id !== stockItem.id)
    setTrashedStockItems(updatedTrashItems)
    localStorage.setItem("stock-trash-data", JSON.stringify(updatedTrashItems))

    // Restore to stock - get current stock data
    const currentStock = JSON.parse(localStorage.getItem("stock-data") || "[]")

    // Prepare item data for restoration (remove trash-specific fields)
    const { deletedAt, type, ...itemData } = stockItem

    // Add back to stock
    const updatedStock = [...currentStock, itemData]
    localStorage.setItem("stock-data", JSON.stringify(updatedStock))

    // Trigger stock update event
    window.dispatchEvent(new Event("stockUpdated"))

    // Show success message with custom alert
    const alertEvent = new CustomEvent("showAlert", {
      detail: {
        type: "success",
        title: "Produit restauré",
        message: `Le produit "${stockItem.nom}" a été restauré dans le stock avec succès.`,
      },
    })
    window.dispatchEvent(alertEvent)
  }

  const restoreSale = (sale: Sale) => {
    if (confirm("Êtes-vous sûr de vouloir restaurer cette fiche de vente ?")) {
      // Remove from trash
      setTrashedSales((prev) => prev.filter((s) => s.id !== sale.id))
      // Restore to main sales list
      onRestoreSale(sale)
      alert("La fiche de vente a été restaurée avec succès.")
    }
  }

  // Function to add sale to trash (will be called from parent component)
  const addToTrash = (sale: Sale) => {
    setTrashedSales((prev) => [{ ...sale, status: "deleted" }, ...prev])
  }

  // Expose addToTrash function to parent
  useEffect(() => {
    ;(window as any).addSaleToTrash = addToTrash
  }, [])

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-100 rounded-full">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Corbeille</h2>
            <p className="text-gray-600">
              {trashedSales.length} fiche{trashedSales.length > 1 ? "s" : ""} de vente • {trashedStockItems.length}{" "}
              produit{trashedStockItems.length > 1 ? "s" : ""} de stock
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={exportTrashToCSV}
            disabled={trashedSales.length === 0}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Ventes CSV
          </Button>
          <Button
            onClick={exportStockTrashToCSV}
            disabled={trashedStockItems.length === 0}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Stock CSV
          </Button>
          {isAdmin && (
            <Button
              onClick={emptyTrash}
              disabled={trashedSales.length === 0 && trashedStockItems.length === 0}
              variant="destructive"
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Vider la Corbeille
            </Button>
          )}
        </div>
      </div>

      {trashedSales.length === 0 && trashedStockItems.length === 0 ? (
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300">
          <CardContent className="text-center py-12">
            <div className="p-4 bg-gray-200 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Trash2 className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Corbeille vide</h3>
            <p className="text-gray-500">Aucun élément supprimé pour le moment</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Sales Section */}
          {trashedSales.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-red-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Fiches de Vente Supprimées ({trashedSales.length})
              </h3>
              <div className="space-y-4">
                {trashedSales.map((sale) => (
                  <Card
                    key={sale.id}
                    className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 shadow-lg"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg font-bold text-red-800 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Fiche #{sale.id.slice(-6)} - SUPPRIMÉE
                          </CardTitle>
                          <p className="text-sm text-red-600 mt-1">
                            Date de vente: {new Date(sale.dateVente).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                        {isAdmin && (
                          <Button
                            onClick={() => restoreSale(sale)}
                            size="sm"
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold shadow-md transform hover:scale-105 transition-all duration-200"
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Restaurer
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm">
                            <strong>Client:</strong> {sale.telephoneClient}
                          </p>
                          <p className="text-sm">
                            <strong>Adresse:</strong> {sale.adresseLivraison}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm">
                            <strong>Livreur:</strong> {sale.livreur}
                          </p>
                          <p className="text-sm">
                            <strong>Paiement:</strong> {sale.modePaiement}
                            {sale.modePaiement2 && ` + ${sale.modePaiement2}`}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-red-200">
                        <h4 className="font-semibold text-gray-800 mb-2">Produits:</h4>
                        <div className="space-y-2">
                          {sale.produits.map((produit, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span className="font-medium">{produit.nom}</span>
                              <span className="text-gray-600">
                                {produit.quantite} {produit.unite} × {produit.prixUnitaire.toLocaleString()} F CFA ={" "}
                                <strong className="text-red-600">
                                  {(produit.quantite * produit.prixUnitaire).toLocaleString()} F CFA
                                </strong>
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-red-200">
                          <div className="flex justify-between items-center font-bold text-lg">
                            <span>Total:</span>
                            <span className="text-red-600">
                              {sale.produits.reduce((sum, p) => sum + p.quantite * p.prixUnitaire, 0).toLocaleString()}{" "}
                              F CFA
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {trashedStockItems.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Produits de Stock Supprimés ({trashedStockItems.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trashedStockItems.map((item) => (
                  <Card
                    key={item.id}
                    className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 shadow-lg"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-bold text-purple-800 flex items-center gap-2">
                          <Package className="w-5 h-5" />
                          {item.nom}
                        </CardTitle>
                        {isAdmin && (
                          <Button
                            onClick={() => restoreStockItem(item)}
                            size="sm"
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold shadow-md transform hover:scale-105 transition-all duration-200"
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Restaurer
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-purple-600">
                        Supprimé le: {new Date(item.deletedAt).toLocaleDateString("fr-FR")}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-white rounded-lg p-4 border border-purple-200 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Stock disponible:</span>
                          <span className="font-semibold">
                            {item.stockDisponible} {item.unite}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Stock de base:</span>
                          <span className="font-semibold text-blue-600">
                            {item.stockDeBase} {item.unite}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Seuil d'alerte:</span>
                          <span className="font-semibold">
                            {item.seuilAlerte} {item.unite}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Prix unitaire:</span>
                          <span className="font-semibold">{item.prixUnitaire.toLocaleString()} F CFA</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t border-purple-200">
                          <span className="text-gray-600">Valeur stock:</span>
                          <span className="font-bold text-purple-600">
                            {(item.stockDisponible * item.prixUnitaire).toLocaleString()} F CFA
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
