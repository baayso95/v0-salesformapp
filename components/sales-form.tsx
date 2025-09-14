"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { CalendarDays, Phone, Package, Truck, Plus, Trash2, CreditCard, AlertTriangle, CheckCircle } from "lucide-react"
import type { Sale, Product } from "@/app/page"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import StockManager from "@/lib/stock-manager"
import { StockAlertDialog } from "@/components/stock-alert-dialog"
import { Badge } from "@/components/ui/badge"
import { ProductSelector } from "@/components/product-selector"

interface ProductWithStock extends Product {
  stockStatus?: "available" | "low" | "unavailable" | "unknown"
  availableStock?: number
}

interface SalesFormProps {
  onSubmit: (sale: Omit<Sale, "id" | "createdAt">) => void
  initialData?: Sale
  isEditing?: boolean
  onValidate?: (saleId: string) => void // Added onValidate prop for validation functionality
}

export function SalesForm({ onSubmit, initialData, isEditing = false, onValidate }: SalesFormProps) {
  const [formData, setFormData] = useState({
    dateVente: new Date().toISOString().split("T")[0],
    telephoneClient: "",
    telephoneClient2: "",
    adresseLivraison: "",
    livreur: "",
    modePaiement: "ORANGE" as "ORANGE" | "WAVE" | "LIQUIDE" | "",
    modePaiement2: "" as "ORANGE" | "WAVE" | "LIQUIDE" | "",
  })

  const [produits, setProduits] = useState<ProductWithStock[]>([
    { nom: "", quantite: 1, prixUnitaire: 0, unite: "", quantiteUnite: 1 },
  ])

  const [stockAlerts, setStockAlerts] = useState<Array<{ productName: string; requested: number; available: number }>>(
    [],
  )
  const [showStockAlert, setShowStockAlert] = useState(false)
  const [stockManager] = useState(() => StockManager.getInstance())

  useEffect(() => {
    if (initialData && isEditing) {
      setFormData({
        dateVente: initialData.dateVente,
        telephoneClient: initialData.telephoneClient,
        telephoneClient2: initialData.telephoneClient2 || "",
        adresseLivraison: initialData.adresseLivraison,
        livreur: initialData.livreur,
        modePaiement: initialData.modePaiement || "ORANGE",
        modePaiement2: initialData.modePaiement2 || "",
      })
      setProduits(initialData.produits)
    }
  }, [initialData, isEditing])

  const validateStock = (productName: string, quantity: number): ProductWithStock["stockStatus"] => {
    if (!productName.trim()) return "unknown"

    const availability = stockManager.checkAvailability(productName, quantity)

    if (!availability.stockItem) return "unknown"
    if (!availability.available) return "unavailable"
    if (availability.stockActuel <= availability.stockItem.seuilAlerte) return "low"
    return "available"
  }

  const getStockInfo = (productName: string) => {
    if (!productName.trim()) return null

    const availability = stockManager.checkAvailability(productName, 1)
    return availability.stockItem
      ? {
          available: availability.stockActuel,
          unit: availability.stockItem.unite,
          threshold: availability.stockItem.seuilAlerte,
          price: availability.stockItem.prixUnitaire, // Assuming price is available in stock item
        }
      : null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.telephoneClient || !formData.adresseLivraison || !formData.livreur || !formData.modePaiement) {
      alert("Veuillez remplir tous les champs obligatoires")
      return
    }

    const produitsValides = produits.filter((p) => p.nom.trim() && p.prixUnitaire > 0)
    if (produitsValides.length === 0) {
      alert("Veuillez ajouter au moins un produit avec un nom et un prix")
      return
    }

    const stockIssues: Array<{ productName: string; requested: number; available: number }> = []

    for (const produit of produitsValides) {
      const availability = stockManager.checkAvailability(produit.nom, produit.quantite)
      if (availability.stockItem && !availability.available) {
        stockIssues.push({
          productName: produit.nom,
          requested: produit.quantite,
          available: availability.stockActuel,
        })
      }
    }

    if (stockIssues.length > 0) {
      setStockAlerts(stockIssues)
      setShowStockAlert(true)
      return
    }

    if (!isEditing) {
      const saleId = Date.now().toString()
      for (const produit of produitsValides) {
        stockManager.decrementStock(produit.nom, produit.quantite, saleId)
      }
    }

    onSubmit({
      ...formData,
      produits: produitsValides,
    })

    if (!isEditing) {
      setFormData({
        dateVente: new Date().toISOString().split("T")[0],
        telephoneClient: "",
        telephoneClient2: "",
        adresseLivraison: "",
        livreur: "",
        modePaiement: "ORANGE",
        modePaiement2: "",
      })
      setProduits([{ nom: "", quantite: 1, prixUnitaire: 0, unite: "", quantiteUnite: 1 }])

      alert("Fiche de vente créée avec succès!")
    } else {
      alert("Fiche de vente modifiée avec succès!")
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addProduct = () => {
    setProduits([...produits, { nom: "", quantite: 1, prixUnitaire: 0, unite: "", quantiteUnite: 1 }])
  }

  const removeProduct = (index: number) => {
    if (produits.length > 1) {
      setProduits(produits.filter((_, i) => i !== index))
    }
  }

  const updateProduct = (index: number, field: keyof Product, value: string | number) => {
    const newProduits = [...produits]
    newProduits[index] = { ...newProduits[index], [field]: value }

    if (field === "nom" || field === "quantite") {
      const productName = field === "nom" ? (value as string) : newProduits[index].nom
      const quantity = field === "quantite" ? (value as number) : newProduits[index].quantite

      newProduits[index].stockStatus = validateStock(productName, quantity)

      const stockInfo = getStockInfo(productName)
      newProduits[index].availableStock = stockInfo?.available || 0
    }

    setProduits(newProduits)
  }

  const handleProductSelect = (
    index: number,
    productName: string,
    stockInfo?: { available: number; unit: string; price: number },
  ) => {
    const newProduits = [...produits]

    newProduits[index] = {
      ...newProduits[index],
      nom: productName,
      prixUnitaire: stockInfo?.price || 0,
      unite: stockInfo?.unit || "",
      quantiteUnite: 1, // Default to 1 for stock products
    }

    // Update stock status
    newProduits[index].stockStatus = validateStock(productName, newProduits[index].quantite)
    newProduits[index].availableStock = stockInfo?.available || 0

    setProduits(newProduits)
  }

  const getStockStatusBadge = (produit: ProductWithStock) => {
    const stockInfo = getStockInfo(produit.nom)

    if (!stockInfo) return null

    switch (produit.stockStatus) {
      case "available":
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="w-3 h-3 mr-1" />
            En stock ({stockInfo.available})
          </Badge>
        )
      case "low":
        return (
          <Badge className="bg-orange-500 text-white">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Stock faible ({stockInfo.available})
          </Badge>
        )
      case "unavailable":
        return (
          <Badge className="bg-red-500 text-white">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Rupture ({stockInfo.available})
          </Badge>
        )
      default:
        return null
    }
  }

  const totalGeneral = produits.reduce((sum, p) => sum + p.quantite * p.prixUnitaire, 0)

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="w-5 h-5 text-blue-600" />
              <Label htmlFor="dateVente" className="text-sm font-medium">
                Date de Vente *
              </Label>
            </div>
            <Input
              id="dateVente"
              type="date"
              value={formData.dateVente}
              onChange={(e) => handleChange("dateVente", e.target.value)}
              required
              className="bg-white"
            />
          </Card>

          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <Phone className="w-5 h-5 text-green-600" />
              <Label htmlFor="telephoneClient" className="text-sm font-medium">
                Téléphone Client *
              </Label>
            </div>
            <Input
              id="telephoneClient"
              type="tel"
              placeholder="Numéro de téléphone"
              value={formData.telephoneClient}
              onChange={(e) => handleChange("telephoneClient", e.target.value)}
              required
              className="bg-white"
            />
          </Card>

          <Card className="p-4 bg-teal-50 border-teal-200">
            <div className="flex items-center gap-2 mb-3">
              <Phone className="w-5 h-5 text-teal-600" />
              <Label htmlFor="telephoneClient2" className="text-sm font-medium">
                Téléphone Client 2 (optionnel)
              </Label>
            </div>
            <Input
              id="telephoneClient2"
              type="tel"
              placeholder="Numéro de téléphone (optionnel)"
              value={formData.telephoneClient2}
              onChange={(e) => handleChange("telephoneClient2", e.target.value)}
              className="bg-white"
            />
          </Card>

          <Card className="p-4 bg-indigo-50 border-indigo-200">
            <div className="flex items-center gap-2 mb-3">
              <Truck className="w-5 h-5 text-indigo-600" />
              <Label htmlFor="adresseLivraison" className="text-sm font-medium">
                Adresse de Livraison *
              </Label>
            </div>
            <Input
              id="adresseLivraison"
              placeholder="Adresse complète de livraison"
              value={formData.adresseLivraison}
              onChange={(e) => handleChange("adresseLivraison", e.target.value)}
              required
              className="bg-white"
            />
          </Card>

          <Card className="p-4 bg-red-50 border-red-200">
            <div className="flex items-center gap-2 mb-3">
              <Truck className="w-5 h-5 text-red-600" />
              <Label htmlFor="livreur" className="text-sm font-medium">
                Livreur *
              </Label>
            </div>
            <Input
              id="livreur"
              placeholder="Nom du livreur"
              value={formData.livreur}
              onChange={(e) => handleChange("livreur", e.target.value)}
              required
              className="bg-white"
            />
          </Card>

          <Card className="p-4 bg-orange-50 border-orange-200">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-5 h-5 text-orange-600" />
              <Label htmlFor="modePaiement" className="text-sm font-medium">
                Mode de Paiement *
              </Label>
            </div>
            <Select
              value={formData.modePaiement}
              onValueChange={(value) => handleChange("modePaiement", value)}
              required
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Sélectionner le mode de paiement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ORANGE">
                  <div className="flex items-center gap-2">
                    <img src="/orange-money-logo.png" alt="Orange Money" className="w-5 h-5" />
                    ORANGE MONEY
                  </div>
                </SelectItem>
                <SelectItem value="WAVE">
                  <div className="flex items-center gap-2">
                    <img src="/wave-logo.png" alt="Wave" className="w-6 h-6" />
                    WAVE
                  </div>
                </SelectItem>
                <SelectItem value="LIQUIDE">
                  <div className="flex items-center gap-2">
                    <img src="/espece-logo.png" alt="Espèces" className="w-5 h-5" />
                    LIQUIDE
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </Card>

          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-5 h-5 text-amber-600" />
              <Label htmlFor="modePaiement2" className="text-sm font-medium">
                Mode de Paiement 2 (optionnel)
              </Label>
            </div>
            <Select value={formData.modePaiement2} onValueChange={(value) => handleChange("modePaiement2", value)}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Sélectionner un mode de paiement supplémentaire" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ORANGE">
                  <div className="flex items-center gap-2">
                    <img src="/orange-money-logo.png" alt="Orange Money" className="w-5 h-5" />
                    ORANGE MONEY
                  </div>
                </SelectItem>
                <SelectItem value="WAVE">
                  <div className="flex items-center gap-2">
                    <img src="/wave-logo.png" alt="Wave" className="w-6 h-6" />
                    WAVE
                  </div>
                </SelectItem>
                <SelectItem value="LIQUIDE">
                  <div className="flex items-center gap-2">
                    <img src="/espece-logo.png" alt="Espèces" className="w-5 h-5" />
                    LIQUIDE
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </Card>
        </div>

        <Card className="p-6 bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              <Label className="text-lg font-medium">Produits *</Label>
            </div>
            <Button
              type="button"
              onClick={addProduct}
              variant="outline"
              size="sm"
              className="bg-white hover:bg-purple-100"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter Produit
            </Button>
          </div>

          <div className="space-y-6">
            {produits.map((produit, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 p-6 bg-white rounded-lg border shadow-sm"
              >
                <div className="md:col-span-5 space-y-3">
                  <Label className="text-sm font-medium mb-2 block">Nom du produit</Label>
                  <ProductSelector
                    value={produit.nom}
                    onChange={(productName, stockInfo) => handleProductSelect(index, productName, stockInfo)}
                    placeholder="Sélectionner un produit..."
                    className="bg-gray-50 w-full"
                  />
                  {produit.nom && <div className="mt-3">{getStockStatusBadge(produit)}</div>}
                </div>

                <div className="md:col-span-2 space-y-3">
                  <Label className="text-sm font-medium mb-2 block">Quantité</Label>
                  <Input
                    type="number"
                    min="1"
                    max={produit.availableStock || 999}
                    value={produit.quantite}
                    onChange={(e) => updateProduct(index, "quantite", Number.parseInt(e.target.value) || 1)}
                    className="bg-gray-50 w-full text-center"
                    maxLength={5}
                    style={{ width: "80px" }}
                  />
                  {produit.availableStock && (
                    <p className="text-xs text-gray-500 mt-2">Max: {produit.availableStock}</p>
                  )}
                </div>

                <div className="md:col-span-1 space-y-3">
                  <Label className="text-sm font-medium mb-2 block">Unité</Label>
                  <div className="h-10 px-2 py-2 bg-gray-100 border rounded-md flex items-center text-sm text-center justify-center">
                    {produit.unite || "N/A"}
                  </div>
                </div>

                <div className="md:col-span-3 space-y-3">
                  <Label className="text-sm font-medium mb-2 block">Prix unitaire</Label>
                  <div className="h-10 px-2 py-2 bg-gray-100 border rounded-md flex items-center text-sm font-medium justify-end">
                    {produit.prixUnitaire ? `${produit.prixUnitaire.toLocaleString()}` : "0"}
                  </div>
                </div>

                <div className="md:col-span-2 flex items-end space-y-3">
                  <div className="w-full">
                    <Label className="text-sm font-medium mb-2 block">Total</Label>
                    <div className="h-10 px-2 py-2 bg-yellow-50 border-2 border-yellow-200 rounded-md flex items-center text-sm font-bold justify-end text-yellow-800">
                      {(produit.quantite * produit.prixUnitaire).toLocaleString()}
                    </div>
                  </div>
                  {produits.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeProduct(index)}
                      variant="outline"
                      size="sm"
                      className="ml-2 text-red-600 hover:bg-red-50 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-yellow-100 rounded-lg border-2 border-yellow-300">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-yellow-800">Total Général:</span>
              <span className="text-2xl font-bold text-yellow-900">{totalGeneral.toLocaleString()} F CFA</span>
            </div>
          </div>
        </Card>

        <div className="flex justify-center gap-4 pt-4">
          <Button type="submit" size="lg" className="bg-blue-600 hover:bg-blue-700 px-8">
            {isEditing ? "Modifier la Fiche de Vente" : "Créer la Fiche de Vente"}
          </Button>
          {isEditing && initialData?.status === "pending" && onValidate && !initialData?.isValidated && (
            <Button
              type="button"
              onClick={() => onValidate(initialData.id)}
              size="lg"
              className="bg-green-600 hover:bg-green-700 px-8"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Valider la Fiche
            </Button>
          )}
        </div>
      </form>

      <StockAlertDialog isOpen={showStockAlert} onClose={() => setShowStockAlert(false)} stockAlerts={stockAlerts} />
    </>
  )
}
