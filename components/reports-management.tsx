"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { SalesReport } from "@/app/page"
import { FileText, Calendar, TrendingUp, Trash2, Eye, BarChart3 } from "lucide-react"

interface ReportsManagementProps {
  reports: SalesReport[]
  onDelete: (reportId: string) => void
  onGenerate: (periode: "journalier" | "mensuel" | "annuel") => void
}

export function ReportsManagement({ reports, onDelete, onGenerate }: ReportsManagementProps) {
  const [selectedReport, setSelectedReport] = useState<SalesReport | null>(null)

  const getPeriodeBadge = (periode: string) => {
    switch (periode) {
      case "journalier":
        return <Badge className="bg-blue-100 text-blue-800">Journalier</Badge>
      case "mensuel":
        return <Badge className="bg-green-100 text-green-800">Mensuel</Badge>
      case "annuel":
        return <Badge className="bg-purple-100 text-purple-800">Annuel</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{periode}</Badge>
    }
  }

  if (selectedReport) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Détails du Rapport</h2>
          <Button variant="outline" onClick={() => setSelectedReport(null)}>
            Retour à la liste
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Rapport {selectedReport.periode}
              </CardTitle>
              {getPeriodeBadge(selectedReport.periode)}
            </div>
            <p className="text-sm text-gray-600">
              Du {selectedReport.dateDebut} au {selectedReport.dateFin}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Ventes Actives</h4>
                <p className="text-2xl font-bold text-green-600">{selectedReport.nombreVentes}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Chiffre d'affaires</h4>
                <p className="text-2xl font-bold text-blue-600">{selectedReport.totalVentes.toLocaleString()} F CFA</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-2">Produits vendus</h4>
                <p className="text-2xl font-bold text-purple-600">{selectedReport.totalProduits}</p>
              </div>
            </div>

            {/* Statistiques additionnelles */}
            {(selectedReport.nombreVentesAnnulees || selectedReport.nombreVentesRemboursees) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-2">Ventes Annulées</h4>
                  <p className="text-xl font-bold text-red-600">{selectedReport.nombreVentesAnnulees || 0}</p>
                  <p className="text-sm text-red-500">
                    {(selectedReport.totalVentesAnnulees || 0).toLocaleString()} F CFA
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">Ventes Remboursées</h4>
                  <p className="text-xl font-bold text-yellow-600">{selectedReport.nombreVentesRemboursees || 0}</p>
                  <p className="text-sm text-yellow-600">
                    {(selectedReport.totalVentesRemboursees || 0).toLocaleString()} F CFA
                  </p>
                </div>
              </div>
            )}

            {/* Produits vendus */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Détail des Produits Vendus</h4>
              <div className="space-y-2">
                {Object.entries(selectedReport.produitsVendus)
                  .sort((a, b) => b[1].chiffreAffaires - a[1].chiffreAffaires)
                  .map(([produit, data]) => (
                    <div key={produit} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">{produit}</span>
                      <div className="text-right">
                        <p className="font-semibold">{data.chiffreAffaires.toLocaleString()} F CFA</p>
                        <p className="text-sm text-gray-600">{data.quantite} unités vendues</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec boutons de génération */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">Gestion des Rapports</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => onGenerate("journalier")}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Rapport Journalier
          </Button>
          <Button
            onClick={() => onGenerate("mensuel")}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Rapport Mensuel
          </Button>
          <Button
            onClick={() => onGenerate("annuel")}
            className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Rapport Annuel
          </Button>
        </div>
      </div>

      {/* Liste des rapports */}
      <div className="space-y-4">
        {reports.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Aucun rapport généré</h3>
              <p className="text-gray-500">Cliquez sur les boutons ci-dessus pour générer votre premier rapport</p>
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">Rapport #{report.id.slice(-6)}</h3>
                      {getPeriodeBadge(report.periode)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <p>
                        <strong>Période:</strong> {report.dateDebut} au {report.dateFin}
                      </p>
                      <p>
                        <strong>Ventes:</strong> {report.nombreVentes}
                      </p>
                      <p>
                        <strong>Chiffre d'affaires:</strong> {report.totalVentes.toLocaleString()} F CFA
                      </p>
                      <p>
                        <strong>Créé le:</strong> {new Date(report.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedReport(report)}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(report.id)}
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
