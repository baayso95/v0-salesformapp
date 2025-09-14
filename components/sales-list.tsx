"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Printer,
  Calendar,
  Phone,
  Package,
  Truck,
  DollarSign,
  CreditCard,
  Trash2,
  Eye,
  Edit,
  X,
  Search,
  RefreshCw,
  CheckCircle,
  Clock,
} from "lucide-react"
import { useState } from "react"
import type { Sale } from "@/app/page"

interface SalesListProps {
  sales: Sale[]
  onPrint: (sale: Sale) => void
  onDelete: (saleId: string) => void
  onView?: (sale: Sale) => void
  onEdit?: (sale: Sale) => void
  onCancel?: (saleId: string) => void
  onRefund?: (saleId: string) => void
  onValidate?: (saleId: string) => void // Added onValidate prop for validation functionality
  onPutOnHold?: (saleId: string) => void // Added onPutOnHold prop
}

export function SalesList({
  sales,
  onPrint,
  onDelete,
  onView,
  onEdit,
  onCancel,
  onRefund,
  onValidate,
  onPutOnHold, // Added onPutOnHold parameter
}: SalesListProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredSales = sales.filter((sale) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      sale.telephoneClient.toLowerCase().includes(searchLower) ||
      sale.telephoneClient2?.toLowerCase().includes(searchLower) ||
      sale.adresseLivraison.toLowerCase().includes(searchLower) ||
      sale.livreur.toLowerCase().includes(searchLower) ||
      sale.modePaiement.toLowerCase().includes(searchLower) ||
      sale.modePaiement2?.toLowerCase().includes(searchLower) ||
      sale.produits.some(
        (produit) =>
          produit.nom.toLowerCase().includes(searchLower) || produit.unite?.toLowerCase().includes(searchLower),
      ) ||
      sale.id.toLowerCase().includes(searchLower)
    )
  })

  const getUnitAbbreviation = (unite: string) => {
    switch (unite) {
      case "DOUZAINE":
        return "dz"
      case "DEMI-DOUZAINE":
        return "½dz"
      case "KG":
        return "kg"
      case "G":
        return "g"
      default:
        return unite?.toLowerCase() || ""
    }
  }

  if (sales.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucune fiche de vente</h3>
        <p className="text-gray-500">Créez votre première fiche de vente pour commencer</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Rechercher par téléphone, adresse, livreur, produit, unité, mode de paiement..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {searchTerm && (
        <div className="text-sm text-gray-600">
          {filteredSales.length} résultat(s) trouvé(s) sur {sales.length} fiche(s)
        </div>
      )}

      {filteredSales.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Aucun résultat trouvé</h3>
          <p className="text-gray-500">Essayez avec d'autres mots-clés</p>
        </div>
      )}

      {filteredSales.map((sale) => {
        const totalVente = sale.produits.reduce((sum, p) => sum + p.quantite * p.prixUnitaire, 0)
        const quantiteTotale = sale.produits.reduce((sum, p) => sum + p.quantite, 0)

        return (
          <Card key={sale.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50">
                    #{sale.id.slice(-6)}
                  </Badge>
                  {sale.status === "cancelled" && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      Annulée
                    </Badge>
                  )}
                  {sale.status === "pending" && (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      ⏳ En attente
                    </Badge>
                  )}
                  {sale.status === "refunded" && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      Remboursée
                    </Badge>
                  )}
                  {sale.isValidated && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      ✓ Validée
                    </Badge>
                  )}
                  <span className="text-sm text-gray-500">
                    Créé le {new Date(sale.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {onView && (
                    <Button
                      onClick={() => onView(sale)}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Eye className="w-4 h-4" />
                      Voir
                    </Button>
                  )}
                  {onValidate && sale.status === "pending" && !sale.isValidated && (
                    <Button
                      onClick={() => onValidate(sale.id)}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Valider
                    </Button>
                  )}
                  {onEdit &&
                    (sale.status === "pending" || !sale.status || sale.status === "active") &&
                    !sale.isValidated && (
                      <Button
                        onClick={() => onEdit(sale)}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Edit className="w-4 h-4" />
                        Modifier
                      </Button>
                    )}
                  {onRefund &&
                    (sale.status === "pending" || !sale.status || sale.status === "active") &&
                    !sale.isValidated && (
                      <Button
                        onClick={() => onRefund(sale.id)}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Rembourser
                      </Button>
                    )}
                  {onPutOnHold && (!sale.status || sale.status === "active") && !sale.isValidated && (
                    <Button
                      onClick={() => onPutOnHold(sale.id)}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    >
                      <Clock className="w-4 h-4" />
                      Mettre en attente
                    </Button>
                  )}
                  {onCancel && (!sale.status || sale.status === "active") && !sale.isValidated && (
                    <Button
                      onClick={() => onCancel(sale.id)}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                      Annuler
                    </Button>
                  )}
                  <Button onClick={() => onPrint(sale)} size="sm" variant="outline" className="flex items-center gap-2">
                    <Printer className="w-4 h-4" />
                    Imprimer
                  </Button>
                  {!sale.isValidated && (
                    <Button
                      onClick={() => onDelete(sale.id)}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </Button>
                  )}
                </div>
              </div>

              <div
                className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${
                  sale.status === "cancelled" || sale.status === "refunded"
                    ? "opacity-60"
                    : sale.status === "pending"
                      ? "opacity-80"
                      : "" // Added opacity for pending sales
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-xs text-gray-500">Date de vente</p>
                    <p className="font-medium">{new Date(sale.dateVente).toLocaleDateString("fr-FR")}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-xs text-gray-500">Téléphone</p>
                    <p className="font-medium">{sale.telephoneClient}</p>
                    {sale.telephoneClient2 && <p className="font-medium text-teal-600">{sale.telephoneClient2}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-500" />
                  <div>
                    <p className="text-xs text-gray-500">Quantité totale</p>
                    <p className="font-medium">{quantiteTotale}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-yellow-500" />
                  <div>
                    <p className="text-xs text-gray-500">Prix total</p>
                    <p className="font-medium">{totalVente.toLocaleString()} F CFA</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-indigo-500" />
                  <div>
                    <p className="text-xs text-gray-500">Adresse de livraison</p>
                    <p className="font-medium text-sm">{sale.adresseLivraison}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-red-500" />
                  <div>
                    <p className="text-xs text-gray-500">Livreur</p>
                    <p className="font-medium">{sale.livreur}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="text-xs text-gray-500">Mode de paiement</p>
                    <div className="flex flex-wrap gap-1">
                      <Badge
                        variant="outline"
                        className={`font-medium ${
                          sale.modePaiement === "ORANGE"
                            ? "bg-orange-50 text-orange-700 border-orange-200"
                            : sale.modePaiement === "WAVE"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : sale.modePaiement === "LIQUIDE"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : ""
                        }`}
                      >
                        {sale.modePaiement === "ORANGE" ? (
                          <div className="flex items-center gap-1">
                            <img src="/orange-money-logo.png" alt="ORANGE MONEY" className="w-4 h-4" />
                            {sale.modePaiement}
                          </div>
                        ) : sale.modePaiement === "WAVE" ? (
                          <div className="flex items-center gap-1">
                            <img src="/wave-logo.png" alt="Wave" className="w-5 h-5" />
                            {sale.modePaiement}
                          </div>
                        ) : sale.modePaiement === "LIQUIDE" ? (
                          <div className="flex items-center gap-1">
                            <img src="/espece-logo.png" alt="Espèces" className="w-4 h-4" />
                            {sale.modePaiement}
                          </div>
                        ) : (
                          sale.modePaiement
                        )}
                      </Badge>
                      {sale.modePaiement2 && (
                        <Badge
                          variant="outline"
                          className={`font-medium ${
                            sale.modePaiement2 === "ORANGE"
                              ? "bg-orange-50 text-orange-700 border-orange-200"
                              : sale.modePaiement2 === "WAVE"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : sale.modePaiement2 === "LIQUIDE"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : ""
                          }`}
                        >
                          {sale.modePaiement2 === "ORANGE" ? (
                            <div className="flex items-center gap-1">
                              <img src="/orange-money-logo.png" alt="ORANGE MONEY" className="w-4 h-4" />
                              {sale.modePaiement2}
                            </div>
                          ) : sale.modePaiement2 === "WAVE" ? (
                            <div className="flex items-center gap-1">
                              <img src="/wave-logo.png" alt="Wave" className="w-5 h-5" />
                              {sale.modePaiement2}
                            </div>
                          ) : sale.modePaiement2 === "LIQUIDE" ? (
                            <div className="flex items-center gap-1">
                              <img src="/espece-logo.png" alt="Espèces" className="w-4 h-4" />
                              {sale.modePaiement2}
                            </div>
                          ) : (
                            sale.modePaiement2
                          )}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 md:col-span-2 lg:col-span-1">
                  <Package className="w-4 h-4 text-purple-500 mt-1" />
                  <div>
                    <p className="text-xs text-gray-500">Produits ({sale.produits.length})</p>
                    <div className="space-y-1">
                      {sale.produits.map((produit, index) => (
                        <p key={index} className="font-medium text-sm">
                          {produit.nom} ({produit.quantite} × {produit.quantiteUnite || 1}{" "}
                          {getUnitAbbreviation(produit.unite)})
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
