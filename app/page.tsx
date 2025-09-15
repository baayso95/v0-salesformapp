"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SalesForm } from "@/components/sales-form"
import { SalesDatabase } from "@/components/sales-database"
import { StockManagement } from "@/components/stock-management"
import { TrashManagement } from "@/components/trash-management"
import { ExportData } from "@/components/export-data"
import { ReportsManagement } from "@/components/reports-management"
import { AdminManagement } from "@/components/admin-management"
import { SalesPrint } from "@/components/sales-print"
import { useAuth } from "@/contexts/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import QRCode from "qrcode"
import StockManager from "@/lib/stock-manager"
import { FileText, Database, Printer, Package, Trash2, Settings } from "lucide-react"
import { WelcomeDialog } from "@/components/welcome-dialog"

export interface Product {
  nom: string
  quantite: number
  prixUnitaire: number
  unite: "KG" | "G" | "DOUZAINE" | "DEMI-DOUZAINE"
  quantiteUnite: number
}

export interface Sale {
  id: string
  dateVente: string
  telephoneClient: string
  telephoneClient2?: string
  adresseLivraison: string
  produits: Product[]
  livreur: string
  modePaiement: "ORANGE" | "WAVE" | "LIQUIDE"
  modePaiement2?: "ORANGE" | "WAVE" | "LIQUIDE"
  createdAt: string
  status?: "active" | "cancelled" | "refunded" | "pending"
  isValidated?: boolean
}

export interface SalesReport {
  id: string
  periode: "journalier" | "mensuel" | "annuel"
  dateDebut: string
  dateFin: string
  nombreVentes: number
  totalVentes: number
  totalProduits: number
  produitsVendus: { [nom: string]: { quantite: number; chiffreAffaires: number } }
  createdAt: string
  nombreVentesAnnulees?: number
  nombreVentesRemboursees?: number
  totalVentesAnnulees?: number
  totalVentesRemboursees?: number
}

export default function Home() {
  const { username, logout, isAdmin, isAuthenticated, isLoading, showWelcome, setShowWelcome } = useAuth()

  const [activeTab, setActiveTab] = useState("create")
  const [sales, setSales] = useState<Sale[]>([])
  const [reports, setReports] = useState<SalesReport[]>([])
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [selectedReport, setSelectedReport] = useState<SalesReport | null>(null)
  const [showPrint, setShowPrint] = useState(false)
  const [showReportPrint, setShowReportPrint] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [qrCodeSvg, setQrCodeSvg] = useState<string>("")

  const stockManager = StockManager.getInstance()

  useEffect(() => {
    try {
      const savedSales = localStorage.getItem("sales-data")
      if (savedSales) {
        setSales(JSON.parse(savedSales))
      }
    } catch (error) {
      console.warn("LocalStorage not available:", error)
    }

    try {
      const savedReports = localStorage.getItem("reports-data")
      if (savedReports) {
        setReports(JSON.parse(savedReports))
      }
    } catch (error) {
      console.warn("LocalStorage not available:", error)
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("sales-data", JSON.stringify(sales))
    } catch (error) {
      console.warn("LocalStorage not available:", error)
    }
  }, [sales])

  useEffect(() => {
    try {
      localStorage.setItem("reports-data", JSON.stringify(reports))
    } catch (error) {
      console.warn("LocalStorage not available:", error)
    }
  }, [reports])

  useEffect(() => {
    if (selectedReport && showReportPrint) {
      const generateQRCode = async () => {
        try {
          const origin = typeof window !== "undefined" && window.location ? window.location.origin : ""
          const qrSvg = await QRCode.toString(`${origin}/rapport/${selectedReport.id}`, {
            type: "svg",
            width: 128,
            margin: 1,
          })
          setQrCodeSvg(qrSvg)
        } catch (error) {
          console.warn("QR Code generation failed:", error)
          setQrCodeSvg("")
        }
      }
      generateQRCode()
    }
  }, [selectedReport, showReportPrint])

  const addSale = (saleData: Omit<Sale, "id" | "createdAt">) => {
    const newSale: Sale = {
      ...saleData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      status: "active",
    }
    setSales((prev) => [newSale, ...prev])
  }

  const printSale = (sale: Sale) => {
    setSelectedSale(sale)
    setShowPrint(true)
  }

  const deleteSale = async (saleId: string) => {
    const saleToDelete = sales.find((sale) => sale.id === saleId)

    if (saleToDelete) {
      saleToDelete.produits.forEach((produit) => {
        const success = stockManager.incrementStock(
          produit.nom,
          produit.quantite,
          `Suppression vente - Fiche #${saleId.slice(-6)}`,
        )
        if (success) {
          console.log(`[v0] Stock restauré pour ${produit.nom}: +${produit.quantite}`)
        }
      })
    }

    setSales((prev) => prev.filter((sale) => sale.id !== saleId))
  }

  const cancelSale = async (saleId: string) => {
    const saleToCancel = sales.find((sale) => sale.id === saleId)

    if (saleToCancel && (!saleToCancel.status || saleToCancel.status === "active")) {
      saleToCancel.produits.forEach((produit) => {
        const success = stockManager.incrementStock(
          produit.nom,
          produit.quantite,
          `Annulation vente - Fiche #${saleId.slice(-6)}`,
        )
        if (success) {
          console.log(`[v0] Stock restauré pour ${produit.nom}: +${produit.quantite}`)
        }
      })
    }

    setSales((prev) => prev.map((sale) => (sale.id === saleId ? { ...sale, status: "cancelled" } : sale)))
  }

  const refundSale = async (saleId: string) => {
    const saleToRefund = sales.find((sale) => sale.id === saleId)

    if (saleToRefund && (!saleToRefund.status || saleToRefund.status === "active")) {
      saleToRefund.produits.forEach((produit) => {
        const success = stockManager.incrementStock(
          produit.nom,
          produit.quantite,
          `Remboursement vente - Fiche #${saleId.slice(-6)}`,
        )
        if (success) {
          console.log(`[v0] Stock restauré pour ${produit.nom}: +${produit.quantite}`)
        }
      })
    }

    setSales((prev) => prev.map((sale) => (sale.id === saleId ? { ...sale, status: "refunded" } : sale)))
  }

  const viewSale = (sale: Sale) => {
    setSelectedSale(sale)
    setShowViewModal(true)
  }

  const editSale = (sale: Sale) => {
    setSelectedSale(sale)
    setShowEditModal(true)
  }

  const updateSale = (updatedSale: Sale) => {
    setSales((prev) => prev.map((sale) => (sale.id === updatedSale.id ? updatedSale : sale)))
    setShowEditModal(false)
    setSelectedSale(null)
  }

  const generateReport = (periode: "journalier" | "mensuel" | "annuel") => {
    const today = new Date()
    let dateDebut: Date
    const dateFin = new Date(today)

    switch (periode) {
      case "journalier":
        dateDebut = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        break
      case "mensuel":
        dateDebut = new Date(today.getFullYear(), today.getMonth(), 1)
        break
      case "annuel":
        dateDebut = new Date(today.getFullYear(), 0, 1)
        break
    }

    const salesInPeriod = sales.filter((sale) => {
      const saleDate = new Date(sale.dateVente)
      return saleDate >= dateDebut && saleDate <= dateFin
    })

    const activeSales = salesInPeriod.filter((sale) => !sale.status || sale.status === "active")
    const cancelledSales = salesInPeriod.filter((sale) => sale.status === "cancelled")
    const refundedSales = salesInPeriod.filter((sale) => sale.status === "refunded")

    const totalVentes = activeSales.reduce((sum, sale) => {
      return sum + sale.produits.reduce((saleSum, product) => saleSum + product.quantite * product.prixUnitaire, 0)
    }, 0)

    const totalProduits = activeSales.reduce((sum, sale) => {
      return sum + sale.produits.reduce((prodSum, product) => prodSum + product.quantite, 0)
    }, 0)

    const produitsVendus: { [nom: string]: { quantite: number; chiffreAffaires: number } } = {}

    activeSales.forEach((sale) => {
      sale.produits.forEach((product) => {
        if (!produitsVendus[product.nom]) {
          produitsVendus[product.nom] = { quantite: 0, chiffreAffaires: 0 }
        }
        produitsVendus[product.nom].quantite += product.quantite
        produitsVendus[product.nom].chiffreAffaires += product.quantite * product.prixUnitaire
      })
    })

    const newReport: SalesReport = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      periode,
      dateDebut: dateDebut.toISOString().split("T")[0],
      dateFin: dateFin.toISOString().split("T")[0],
      nombreVentes: activeSales.length,
      totalVentes,
      totalProduits,
      produitsVendus,
      createdAt: new Date().toISOString(),
      nombreVentesAnnulees: cancelledSales.length,
      nombreVentesRemboursees: refundedSales.length,
      totalVentesAnnulees: cancelledSales.reduce((sum, sale) => {
        return sum + sale.produits.reduce((saleSum, product) => saleSum + product.quantite * product.prixUnitaire, 0)
      }, 0),
      totalVentesRemboursees: refundedSales.reduce((sum, sale) => {
        return sum + sale.produits.reduce((saleSum, product) => saleSum + product.quantite * product.prixUnitaire, 0)
      }, 0),
    }

    setReports((prev) => [newReport, ...prev])
    setSelectedReport(newReport)
    setShowReportPrint(true)
  }

  const deleteReport = async (reportId: string) => {
    setReports((prev) => prev.filter((report) => report.id !== reportId))
  }

  const restoreSaleFromTrash = (sale: Sale) => {
    setSales((prev) => [{ ...sale, status: "active" }, ...prev])
  }

  const validateSale = async (saleId: string) => {
    setSales((prev) =>
      prev.map((sale) => (sale.id === saleId ? { ...sale, isValidated: true, status: "active" } : sale)),
    )
  }

  const putSaleOnHold = async (saleId: string) => {
    setSales((prev) => prev.map((sale) => (sale.id === saleId ? { ...sale, status: "pending" } : sale)))
  }

  if (showReportPrint && selectedReport) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8 no-print">
            <h1 className="text-2xl font-bold">Rapport de Ventes - {selectedReport.periode}</h1>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  try {
                    window.print()
                  } catch (error) {
                    console.warn("Print not supported:", error)
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimer
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowReportPrint(false)
                  setSelectedReport(null)
                  setQrCodeSvg("")
                }}
              >
                Fermer
              </Button>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-8 shadow-lg">
            <div className="text-center mb-8">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGO%20DESIGNER.jpg-Bbt0O4WQXVS9oWTngAw2NzG3Tif6Ky.jpeg"
                alt="Designer Women's Logo"
                className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-pink-200"
              />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">DESIGNER WOMAN'S VENTE</h2>
              <h3 className="text-xl font-semibold text-pink-600 mb-4">Rapport {selectedReport.periode}</h3>
              <p className="text-sm text-gray-600">
                Du {selectedReport.dateDebut} au {selectedReport.dateFin}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Ventes Actives</h4>
                <p className="text-3xl font-bold text-blue-600">{selectedReport.nombreVentes}</p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Chiffre d'affaires</h4>
                <p className="text-3xl font-bold text-green-600">{selectedReport.totalVentes.toLocaleString()} F CFA</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-2">Produits vendus</h4>
                <p className="text-3xl font-bold text-purple-600">{selectedReport.totalProduits}</p>
              </div>
              <div className="bg-red-50 p-6 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">Ventes Annulées</h4>
                <p className="text-3xl font-bold text-red-600">{selectedReport.nombreVentesAnnulees || 0}</p>
                <p className="text-sm text-red-500 mt-1">
                  {(selectedReport.totalVentesAnnulees || 0).toLocaleString()} F CFA
                </p>
              </div>
              <div className="bg-yellow-50 p-6 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">Ventes Remboursées</h4>
                <p className="text-3xl font-bold text-yellow-600">{selectedReport.nombreVentesRemboursees || 0}</p>
                <p className="text-sm text-yellow-600 mt-1">
                  {(selectedReport.totalVentesRemboursees || 0).toLocaleString()} F CFA
                </p>
              </div>
              <div className="bg-orange-50 p-6 rounded-lg">
                <h4 className="font-semibold text-orange-800 mb-2">Moyenne par vente</h4>
                <p className="text-3xl font-bold text-orange-600">
                  {selectedReport.nombreVentes > 0
                    ? Math.round(selectedReport.totalVentes / selectedReport.nombreVentes).toLocaleString()
                    : 0}{" "}
                  F CFA
                </p>
              </div>
            </div>

            <div className="mb-8 p-6 bg-gray-50 rounded-lg">
              <h4 className="text-xl font-semibold text-gray-800 mb-4">Résumé Complet</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-white rounded border">
                  <p className="text-2xl font-bold text-gray-800">
                    {selectedReport.nombreVentes +
                      (selectedReport.nombreVentesAnnulees || 0) +
                      (selectedReport.nombreVentesRemboursees || 0)}
                  </p>
                  <p className="text-sm text-gray-600">Total Fiches Créées</p>
                </div>
                <div className="p-4 bg-white rounded border">
                  <p className="text-2xl font-bold text-green-600">
                    {selectedReport.totalVentes.toLocaleString()} F CFA
                  </p>
                  <p className="text-sm text-gray-600">Revenus Nets</p>
                </div>
                <div className="p-4 bg-white rounded border">
                  <p className="text-2xl font-bold text-red-600">
                    {(
                      (selectedReport.totalVentesAnnulees || 0) + (selectedReport.totalVentesRemboursees || 0)
                    ).toLocaleString()}{" "}
                    F CFA
                  </p>
                  <p className="text-sm text-gray-600">Pertes (Annulées + Remboursées)</p>
                </div>
              </div>
            </div>

            <div className="text-center mt-8 pt-8 border-t">
              <div className="inline-block">
                {qrCodeSvg ? (
                  <div className="w-32 h-32 mx-auto mb-4" dangerouslySetInnerHTML={{ __html: qrCodeSvg }} />
                ) : (
                  <div className="w-32 h-32 mx-auto mb-4 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-sm">QR Code</span>
                  </div>
                )}
                <p className="text-sm text-gray-600">Code QR - Rapport #{selectedReport.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showPrint && selectedSale) {
    return (
      <SalesPrint
        sale={selectedSale}
        onClose={() => {
          setShowPrint(false)
          setSelectedSale(null)
        }}
      />
    )
  }

  if (showViewModal && selectedSale) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">Détails de la Fiche de Vente #{selectedSale.id.slice(-6)}</h1>
            <Button
              variant="outline"
              onClick={() => {
                setShowViewModal(false)
                setSelectedSale(null)
              }}
            >
              Fermer
            </Button>
          </div>

          <div className="bg-white border rounded-lg p-8 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Informations Client</h3>
                <p>
                  <strong>Téléphone:</strong> {selectedSale.telephoneClient}
                </p>
                {selectedSale.telephoneClient2 && (
                  <p>
                    <strong>Téléphone 2:</strong> {selectedSale.telephoneClient2}
                  </p>
                )}
                <p>
                  <strong>Adresse de livraison:</strong> {selectedSale.adresseLivraison}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Informations Vente</h3>
                <p>
                  <strong>Date de vente:</strong> {new Date(selectedSale.dateVente).toLocaleDateString("fr-FR")}
                </p>
                <p>
                  <strong>Livreur:</strong> {selectedSale.livreur}
                </p>
                <p>
                  <strong>Mode de paiement:</strong> {selectedSale.modePaiement}
                </p>
                {selectedSale.modePaiement2 && (
                  <p>
                    <strong>Mode de paiement 2:</strong> {selectedSale.modePaiement2}
                  </p>
                )}
                <p>
                  <strong>Statut:</strong> {selectedSale.status || "active"}
                </p>
                <p>
                  <strong>Validée:</strong> {selectedSale.isValidated ? "Oui" : "Non"}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-4">Produits</h3>
              <div className="space-y-2">
                {selectedSale.produits.map((produit, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>{produit.nom}</span>
                    <span>
                      Quantité: {produit.quantite} {produit.unite} × {produit.prixUnitaire.toLocaleString()} F CFA ={" "}
                      {(produit.quantite * produit.prixUnitaire).toLocaleString()} F CFA
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <p className="text-lg font-bold text-green-800">
                  Total:{" "}
                  {selectedSale.produits.reduce((sum, p) => sum + p.quantite * p.prixUnitaire, 0).toLocaleString()} F
                  CFA
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showEditModal && selectedSale) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">Modifier la Fiche de Vente #{selectedSale.id.slice(-6)}</h1>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false)
                setSelectedSale(null)
              }}
            >
              Annuler
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <SalesForm
                initialData={selectedSale}
                onSubmit={(saleData) => {
                  const updatedSale: Sale = {
                    ...saleData,
                    id: selectedSale.id,
                    createdAt: selectedSale.createdAt,
                    status: selectedSale.status,
                    isValidated: selectedSale.isValidated,
                  }
                  updateSale(updatedSale)
                }}
                isEditing={true}
                onValidate={validateSale}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthGuard />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <WelcomeDialog isOpen={showWelcome} onClose={() => setShowWelcome(false)} username={username || "Utilisateur"} />

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600">
            Connecté en tant que: <span className="font-semibold">{username || "Utilisateur"}</span>
          </div>
          <Button
            onClick={logout}
            variant="outline"
            size="sm"
            className="text-red-600 border-red-300 hover:bg-red-50 bg-transparent"
          >
            Se déconnecter
          </Button>
        </div>

        <div className="flex items-center justify-center mb-8">
          <img
            src="/designer-womens-logo.png"
            alt="Designer Women's Logo"
            className="w-20 h-20 mr-6 rounded-full border-2 border-pink-200 shadow-lg"
          />
          <div className="text-center">
            <h1 className="font-serif text-6xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2 tracking-tight leading-tight drop-shadow-sm">
              DESIGNER WOMAN'S
            </h1>
            <div className="font-serif text-2xl font-semibold text-gray-700 tracking-widest uppercase">GESTION</div>
            <div className="w-32 h-1 bg-gradient-to-r from-pink-400 to-purple-500 mx-auto mt-3 rounded-full"></div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center gap-4 mb-8 p-4">
            <TabsList className="flex gap-3 bg-transparent p-0 h-auto">
              <TabsTrigger
                value="create"
                className="flex flex-col items-center gap-2 text-gray-700 font-semibold transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-2xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:scale-110 rounded-2xl p-4 bg-white shadow-lg border-2 border-gray-200 hover:border-indigo-300 min-w-[120px] h-20 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl"></div>
                <FileText className="w-6 h-6 relative z-10" />
                <span className="relative z-10 text-xs text-center leading-tight">
                  Nouvelle
                  <br />
                  Fiche
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="database"
                className="flex flex-col items-center gap-2 text-gray-700 font-semibold transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-2xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:scale-110 rounded-2xl p-4 bg-white shadow-lg border-2 border-gray-200 hover:border-purple-300 min-w-[120px] h-20 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl"></div>
                <Database className="w-6 h-6 relative z-10" />
                <span className="relative z-10 text-xs text-center leading-tight">
                  Base de
                  <br />
                  Données
                </span>
              </TabsTrigger>

              {isAdmin && (
                <TabsTrigger
                  value="stock"
                  className="flex flex-col items-center gap-2 text-gray-700 font-semibold transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-2xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:scale-110 rounded-2xl p-4 bg-white shadow-lg border-2 border-gray-200 hover:border-green-300 min-w-[120px] h-20 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl"></div>
                  <Package className="w-6 h-6 relative z-10" />
                  <span className="relative z-10 text-xs text-center leading-tight">
                    Gestion
                    <br />
                    Stock
                  </span>
                </TabsTrigger>
              )}

              <TabsTrigger
                value="trash"
                className="flex flex-col items-center gap-2 text-gray-700 font-semibold transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-2xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:scale-110 rounded-2xl p-4 bg-white shadow-lg border-2 border-gray-200 hover:border-red-300 min-w-[120px] h-20 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl"></div>
                <Trash2 className="w-6 h-6 relative z-10" />
                <span className="relative z-10 text-xs text-center leading-tight">Corbeille</span>
              </TabsTrigger>

              {isAdmin && (
                <TabsTrigger
                  value="export"
                  className="flex flex-col items-center gap-2 text-gray-700 font-semibold transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-2xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:scale-110 rounded-2xl p-4 bg-white shadow-lg border-2 border-gray-200 hover:border-orange-300 min-w-[120px] h-20 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl"></div>
                  <Printer className="w-6 h-6 relative z-10" />
                  <span className="relative z-10 text-xs text-center leading-tight">Export</span>
                </TabsTrigger>
              )}

              {isAdmin && (
                <TabsTrigger
                  value="reports"
                  className="flex flex-col items-center gap-2 text-gray-700 font-semibold transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-2xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-pink-500 data-[state=active]:to-rose-600 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:scale-110 rounded-2xl p-4 bg-white shadow-lg border-2 border-gray-200 hover:border-pink-300 min-w-[120px] h-20 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-rose-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl"></div>
                  <div className="flex items-center gap-1 relative z-10">
                    <FileText className="w-6 h-6" />
                    <span className="bg-cyan-400 text-pink-800 text-xs font-bold px-2 py-1 rounded-full">
                      {reports.length}
                    </span>
                  </div>
                  <span className="relative z-10 text-xs text-center leading-tight">Rapports</span>
                </TabsTrigger>
              )}

              {isAdmin && (
                <TabsTrigger
                  value="admin"
                  className="flex flex-col items-center gap-2 text-gray-700 font-semibold transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-2xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-slate-500 data-[state=active]:to-gray-600 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:scale-110 rounded-2xl p-4 bg-white shadow-lg border-2 border-gray-200 hover:border-slate-300 min-w-[120px] h-20 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-400 to-gray-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl"></div>
                  <Settings className="w-6 h-6 relative z-10" />
                  <span className="relative z-10 text-xs text-center leading-tight">Administration</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Créer une Nouvelle Fiche de Vente</CardTitle>
              </CardHeader>
              <CardContent>
                <SalesForm onSubmit={addSale} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle>Base de Données des Ventes</CardTitle>
              </CardHeader>
              <CardContent>
                <SalesDatabase
                  sales={sales}
                  onPrint={printSale}
                  onDelete={deleteSale}
                  onView={viewSale}
                  onEdit={editSale}
                  onCancel={cancelSale}
                  onRefund={refundSale}
                  onValidate={validateSale}
                  onPutOnHold={putSaleOnHold}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="stock">
              <Card>
                <CardHeader>
                  <CardTitle>Gestion de Stock</CardTitle>
                </CardHeader>
                <CardContent>
                  <StockManagement />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="export">
              <Card>
                <CardHeader>
                  <CardTitle>Export des Données</CardTitle>
                </CardHeader>
                <CardContent className="text-center py-8">
                  <div className="mb-6">
                    <Database className="w-16 h-16 mx-auto text-blue-500 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      {sales.length} fiche{sales.length > 1 ? "s" : ""} de vente enregistrée
                      {sales.length > 1 ? "s" : ""}
                    </h3>
                    <p className="text-gray-600">Exportez toutes vos données au format CSV</p>
                  </div>
                  <ExportData sales={sales} />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="reports">
              <ReportsManagement reports={reports} onDelete={deleteReport} onGenerate={generateReport} />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="admin">
              <AdminManagement />
            </TabsContent>
          )}

          <TabsContent value="trash">
            <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200">
              <CardHeader className="bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-t-lg">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Trash2 className="w-6 h-6" />
                  Corbeille des Produits Supprimés
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <TrashManagement onRestoreSale={restoreSaleFromTrash} onSwitchTab={setActiveTab} isAdmin={isAdmin} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
