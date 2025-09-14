"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { Sale } from "@/app/page"
import { Search, Eye, Edit, Printer, Trash2, XCircle, RefreshCw, Clock, CheckCircle } from "lucide-react"

interface SalesDatabaseProps {
  sales: Sale[]
  onPrint: (sale: Sale) => void
  onDelete: (saleId: string) => void
  onView: (sale: Sale) => void
  onEdit: (sale: Sale) => void
  onCancel: (saleId: string) => void
  onRefund: (saleId: string) => void
  onValidate: (saleId: string) => void
  onPutOnHold: (saleId: string) => void
}

export function SalesDatabase({
  sales,
  onPrint,
  onDelete,
  onView,
  onEdit,
  onCancel,
  onRefund,
  onValidate,
  onPutOnHold,
}: SalesDatabaseProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "cancelled" | "refunded" | "pending">("all")

  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      sale.telephoneClient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.adresseLivraison.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.livreur.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.id.includes(searchTerm)

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && (!sale.status || sale.status === "active")) ||
      sale.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (sale: Sale) => {
    const status = sale.status || "active"

    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Annulé</Badge>
      case "refunded":
        return <Badge className="bg-yellow-100 text-yellow-800">Remboursé</Badge>
      case "pending":
        return <Badge className="bg-blue-100 text-blue-800">En attente</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Inconnu</Badge>
    }
  }

  const getTotal = (sale: Sale) => {
    return sale.produits.reduce((sum, product) => sum + product.quantite * product.prixUnitaire, 0)
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher par téléphone, adresse, livreur ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
            size="sm"
          >
            Tous ({sales.length})
          </Button>
          <Button
            variant={statusFilter === "active" ? "default" : "outline"}
            onClick={() => setStatusFilter("active")}
            size="sm"
          >
            Actifs ({sales.filter((s) => !s.status || s.status === "active").length})
          </Button>
          <Button
            variant={statusFilter === "pending" ? "default" : "outline"}
            onClick={() => setStatusFilter("pending")}
            size="sm"
          >
            En attente ({sales.filter((s) => s.status === "pending").length})
          </Button>
          <Button
            variant={statusFilter === "cancelled" ? "default" : "outline"}
            onClick={() => setStatusFilter("cancelled")}
            size="sm"
          >
            Annulés ({sales.filter((s) => s.status === "cancelled").length})
          </Button>
        </div>
      </div>

      {/* Sales List */}
      <div className="space-y-4">
        {filteredSales.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">Aucune vente trouvée</p>
            </CardContent>
          </Card>
        ) : (
          filteredSales.map((sale) => (
            <Card key={sale.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">Fiche #{sale.id.slice(-6)}</h3>
                      {getStatusBadge(sale)}
                      {sale.isValidated && (
                        <Badge className="bg-blue-100 text-blue-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Validée
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <p>
                        <strong>Client:</strong> {sale.telephoneClient}
                      </p>
                      <p>
                        <strong>Date:</strong> {new Date(sale.dateVente).toLocaleDateString("fr-FR")}
                      </p>
                      <p>
                        <strong>Livreur:</strong> {sale.livreur}
                      </p>
                      <p>
                        <strong>Paiement:</strong> {sale.modePaiement}
                      </p>
                      <p>
                        <strong>Adresse:</strong> {sale.adresseLivraison}
                      </p>
                      <p>
                        <strong>Total:</strong> {getTotal(sale).toLocaleString()} F CFA
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onView(sale)}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(sale)}
                      className="text-green-600 border-green-300 hover:bg-green-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPrint(sale)}
                      className="text-purple-600 border-purple-300 hover:bg-purple-50"
                    >
                      <Printer className="w-4 h-4" />
                    </Button>

                    {(!sale.status || sale.status === "active") && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPutOnHold(sale.id)}
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          <Clock className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCancel(sale.id)}
                          className="text-orange-600 border-orange-300 hover:bg-orange-50"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRefund(sale.id)}
                          className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </>
                    )}

                    {sale.status === "pending" && !sale.isValidated && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onValidate(sale.id)}
                        className="text-green-600 border-green-300 hover:bg-green-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(sale.id)}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
