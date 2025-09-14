"use client"

import { Button } from "@/components/ui/button"
import type { Sale } from "@/app/page"
import { Download, FileSpreadsheet } from "lucide-react"

interface ExportDataProps {
  sales: Sale[]
}

export function ExportData({ sales }: ExportDataProps) {
  const exportToCSV = () => {
    if (sales.length === 0) {
      alert("Aucune donnée à exporter")
      return
    }

    const headers = [
      "ID",
      "Date de Vente",
      "Téléphone Client",
      "Téléphone Client 2",
      "Adresse de Livraison",
      "Livreur",
      "Mode de Paiement",
      "Mode de Paiement 2",
      "Produits",
      "Total",
      "Statut",
      "Validée",
      "Date de Création",
    ]

    const csvData = sales.map((sale) => {
      const total = sale.produits.reduce((sum, product) => sum + product.quantite * product.prixUnitaire, 0)
      const produitsStr = sale.produits
        .map((p) => `${p.nom} (${p.quantite} ${p.unite} x ${p.prixUnitaire} F CFA)`)
        .join("; ")

      return [
        sale.id,
        new Date(sale.dateVente).toLocaleDateString("fr-FR"),
        sale.telephoneClient,
        sale.telephoneClient2 || "",
        sale.adresseLivraison,
        sale.livreur,
        sale.modePaiement,
        sale.modePaiement2 || "",
        produitsStr,
        total,
        sale.status || "active",
        sale.isValidated ? "Oui" : "Non",
        new Date(sale.createdAt).toLocaleDateString("fr-FR"),
      ]
    })

    const csvContent = [headers, ...csvData].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", `ventes_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportSummary = () => {
    if (sales.length === 0) {
      alert("Aucune donnée à exporter")
      return
    }

    const activeSales = sales.filter((s) => !s.status || s.status === "active")
    const cancelledSales = sales.filter((s) => s.status === "cancelled")
    const refundedSales = sales.filter((s) => s.status === "refunded")
    const pendingSales = sales.filter((s) => s.status === "pending")

    const totalRevenue = activeSales.reduce((sum, sale) => {
      return sum + sale.produits.reduce((saleSum, product) => saleSum + product.quantite * product.prixUnitaire, 0)
    }, 0)

    const productsSold: { [key: string]: { quantity: number; revenue: number } } = {}

    activeSales.forEach((sale) => {
      sale.produits.forEach((product) => {
        if (!productsSold[product.nom]) {
          productsSold[product.nom] = { quantity: 0, revenue: 0 }
        }
        productsSold[product.nom].quantity += product.quantite
        productsSold[product.nom].revenue += product.quantite * product.prixUnitaire
      })
    })

    const summaryData = [
      ["RÉSUMÉ DES VENTES", ""],
      ["", ""],
      ["Statistiques Générales", ""],
      ["Total des fiches créées", sales.length],
      ["Ventes actives", activeSales.length],
      ["Ventes en attente", pendingSales.length],
      ["Ventes annulées", cancelledSales.length],
      ["Ventes remboursées", refundedSales.length],
      ["", ""],
      ["Chiffre d'affaires", ""],
      ["Revenus totaux (F CFA)", totalRevenue.toLocaleString()],
      [
        "Moyenne par vente (F CFA)",
        activeSales.length > 0 ? Math.round(totalRevenue / activeSales.length).toLocaleString() : 0,
      ],
      ["", ""],
      ["Produits les plus vendus", ""],
      ...Object.entries(productsSold)
        .sort((a, b) => b[1].quantity - a[1].quantity)
        .slice(0, 10)
        .map(([product, data]) => [product, `${data.quantity} unités - ${data.revenue.toLocaleString()} F CFA`]),
    ]

    const csvContent = summaryData.map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", `resume_ventes_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          onClick={exportToCSV}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 h-16"
          disabled={sales.length === 0}
        >
          <div className="flex flex-col items-center gap-2">
            <FileSpreadsheet className="w-6 h-6" />
            <span>Export Détaillé CSV</span>
          </div>
        </Button>

        <Button
          onClick={exportSummary}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 h-16"
          disabled={sales.length === 0}
        >
          <div className="flex flex-col items-center gap-2">
            <Download className="w-6 h-6" />
            <span>Export Résumé CSV</span>
          </div>
        </Button>
      </div>

      <div className="text-center text-sm text-gray-600">
        <p>Export détaillé: Toutes les données de vente</p>
        <p>Export résumé: Statistiques et analyse des ventes</p>
      </div>
    </div>
  )
}
