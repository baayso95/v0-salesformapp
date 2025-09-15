"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SalesForm } from "@/components/sales-form"
import { SalesPrint } from "@/components/sales-print"
import { useAuth } from "@/contexts/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import QRCode from "qrcode"
import StockManager from "@/lib/stock-manager"
import { FileText, Database, Printer, Package, Trash2, BarChart3, Plus, Eye, Edit, Save } from "lucide-react"
import { WelcomeDialog } from "@/components/welcome-dialog"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  status?: "active" | "cancelled" | "refunded" | "pending" | "deleted"
  isValidated?: boolean
  nomClient: string
  nomProduit: string
  quantite: number
  prixUnitaire: number
  prixTotal: number
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

export interface StockItem {
  id: string
  nom: string
  quantite: number
  prixUnitaire: number
}

const loadData = async (
  supabase: any,
  setSales: (sales: Sale[]) => void,
  setStock: (stock: StockItem[]) => void,
  stockManager: any,
  setReports: (reports: any[]) => void,
) => {
  try {
    console.log("[v0] Starting data migration to Supabase...")

    // Check if migration has already been done
    const migrationKey = "supabase_migration_completed"
    const migrationCompleted = localStorage.getItem(migrationKey)

    if (!migrationCompleted) {
      // Migrate existing localStorage data to Supabase
      const existingSales = JSON.parse(localStorage.getItem("sales") || "[]")
      const existingStock = JSON.parse(localStorage.getItem("stock") || "[]")

      // Migrate sales
      for (const sale of existingSales) {
        const { error } = await supabase.from("sales").insert({
          client_name: sale.telephoneClient || "Client inconnu",
          product_name: sale.produits?.[0]?.nom || "Produit inconnu",
          quantity: sale.produits?.reduce((sum: number, p: any) => sum + p.quantite, 0) || 1,
          unit_price: sale.produits?.[0]?.prixUnitaire || 0,
          total_price: sale.produits?.reduce((sum: number, p: any) => sum + p.quantite * p.prixUnitaire, 0) || 0,
          status: "active",
          sale_date: sale.createdAt || new Date().toISOString(),
        })

        if (error) {
          console.error("Error migrating sale:", error)
        }
      }

      // Migrate stock
      for (const item of existingStock) {
        const { error } = await supabase.from("stock").insert({
          product_name: item.nom,
          quantity: item.quantite,
          unit_price: item.prixUnitaire,
        })

        if (error) {
          console.error("Error migrating stock:", error)
        }
      }

      localStorage.setItem(migrationKey, "true")
      console.log("[v0] Migration completed successfully")
    } else {
      console.log("[v0] Migration already completed, skipping...")
    }

    // Load sales from Supabase
    const { data: salesData, error: salesError } = await supabase
      .from("sales")
      .select("*")
      .order("created_at", { ascending: false })

    if (salesError) {
      console.error("Error loading sales:", salesError)
      throw salesError
    }

    // Transform Supabase data to match local format
    const transformedSales = salesData.map((sale: any) => ({
      id: sale.id,
      telephoneClient: sale.client_name,
      telephoneClient2: "",
      adresseLivraison: "",
      produits: [
        {
          nom: sale.product_name,
          quantite: sale.quantity,
          prixUnitaire: sale.unit_price,
        },
      ],
      livreur: "",
      dateVente: sale.sale_date ? sale.sale_date.split("T")[0] : new Date().toISOString().split("T")[0],
      createdAt: sale.created_at,
      status: sale.status,
      nomClient: sale.client_name,
      nomProduit: sale.product_name,
      quantite: sale.quantity,
      prixUnitaire: sale.unit_price,
      prixTotal: sale.total_price,
    }))

    setSales(transformedSales)
    console.log(`[v0] Loaded ${transformedSales.length} sales from Supabase`)

    // Load stock from Supabase
    const { data: stockData, error: stockError } = await supabase.from("stock").select("*")

    if (stockError) {
      console.error("Error loading stock:", stockError)
      throw stockError
    }

    const transformedStock = stockData.map((item: any) => ({
      id: item.id,
      nom: item.product_name,
      quantite: item.quantity,
      prixUnitaire: item.unit_price,
    }))

    setStock(transformedStock)
    console.log(`[v0] Loaded ${transformedStock.length} stock items from Supabase`)
  } catch (error) {
    console.error("[v0] Error in loadData:", error)
    // Fallback to localStorage if Supabase fails
    const localSales = JSON.parse(localStorage.getItem("sales") || "[]")
    const localStock = JSON.parse(localStorage.getItem("stock") || "[]")
    setSales(localSales)
    setStock(localStock)
  }
}

const migrateLocalStorageToSupabase = async (supabase) => {
  try {
    // Check if migration has already been done
    const migrationKey = "supabase_migration_completed"
    if (localStorage.getItem(migrationKey)) {
      console.log("[v0] Migration already completed, skipping...")
      return
    }

    console.log("[v0] Starting migration from localStorage to Supabase...")

    // Migrate sales data
    const savedSales = localStorage.getItem("sales-data")
    if (savedSales) {
      const salesData = JSON.parse(savedSales)
      console.log(`[v0] Migrating ${salesData.length} sales to Supabase...`)

      for (const sale of salesData) {
        const { error } = await supabase.from("sales").upsert({
          id: sale.id,
          client_name: sale.telephoneClient,
          client_phone: sale.telephoneClient,
          client_address: sale.adresseLivraison,
          products: sale.produits,
          total_amount: sale.produits.reduce((sum, p) => sum + p.quantite * p.prixUnitaire, 0),
          status: sale.status || "active",
          created_at: sale.createdAt || new Date().toISOString(),
        })

        if (error) {
          console.error(`[v0] Error migrating sale ${sale.id}:`, error)
        }
      }
    }

    // Migrate stock data
    const savedStock = localStorage.getItem("stock-data")
    if (savedStock) {
      const stockData = JSON.parse(savedStock)
      console.log(`[v0] Migrating ${stockData.length} stock items to Supabase...`)

      for (const item of stockData) {
        const { error } = await supabase.from("stock").upsert({
          id: item.id,
          product_name: item.nom,
          quantity: item.quantite,
          unit_price: item.prixUnitaire,
          created_at: new Date().toISOString(),
        })

        if (error) {
          console.error(`[v0] Error migrating stock item ${item.id}:`, error)
        }
      }
    }

    // Mark migration as completed
    localStorage.setItem(migrationKey, "true")
    console.log("[v0] Migration completed successfully!")
  } catch (error) {
    console.error("[v0] Error during migration:", error)
  }
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
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [stock, setStock] = useState<{ id: string; nom: string; quantite: number; prixUnitaire: number }[]>([])
  const [formData, setFormData] = useState({
    nomClient: "",
    telephoneClient: "",
    telephoneClient2: "",
    nomProduit: "",
    quantite: 1,
    prixUnitaire: 0,
    adresseLivraison: "",
    statut: "En cours",
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [editFormData, setEditFormData] = useState({
    nomClient: "",
    telephoneClient: "",
    telephoneClient2: "",
    nomProduit: "",
    quantite: 1,
    prixUnitaire: 0,
    adresseLivraison: "",
    statut: "En cours",
  })
  const [reportPeriod, setReportPeriod] = useState("today")
  const [customDate, setCustomDate] = useState("")

  const stockManager = StockManager.getInstance()
  const supabase = createClient()

  useEffect(() => {
    setIsDataLoading(true)
    loadData(supabase, setSales, setStock, stockManager, setReports).finally(() => setIsDataLoading(false))
  }, [supabase])

  useEffect(() => {
    let channel: any = null

    const setupRealtimeSubscription = async () => {
      try {
        const { error } = await supabase.from("sales").select("id").limit(1)

        if (!error) {
          channel = supabase
            .channel("sales-changes")
            .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, (payload) => {
              console.log("[v0] Sales change detected:", payload)
              loadData(supabase, setSales, setStock, stockManager, setReports)
            })
            .on("postgres_changes", { event: "*", schema: "public", table: "stock" }, (payload) => {
              console.log("[v0] Stock change detected:", payload)
              loadData(supabase, setSales, setStock, stockManager, setReports)
            })
            .subscribe()
        } else {
          console.log("[v0] Tables not available, real-time subscriptions disabled")
        }
      } catch (error) {
        console.log("[v0] Real-time subscriptions not available, using localStorage only")
      }
    }

    setupRealtimeSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [supabase])

  useEffect(() => {
    if (!supabase) return

    const salesChannel = supabase
      .channel("sales-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, (payload: any) => {
        console.log("[v0] Sales change detected:", payload)

        if (payload.eventType === "INSERT") {
          const newSale = {
            id: payload.new.id,
            telephoneClient: payload.new.client_name || "",
            telephoneClient2: "",
            adresseLivraison: "",
            produits: [
              {
                nom: payload.new.product_name || "",
                quantite: payload.new.quantity || 1,
                prixUnitaire: payload.new.unit_price || 0,
              },
            ],
            livreur: "",
            dateVente: payload.new.sale_date
              ? payload.new.sale_date.split("T")[0]
              : new Date().toISOString().split("T")[0],
            createdAt: payload.new.created_at,
            status: payload.new.status || "active",
            nomClient: payload.new.client_name,
            nomProduit: payload.new.product_name,
            quantite: payload.new.quantity,
            prixUnitaire: payload.new.unit_price,
            prixTotal: payload.new.total_price,
          }
          setSales((prev) => [newSale, ...prev])
        } else if (payload.eventType === "UPDATE") {
          const updatedSale = {
            id: payload.new.id,
            telephoneClient: payload.new.client_name || "",
            telephoneClient2: "",
            adresseLivraison: "",
            produits: [
              {
                nom: payload.new.product_name || "",
                quantite: payload.new.quantity || 1,
                prixUnitaire: payload.new.unit_price || 0,
              },
            ],
            livreur: "",
            dateVente: payload.new.sale_date
              ? payload.new.sale_date.split("T")[0]
              : new Date().toISOString().split("T")[0],
            createdAt: payload.new.created_at,
            status: payload.new.status || "active",
            nomClient: payload.new.client_name,
            nomProduit: payload.new.product_name,
            quantite: payload.new.quantity,
            prixUnitaire: payload.new.unit_price,
            prixTotal: payload.new.total_price,
          }
          setSales((prev) => prev.map((sale) => (sale.id === payload.new.id ? updatedSale : sale)))
        } else if (payload.eventType === "DELETE") {
          setSales((prev) => prev.filter((sale) => sale.id !== payload.old.id))
        }
      })
      .subscribe()

    const stockChannel = supabase
      .channel("stock-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "stock" }, (payload: any) => {
        console.log("[v0] Stock change detected:", payload)

        if (payload.eventType === "INSERT") {
          const newStock = {
            id: payload.new.id,
            nom: payload.new.product_name,
            quantite: payload.new.quantity,
            prixUnitaire: payload.new.unit_price,
          }
          setStock((prev) => [...prev, newStock])
        } else if (payload.eventType === "UPDATE") {
          const updatedStock = {
            id: payload.new.id,
            nom: payload.new.product_name,
            quantite: payload.new.quantity,
            prixUnitaire: payload.new.unit_price,
          }
          setStock((prev) => prev.map((item) => (item.id === payload.new.id ? updatedStock : item)))
        } else if (payload.eventType === "DELETE") {
          setStock((prev) => prev.filter((item) => item.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      salesChannel.unsubscribe()
      stockChannel.unsubscribe()
    }
  }, [supabase])

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

  const addSale = async (saleData: Omit<Sale, "id" | "createdAt">) => {
    try {
      const { data, error } = await supabase
        .from("sales")
        .insert({
          client_name: saleData.telephoneClient || "Client inconnu",
          product_name: saleData.produits?.[0]?.nom || "Produit inconnu",
          quantity: saleData.produits?.reduce((sum, p) => sum + p.quantite, 0) || 1,
          unit_price: saleData.produits?.[0]?.prixUnitaire || 0,
          total_price: saleData.produits?.reduce((sum, p) => sum + p.quantite * p.prixUnitaire, 0) || 0,
          status: "active",
          sale_date: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("Error adding sale to Supabase:", error)
        throw error
      }

      console.log("[v0] Sale added to Supabase successfully")

      await loadData(supabase, setSales, setStock, stockManager, setReports)
    } catch (error) {
      console.error("Error in addSale:", error)
      throw error
    }
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

      try {
        const { error: trashError } = await supabase.from("trash").insert({
          item_type: "sale",
          item_id: saleId,
          item_data: saleToDelete,
        })

        if (trashError) {
          console.error("Error adding to trash:", trashError)
        }

        const { error: updateError } = await supabase.from("sales").update({ status: "deleted" }).eq("id", saleId)

        if (updateError) {
          console.error("Error updating sale status:", updateError)
          throw updateError
        }

        console.log("[v0] Sale deleted successfully")
      } catch (error) {
        console.error("Error in deleteSale:", error)
        throw error
      }
    }
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

    try {
      const { error } = await supabase.from("sales").update({ status: "cancelled" }).eq("id", saleId)

      if (error) {
        console.error("Error updating sale status:", error)
        throw error
      }

      console.log("[v0] Sale cancelled successfully")
    } catch (error) {
      console.error("Error in cancelSale:", error)
      throw error
    }
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

    try {
      const { error } = await supabase.from("sales").update({ status: "refunded" }).eq("id", saleId)

      if (error) {
        console.error("Error updating sale status:", error)
        throw error
      }

      console.log("[v0] Sale refunded successfully")
    } catch (error) {
      console.error("Error in refundSale:", error)
      throw error
    }
  }

  const viewSale = (sale: Sale) => {
    setSelectedSale(sale)
    setShowViewModal(true)
  }

  const editSale = (sale: Sale) => {
    setSelectedSale(sale)
    setShowEditModal(true)
  }

  const updateSale = async (id: string, updatedSale: Sale) => {
    try {
      const { error } = await supabase
        .from("sales")
        .update({
          client_name: updatedSale.telephoneClient || "Client inconnu",
          product_name: updatedSale.produits?.[0]?.nom || "Produit inconnu",
          quantity: updatedSale.produits?.reduce((sum, p) => sum + p.quantite, 0) || 1,
          unit_price: updatedSale.produits?.[0]?.prixUnitaire || 0,
          total_price: updatedSale.produits?.reduce((sum, p) => sum + p.quantite * p.prixUnitaire, 0) || 0,
          status: updatedSale.status || "active",
          sale_date: updatedSale.dateVente || new Date().toISOString().split("T")[0],
        })
        .eq("id", id)

      if (error) {
        console.error("Error updating sale in Supabase:", error)
        throw error
      }

      console.log("[v0] Sale updated in Supabase successfully")
      await loadData(supabase, setSales, setStock, stockManager, setReports)
    } catch (error) {
      console.error("Error in updateSale:", error)
      throw error
    }
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

  const restoreSaleFromTrash = async (sale: Sale) => {
    try {
      const { error } = await supabase.from("sales").update({ status: "active" }).eq("id", sale.id)

      if (error) {
        console.error("Error restoring sale:", error)
        throw error
      }

      const { error: trashError } = await supabase.from("trash").delete().eq("item_id", sale.id)

      if (trashError) {
        console.error("Error removing from trash:", trashError)
      }

      console.log("[v0] Sale restored successfully")
      setActiveTab("database")
    } catch (error) {
      console.error("Error in restoreSaleFromTrash:", error)
      throw error
    }
  }

  const validateSale = async (saleId: string) => {
    try {
      const { error } = await supabase.from("sales").update({ status: "active" }).eq("id", saleId)

      if (error) {
        console.error("Error validating sale:", error)
        throw error
      }

      console.log("[v0] Sale validated successfully")
    } catch (error) {
      console.error("Error in validateSale:", error)
      throw error
    }
  }

  const putSaleOnHold = async (saleId: string) => {
    try {
      const { error } = await supabase.from("sales").update({ status: "pending" }).eq("id", saleId)

      if (error) {
        console.error("Error putting sale on hold:", error)
        throw error
      }

      console.log("[v0] Sale put on hold successfully")
    } catch (error) {
      console.error("Error in putSaleOnHold:", error)
      throw error
    }
  }

  const handleSubmit = async () => {
    try {
      const newSale = {
        ...formData,
        prixTotal: formData.quantite * formData.prixUnitaire,
      }

      setSales((prevSales) => [...prevSales, newSale])

      setFormData({
        nomClient: "",
        telephoneClient: "",
        telephoneClient2: "",
        nomProduit: "",
        quantite: 1,
        prixUnitaire: 0,
        adresseLivraison: "",
        statut: "En cours",
      })
    } catch (error) {
      console.error("Error adding sale:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "En cours":
        return "bg-blue-100 text-blue-700"
      case "Livrée":
        return "bg-green-100 text-green-700"
      case "Annulée":
        return "bg-red-100 text-red-700"
      case "Remboursée":
        return "bg-yellow-100 text-yellow-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const filteredSales = sales.filter((sale) => {
    const searchTermLower = searchTerm.toLowerCase()
    const nomClientLower = sale.nomClient.toLowerCase()
    const nomProduitLower = sale.nomProduit.toLowerCase()

    const matchesSearchTerm = nomClientLower.includes(searchTermLower) || nomProduitLower.includes(searchTermLower)

    const matchesStatus = statusFilter === "all" || sale.statut === statusFilter

    return matchesSearchTerm && matchesStatus
  })

  const handleEditSale = async () => {
    try {
      if (!selectedSale) return

      const updatedSale = {
        ...selectedSale,
        ...editFormData,
        prixTotal: editFormData.quantite * editFormData.prixUnitaire,
      }

      setSales((prevSales) => prevSales.map((sale) => (sale.id === selectedSale.id ? updatedSale : sale)))

      setShowEditModal(false)
      setSelectedSale(null)
    } catch (error) {
      console.error("Error updating sale:", error)
    }
  }

  const handleDeleteSale = async (saleId: string) => {
    try {
      setSales((prevSales) => prevSales.filter((sale) => sale.id !== saleId))
    } catch (error) {
      console.error("Error deleting sale:", error)
    }
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
                  updateSale(selectedSale.id, updatedSale)
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

  if (isLoading || isDataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données...</p>
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
          <div className="mb-6 px-2">
            <TabsList className="flex gap-2 bg-transparent p-0 h-auto w-full overflow-x-auto scrollbar-hide">
              <TabsTrigger
                value="create"
                className="flex flex-col items-center gap-1 text-gray-700 font-semibold transition-all duration-300 ease-in-out hover:scale-105 data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 rounded-xl p-3 bg-white shadow-md border border-gray-200 hover:border-indigo-300 min-w-[100px] sm:min-w-[120px] h-16 sm:h-20 relative overflow-hidden group flex-shrink-0"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl"></div>
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />
                <span className="relative z-10 text-xs text-center leading-tight">
                  Nouvelle
                  <br className="hidden sm:block" />
                  <span className="sm:hidden"> </span>
                  Fiche
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="database"
                className="flex flex-col items-center gap-1 text-gray-700 font-semibold transition-all duration-300 ease-in-out hover:scale-105 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 rounded-xl p-3 bg-white shadow-md border border-gray-200 hover:border-purple-300 min-w-[100px] sm:min-w-[120px] h-16 sm:h-20 relative overflow-hidden group flex-shrink-0"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl"></div>
                <Database className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />
                <span className="relative z-10 text-xs text-center leading-tight">
                  Base
                  <br className="hidden sm:block" />
                  <span className="sm:hidden"> </span>
                  Données
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="stock"
                className="flex flex-col items-center gap-1 text-gray-700 font-semibold transition-all duration-300 ease-in-out hover:scale-105 data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 rounded-xl p-3 bg-white shadow-md border border-gray-200 hover:border-green-300 min-w-[100px] sm:min-w-[120px] h-16 sm:h-20 relative overflow-hidden group flex-shrink-0"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl"></div>
                <Package className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />
                <span className="relative z-10 text-xs text-center leading-tight">Stock</span>
              </TabsTrigger>

              <TabsTrigger
                value="reports"
                className="flex flex-col items-center gap-1 text-gray-700 font-semibold transition-all duration-300 ease-in-out hover:scale-105 data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 rounded-xl p-3 bg-white shadow-md border border-gray-200 hover:border-orange-300 min-w-[100px] sm:min-w-[120px] h-16 sm:h-20 relative overflow-hidden group flex-shrink-0"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl"></div>
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />
                <span className="relative z-10 text-xs text-center leading-tight">Rapports</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="create" className="space-y-6">
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800 text-center">
                  Créer une Nouvelle Fiche de Vente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nomClient" className="text-sm font-medium text-gray-700">
                      Nom du Client *
                    </Label>
                    <Input
                      id="nomClient"
                      value={formData.nomClient}
                      onChange={(e) => setFormData({ ...formData, nomClient: e.target.value })}
                      placeholder="Entrez le nom du client"
                      className="w-full h-11 text-base"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telephoneClient" className="text-sm font-medium text-gray-700">
                      Téléphone Client *
                    </Label>
                    <Input
                      id="telephoneClient"
                      value={formData.telephoneClient}
                      onChange={(e) => setFormData({ ...formData, telephoneClient: e.target.value })}
                      placeholder="Ex: +225 01 02 03 04 05"
                      className="w-full h-11 text-base"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telephoneClient2" className="text-sm font-medium text-gray-700">
                      Téléphone Client 2
                    </Label>
                    <Input
                      id="telephoneClient2"
                      value={formData.telephoneClient2}
                      onChange={(e) => setFormData({ ...formData, telephoneClient2: e.target.value })}
                      placeholder="Téléphone secondaire (optionnel)"
                      className="w-full h-11 text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nomProduit" className="text-sm font-medium text-gray-700">
                      Nom du Produit *
                    </Label>
                    <Input
                      id="nomProduit"
                      value={formData.nomProduit}
                      onChange={(e) => setFormData({ ...formData, nomProduit: e.target.value })}
                      placeholder="Entrez le nom du produit"
                      className="w-full h-11 text-base"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantite" className="text-sm font-medium text-gray-700">
                      Quantité *
                    </Label>
                    <Input
                      id="quantite"
                      type="number"
                      min="1"
                      value={formData.quantite}
                      onChange={(e) => setFormData({ ...formData, quantite: Number.parseInt(e.target.value) || 1 })}
                      className="w-full h-11 text-base"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prixUnitaire" className="text-sm font-medium text-gray-700">
                      Prix Unitaire (F CFA) *
                    </Label>
                    <Input
                      id="prixUnitaire"
                      type="number"
                      min="0"
                      value={formData.prixUnitaire}
                      onChange={(e) =>
                        setFormData({ ...formData, prixUnitaire: Number.parseFloat(e.target.value) || 0 })
                      }
                      placeholder="0"
                      className="w-full h-11 text-base"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adresseLivraison" className="text-sm font-medium text-gray-700">
                    Adresse de Livraison *
                  </Label>
                  <Textarea
                    id="adresseLivraison"
                    value={formData.adresseLivraison}
                    onChange={(e) => setFormData({ ...formData, adresseLivraison: e.target.value })}
                    placeholder="Entrez l'adresse complète de livraison"
                    className="w-full min-h-[80px] text-base resize-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="statut" className="text-sm font-medium text-gray-700">
                    Statut de la Vente
                  </Label>
                  <Select
                    value={formData.statut}
                    onValueChange={(value) => setFormData({ ...formData, statut: value })}
                  >
                    <SelectTrigger className="w-full h-11 text-base">
                      <SelectValue placeholder="Sélectionnez le statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="En cours">En cours</SelectItem>
                      <SelectItem value="Livrée">Livrée</SelectItem>
                      <SelectItem value="Annulée">Annulée</SelectItem>
                      <SelectItem value="Remboursée">Remboursée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Total de la vente:</span>
                    <span className="text-xl sm:text-2xl font-bold text-indigo-600">
                      {(formData.quantite * formData.prixUnitaire).toLocaleString()} F CFA
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={
                    !formData.nomClient ||
                    !formData.telephoneClient ||
                    !formData.nomProduit ||
                    !formData.adresseLivraison
                  }
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Créer la Fiche de Vente
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-6">
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800 text-center">
                  Base de Données des Ventes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="Rechercher par nom de client ou produit..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full h-11 text-base"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48 h-11 text-base">
                      <SelectValue placeholder="Filtrer par statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="En cours">En cours</SelectItem>
                      <SelectItem value="Livrée">Livrée</SelectItem>
                      <SelectItem value="Annulée">Annulée</SelectItem>
                      <SelectItem value="Remboursée">Remboursée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  {filteredSales.length === 0 ? (
                    <div className="text-center py-12">
                      <Database className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500 text-lg">Aucune vente trouvée</p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop table view */}
                      <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                                ID
                              </th>
                              <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                                Client
                              </th>
                              <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                                Produit
                              </th>
                              <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                                Quantité
                              </th>
                              <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                                Prix Total
                              </th>
                              <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                                Statut
                              </th>
                              <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                                Date
                              </th>
                              <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredSales.map((sale) => (
                              <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                                <td className="border border-gray-200 px-4 py-3 text-sm">#{sale.id.slice(-6)}</td>
                                <td className="border border-gray-200 px-4 py-3 text-sm font-medium">
                                  {sale.nomClient}
                                </td>
                                <td className="border border-gray-200 px-4 py-3 text-sm">{sale.nomProduit}</td>
                                <td className="border border-gray-200 px-4 py-3 text-sm text-center">
                                  {sale.quantite}
                                </td>
                                <td className="border border-gray-200 px-4 py-3 text-sm font-semibold text-green-600">
                                  {sale.prixTotal.toLocaleString()} F CFA
                                </td>
                                <td className="border border-gray-200 px-4 py-3 text-sm">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sale.statut)}`}
                                  >
                                    {sale.statut}
                                  </span>
                                </td>
                                <td className="border border-gray-200 px-4 py-3 text-sm">
                                  {new Date(sale.dateVente).toLocaleDateString("fr-FR")}
                                </td>
                                <td className="border border-gray-200 px-4 py-3 text-center">
                                  <div className="flex justify-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedSale(sale)
                                        setShowDetailModal(true)
                                      }}
                                      className="h-8 px-3"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedSale(sale)
                                        setEditFormData({
                                          nomClient: sale.nomClient,
                                          telephoneClient: sale.telephoneClient,
                                          telephoneClient2: sale.telephoneClient2 || "",
                                          nomProduit: sale.nomProduit,
                                          quantite: sale.quantite,
                                          prixUnitaire: sale.prixUnitaire,
                                          adresseLivraison: sale.adresseLivraison,
                                          statut: sale.statut,
                                        })
                                        setShowEditModal(true)
                                      }}
                                      className="h-8 px-3"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDeleteSale(sale.id)}
                                      className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile card view */}
                      <div className="lg:hidden space-y-4">
                        {filteredSales.map((sale) => (
                          <Card key={sale.id} className="border border-gray-200 shadow-sm">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h3 className="font-semibold text-gray-800 text-base">#{sale.id.slice(-6)}</h3>
                                  <p className="text-sm text-gray-600">{sale.nomClient}</p>
                                </div>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sale.statut)}`}
                                >
                                  {sale.statut}
                                </span>
                              </div>

                              <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Produit:</span>
                                  <span className="font-medium">{sale.nomProduit}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Quantité:</span>
                                  <span className="font-medium">{sale.quantite}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Total:</span>
                                  <span className="font-semibold text-green-600">
                                    {sale.prixTotal.toLocaleString()} F CFA
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Date:</span>
                                  <span className="font-medium">
                                    {new Date(sale.dateVente).toLocaleDateString("fr-FR")}
                                  </span>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSale(sale)
                                    setShowDetailModal(true)
                                  }}
                                  className="flex-1 h-9 text-sm"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Voir
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSale(sale)
                                    setEditFormData({
                                      nomClient: sale.nomClient,
                                      telephoneClient: sale.telephoneClient,
                                      telephoneClient2: sale.telephoneClient2 || "",
                                      nomProduit: sale.nomProduit,
                                      quantite: sale.quantite,
                                      prixUnitaire: sale.prixUnitaire,
                                      adresseLivraison: sale.adresseLivraison,
                                      statut: sale.statut,
                                    })
                                    setShowEditModal(true)
                                  }}
                                  className="flex-1 h-9 text-sm"
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Modifier
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteSale(sale.id)}
                                  className="h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800 text-center">
                  Rapports et Statistiques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Période de rapport</Label>
                    <Select value={reportPeriod} onValueChange={setReportPeriod}>
                      <SelectTrigger className="w-full h-11 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Aujourd'hui</SelectItem>
                        <SelectItem value="week">Cette semaine</SelectItem>
                        <SelectItem value="month">Ce mois</SelectItem>
                        <SelectItem value="year">Cette année</SelectItem>
                        <SelectItem value="all">Toutes les périodes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Date personnalisée</Label>
                    <Input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="w-full h-11 text-base"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <Button
                    onClick={() => generateReport("journalier")}
                    className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                  >
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Rapport Journalier
                  </Button>
                  <Button
                    onClick={() => generateReport("mensuel")}
                    className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                  >
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Rapport Mensuel
                  </Button>
                  <Button
                    onClick={() => generateReport("annuel")}
                    className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
                  >
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Rapport Annuel
                  </Button>
                </div>

                {selectedReport && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                      <div className="bg-blue-50 p-4 sm:p-6 rounded-lg">
                        <h4 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">Ventes Actives</h4>
                        <p className="text-2xl sm:text-3xl font-bold text-blue-600">{selectedReport.nombreVentes}</p>
                      </div>
                      <div className="bg-green-50 p-4 sm:p-6 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2 text-sm sm:text-base">Chiffre d'affaires</h4>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">
                          {selectedReport.totalVentes.toLocaleString()} F CFA
                        </p>
                      </div>
                      <div className="bg-purple-50 p-4 sm:p-6 rounded-lg">
                        <h4 className="font-semibold text-purple-800 mb-2 text-sm sm:text-base">Produits vendus</h4>
                        <p className="text-2xl sm:text-3xl font-bold text-purple-600">{selectedReport.totalProduits}</p>
                      </div>
                      <div className="bg-red-50 p-4 sm:p-6 rounded-lg">
                        <h4 className="font-semibold text-red-800 mb-2 text-sm sm:text-base">Ventes Annulées</h4>
                        <p className="text-2xl sm:text-3xl font-bold text-red-600">
                          {selectedReport.nombreVentesAnnulees || 0}
                        </p>
                        <p className="text-xs sm:text-sm text-red-500 mt-1">
                          {(selectedReport.totalVentesAnnulees || 0).toLocaleString()} F CFA
                        </p>
                      </div>
                      <div className="bg-yellow-50 p-4 sm:p-6 rounded-lg">
                        <h4 className="font-semibold text-yellow-800 mb-2 text-sm sm:text-base">Ventes Remboursées</h4>
                        <p className="text-2xl sm:text-3xl font-bold text-yellow-600">
                          {selectedReport.nombreVentesRemboursees || 0}
                        </p>
                        <p className="text-xs sm:text-sm text-yellow-600 mt-1">
                          {(selectedReport.totalVentesRemboursees || 0).toLocaleString()} F CFA
                        </p>
                      </div>
                      <div className="bg-orange-50 p-4 sm:p-6 rounded-lg">
                        <h4 className="font-semibold text-orange-800 mb-2 text-sm sm:text-base">Moyenne par vente</h4>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-600">
                          {selectedReport.nombreVentes > 0
                            ? Math.round(selectedReport.totalVentes / selectedReport.nombreVentes).toLocaleString()
                            : 0}{" "}
                          F CFA
                        </p>
                      </div>
                    </div>

                    <div className="mb-8 p-4 sm:p-6 bg-gray-50 rounded-lg">
                      <h4 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Résumé Complet</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-white rounded border">
                          <p className="text-xl sm:text-2xl font-bold text-gray-800">
                            {selectedReport.nombreVentes +
                              (selectedReport.nombreVentesAnnulees || 0) +
                              (selectedReport.nombreVentesRemboursees || 0)}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">Total des transactions</p>
                        </div>
                        <div className="p-4 bg-white rounded border">
                          <p className="text-xl sm:text-2xl font-bold text-gray-800">
                            {(
                              selectedReport.totalVentes -
                              (selectedReport.totalVentesAnnulees || 0) -
                              (selectedReport.totalVentesRemboursees || 0)
                            ).toLocaleString()}{" "}
                            F CFA
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">Chiffre d'affaires net</p>
                        </div>
                        <div className="p-4 bg-white rounded border">
                          <p className="text-xl sm:text-2xl font-bold text-gray-800">
                            {selectedReport.nombreVentes > 0
                              ? (
                                  (selectedReport.nombreVentes /
                                    (selectedReport.nombreVentes +
                                      (selectedReport.nombreVentesAnnulees || 0) +
                                      (selectedReport.nombreVentesRemboursees || 0))) *
                                    100 || 0
                                ).toFixed(1)
                              : 0}
                            %
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">Taux de réussite</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stock" className="space-y-6">
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800 text-center">
                  Gestion du Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 text-lg">Gestion du stock en cours de développement</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {showDetailModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-center sm:text-left">
                  Détails de la Vente #{selectedSale.id.slice(-6)}
                </h1>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailModal(false)
                    setSelectedSale(null)
                  }}
                  className="w-full sm:w-auto"
                >
                  Fermer
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2 text-base sm:text-lg">Informations Client</h3>
                  <div className="space-y-2 text-sm sm:text-base">
                    <p>
                      <strong>Nom:</strong> {selectedSale.nomClient}
                    </p>
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
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2 text-base sm:text-lg">Informations Vente</h3>
                  <div className="space-y-2 text-sm sm:text-base">
                    <p>
                      <strong>Date de vente:</strong> {new Date(selectedSale.dateVente).toLocaleDateString("fr-FR")}
                    </p>
                    <p>
                      <strong>Produit:</strong> {selectedSale.nomProduit}
                    </p>
                    <p>
                      <strong>Quantité:</strong> {selectedSale.quantite}
                    </p>
                    <p>
                      <strong>Prix unitaire:</strong> {selectedSale.prixUnitaire.toLocaleString()} F CFA
                    </p>
                    <p>
                      <strong>Prix total:</strong>{" "}
                      <span className="text-green-600 font-semibold">
                        {selectedSale.prixTotal.toLocaleString()} F CFA
                      </span>
                    </p>
                    <p>
                      <strong>Statut:</strong>{" "}
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedSale.statut)}`}
                      >
                        {selectedSale.statut}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-center sm:text-left">
                  Modifier la Fiche de Vente #{selectedSale.id.slice(-6)}
                </h1>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedSale(null)
                  }}
                  className="w-full sm:w-auto"
                >
                  Fermer
                </Button>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="editNomClient" className="text-sm font-medium text-gray-700">
                      Nom du Client *
                    </Label>
                    <Input
                      id="editNomClient"
                      value={editFormData.nomClient}
                      onChange={(e) => setEditFormData({ ...editFormData, nomClient: e.target.value })}
                      className="w-full h-11 text-base"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editTelephoneClient" className="text-sm font-medium text-gray-700">
                      Téléphone Client *
                    </Label>
                    <Input
                      id="editTelephoneClient"
                      value={editFormData.telephoneClient}
                      onChange={(e) => setEditFormData({ ...editFormData, telephoneClient: e.target.value })}
                      className="w-full h-11 text-base"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editTelephoneClient2" className="text-sm font-medium text-gray-700">
                      Téléphone Client 2
                    </Label>
                    <Input
                      id="editTelephoneClient2"
                      value={editFormData.telephoneClient2}
                      onChange={(e) => setEditFormData({ ...editFormData, telephoneClient2: e.target.value })}
                      className="w-full h-11 text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editNomProduit" className="text-sm font-medium text-gray-700">
                      Nom du Produit *
                    </Label>
                    <Input
                      id="editNomProduit"
                      value={editFormData.nomProduit}
                      onChange={(e) => setEditFormData({ ...editFormData, nomProduit: e.target.value })}
                      className="w-full h-11 text-base"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editQuantite" className="text-sm font-medium text-gray-700">
                      Quantité *
                    </Label>
                    <Input
                      id="editQuantite"
                      type="number"
                      min="1"
                      value={editFormData.quantite}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, quantite: Number.parseInt(e.target.value) || 1 })
                      }
                      className="w-full h-11 text-base"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editPrixUnitaire" className="text-sm font-medium text-gray-700">
                      Prix Unitaire (F CFA) *
                    </Label>
                    <Input
                      id="editPrixUnitaire"
                      type="number"
                      min="0"
                      value={editFormData.prixUnitaire}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, prixUnitaire: Number.parseFloat(e.target.value) || 0 })
                      }
                      className="w-full h-11 text-base"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editAdresseLivraison" className="text-sm font-medium text-gray-700">
                    Adresse de Livraison *
                  </Label>
                  <Textarea
                    id="editAdresseLivraison"
                    value={editFormData.adresseLivraison}
                    onChange={(e) => setEditFormData({ ...editFormData, adresseLivraison: e.target.value })}
                    className="w-full min-h-[80px] text-base resize-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editStatut" className="text-sm font-medium text-gray-700">
                    Statut de la Vente
                  </Label>
                  <Select
                    value={editFormData.statut}
                    onValueChange={(value) => setEditFormData({ ...editFormData, statut: value })}
                  >
                    <SelectTrigger className="w-full h-11 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="En cours">En cours</SelectItem>
                      <SelectItem value="Livrée">Livrée</SelectItem>
                      <SelectItem value="Annulée">Annulée</SelectItem>
                      <SelectItem value="Remboursée">Remboursée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Nouveau total:</span>
                    <span className="text-xl sm:text-2xl font-bold text-indigo-600">
                      {(editFormData.quantite * editFormData.prixUnitaire).toLocaleString()} F CFA
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={handleEditSale}
                    className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                    disabled={
                      !editFormData.nomClient ||
                      !editFormData.telephoneClient ||
                      !editFormData.nomProduit ||
                      !editFormData.adresseLivraison
                    }
                  >
                    <Save className="w-5 h-5 mr-2" />
                    Sauvegarder les Modifications
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false)
                      setSelectedSale(null)
                    }}
                    className="flex-1 sm:flex-none h-12 text-base"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
