"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SalesReport {
  id: string
  periode: "journalier" | "mensuel" | "annuel"
  dateDebut: string
  dateFin: string
  nombreVentes: number
  totalVentes: number
  totalProduits: number
  produitsVendus?: { [nom: string]: { quantite: number; chiffreAffaires: number } }
  createdAt: string
}

export default function ReportPage() {
  const params = useParams()
  const [report, setReport] = useState<SalesReport | null>(null)

  useEffect(() => {
    const savedReports = localStorage.getItem("reports-data")
    if (savedReports) {
      const reports: SalesReport[] = JSON.parse(savedReports)
      const foundReport = reports.find((r) => r.id === params.id)
      setReport(foundReport || null)
    }
  }, [params.id])

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Rapport non trouvé</h1>
            <p className="text-gray-600">Le rapport demandé n'existe pas ou a été supprimé.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGO%20DESIGNER.jpg-Bbt0O4WQXVS9oWTngAw2NzG3Tif6Ky.jpeg"
            alt="Designer Women's Logo"
            className="w-20 h-20 mx-auto mb-4 rounded-full border-2 border-pink-200"
          />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">DESIGNER WOMAN'S VENTE</h1>
          <h2 className="text-xl font-semibold text-pink-600">Rapport {report.periode}</h2>
          <p className="text-gray-600">
            Du {report.dateDebut} au {report.dateFin}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">Nombre de ventes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-600">{report.nombreVentes}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Chiffre d'affaires</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-600">{report.totalVentes.toLocaleString()} XOF</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-purple-600">Produits vendus</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-purple-600">{report.totalProduits}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-orange-600">Moyenne par vente</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-orange-600">
                {report.nombreVentes > 0 ? Math.round(report.totalVentes / report.nombreVentes).toLocaleString() : 0}{" "}
                XOF
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Détails du rapport</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Période:</span> {report.periode}
              </div>
              <div>
                <span className="font-semibold">Date de création:</span>{" "}
                {new Date(report.createdAt).toLocaleDateString("fr-FR")}
              </div>
              <div>
                <span className="font-semibold">ID du rapport:</span> {report.id}
              </div>
            </div>
          </CardContent>
        </Card>

        {report.produitsVendus && Object.keys(report.produitsVendus).length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Détail des Articles Vendus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(report.produitsVendus)
                  .sort(([, a], [, b]) => b.quantite - a.quantite)
                  .map(([nomProduit, details]) => (
                    <div key={nomProduit} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-800">{nomProduit}</h5>
                        <p className="text-sm text-gray-600">
                          Quantité vendue: <span className="font-medium text-blue-600">{details.quantite}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          {details.chiffreAffaires.toLocaleString()} XOF
                        </p>
                        <p className="text-sm text-gray-500">
                          {details.quantite > 0
                            ? Math.round(details.chiffreAffaires / details.quantite).toLocaleString()
                            : 0}{" "}
                          XOF/unité
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
