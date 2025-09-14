"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Phone, User, CreditCard, Package } from "lucide-react"
import Link from "next/link"

interface Produit {
  nom: string
  quantite: number
  prixUnitaire: number
}

interface Sale {
  id: string
  dateVente: string
  telephoneClient: string
  telephoneClient2?: string
  livreur: string
  modePaiement: "ORANGE" | "WAVE" | "LIQUIDE"
  produits: Produit[]
  createdAt: string
}

export default function VentePage() {
  const params = useParams()
  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSale = () => {
      try {
        const savedSales = localStorage.getItem("sales")
        if (savedSales) {
          const sales: Sale[] = JSON.parse(savedSales)
          const foundSale = sales.find((s) => s.id === params.id)
          setSale(foundSale || null)
        }
      } catch (error) {
        console.error("Erreur lors du chargement de la vente:", error)
      } finally {
        setLoading(false)
      }
    }

    loadSale()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    )
  }

  if (!sale) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-bold text-red-600 mb-4">Vente non trouvée</h1>
            <p className="text-gray-600 mb-4">La fiche de vente demandée n'existe pas.</p>
            <Link href="/">
              <Button className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalVente = sale.produits.reduce((sum, p) => sum + p.quantite * p.prixUnitaire, 0)
  const quantiteTotale = sale.produits.reduce((sum, p) => sum + p.quantite, 0)

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/">
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l'accueil
            </Button>
          </Link>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="border-b border-slate-700">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl text-white mb-2">DESIGNER WOMAN'S VENTE</CardTitle>
                <p className="text-slate-400">
                  Fiche N° {sale.id} - {new Date(sale.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <Badge className="bg-green-600 text-white">Vente Validée</Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-slate-700 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-slate-400">Date de Vente</p>
                    <p className="text-white font-semibold">{new Date(sale.dateVente).toLocaleDateString("fr-FR")}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-700 rounded-lg">
                  <Phone className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm text-slate-400">Téléphone Client</p>
                    <p className="text-white font-semibold">{sale.telephoneClient}</p>
                    {sale.telephoneClient2 && <p className="text-teal-400 text-sm">{sale.telephoneClient2}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-700 rounded-lg">
                  <CreditCard className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-sm text-slate-400">Mode de Paiement</p>
                    <Badge
                      className={`mt-1 ${
                        sale.modePaiement === "ORANGE"
                          ? "bg-orange-600 text-white"
                          : sale.modePaiement === "WAVE"
                            ? "bg-blue-600 text-white"
                            : "bg-green-600 text-white"
                      }`}
                    >
                      {sale.modePaiement === "ORANGE" ? (
                        <div className="flex items-center gap-2">
                          <img src="/orange-money-logo.png" alt="ORANGE MONEY" className="w-4 h-4" />
                          {sale.modePaiement}
                        </div>
                      ) : (
                        sale.modePaiement
                      )}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-slate-700 rounded-lg">
                  <User className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="text-sm text-slate-400">Livreur</p>
                    <p className="text-white font-semibold">{sale.livreur}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-700 rounded-lg">
                  <Package className="w-5 h-5 text-orange-400" />
                  <div>
                    <p className="text-sm text-slate-400">Quantité Totale</p>
                    <p className="text-white font-semibold">{quantiteTotale}</p>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-lg">
                  <p className="text-sm text-yellow-100">Total de la Vente</p>
                  <p className="text-2xl font-bold text-white">{totalVente.toLocaleString()} XOF</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Détail des Produits
              </h3>
              <div className="bg-slate-700 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-600">
                    <tr>
                      <th className="text-left p-3 text-slate-200 font-semibold">Produit</th>
                      <th className="text-center p-3 text-slate-200 font-semibold">Quantité</th>
                      <th className="text-right p-3 text-slate-200 font-semibold">Prix unitaire</th>
                      <th className="text-right p-3 text-slate-200 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.produits.map((produit, index) => (
                      <tr key={index} className="border-t border-slate-600">
                        <td className="p-3 text-white font-medium">{produit.nom}</td>
                        <td className="p-3 text-center text-slate-300">{produit.quantite}</td>
                        <td className="p-3 text-right text-slate-300">{produit.prixUnitaire.toLocaleString()} XOF</td>
                        <td className="p-3 text-right font-semibold text-yellow-400">
                          {(produit.quantite * produit.prixUnitaire).toLocaleString()} XOF
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-center text-slate-400 text-sm">
              <p>Informations consultées via QR Code</p>
              <p>Document généré le {new Date().toLocaleDateString("fr-FR")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
