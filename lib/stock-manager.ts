export interface StockItem {
  id: string
  nom: string
  stockDisponible: number
  stockDeBase: number
  seuilAlerte: number
  unite: "KG" | "G" | "DOUZAINE" | "DEMI-DOUZAINE" | "UNITE"
  prixUnitaire: number
  createdAt: string
  updatedAt: string
}

export interface StockTransaction {
  id: string
  stockItemId: string
  type: "entree" | "sortie" | "ajustement"
  quantite: number
  motif: string
  saleId?: string
  createdAt: string
}

class StockManager {
  private static instance: StockManager
  private stockItems: StockItem[] = []
  private transactions: StockTransaction[] = []

  private constructor() {
    this.loadFromStorage()
  }

  static getInstance(): StockManager {
    if (!StockManager.instance) {
      StockManager.instance = new StockManager()
    }
    return StockManager.instance
  }

  private loadFromStorage() {
    if (typeof window !== "undefined") {
      const stockData = localStorage.getItem("stock-items")
      const transactionData = localStorage.getItem("stock-transactions")

      if (stockData) {
        this.stockItems = JSON.parse(stockData)
      }

      if (transactionData) {
        this.transactions = JSON.parse(transactionData)
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== "undefined") {
      localStorage.setItem("stock-items", JSON.stringify(this.stockItems))
      localStorage.setItem("stock-transactions", JSON.stringify(this.transactions))
    }
  }

  // Gestion des articles en stock
  addStockItem(item: Omit<StockItem, "id" | "createdAt" | "updatedAt">): StockItem {
    const newItem: StockItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.stockItems.push(newItem)
    this.saveToStorage()
    return newItem
  }

  updateStockItem(id: string, updates: Partial<Omit<StockItem, "id" | "createdAt">>): StockItem | null {
    const index = this.stockItems.findIndex((item) => item.id === id)
    if (index === -1) return null

    this.stockItems[index] = {
      ...this.stockItems[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    this.saveToStorage()
    return this.stockItems[index]
  }

  deleteStockItem(id: string): boolean {
    const index = this.stockItems.findIndex((item) => item.id === id)
    if (index === -1) return false

    this.stockItems.splice(index, 1)
    this.saveToStorage()
    return true
  }

  getStockItems(): StockItem[] {
    return [...this.stockItems]
  }

  getStockItem(id: string): StockItem | null {
    return this.stockItems.find((item) => item.id === id) || null
  }

  findStockItemByName(nom: string): StockItem | null {
    return this.stockItems.find((item) => item.nom.toLowerCase().trim() === nom.toLowerCase().trim()) || null
  }

  // Vérification de disponibilité
  checkAvailability(
    nom: string,
    quantiteRequise: number,
  ): {
    available: boolean
    stockActuel: number
    stockItem: StockItem | null
  } {
    const stockItem = this.findStockItemByName(nom)

    if (!stockItem) {
      return {
        available: false,
        stockActuel: 0,
        stockItem: null,
      }
    }

    return {
      available: stockItem.stockDisponible >= quantiteRequise,
      stockActuel: stockItem.stockDisponible,
      stockItem,
    }
  }

  // Décrémenter le stock lors d'une vente
  decrementStock(nom: string, quantite: number, saleId: string): boolean {
    const stockItem = this.findStockItemByName(nom)

    if (!stockItem || stockItem.stockDisponible < quantite) {
      return false
    }

    // Mettre à jour le stock
    this.updateStockItem(stockItem.id, {
      stockDisponible: stockItem.stockDisponible - quantite,
    })

    // Enregistrer la transaction
    this.addTransaction({
      stockItemId: stockItem.id,
      type: "sortie",
      quantite,
      motif: `Vente - Fiche #${saleId}`,
      saleId,
    })

    return true
  }

  // Incrémenter le stock (annulation de vente, réapprovisionnement)
  incrementStock(nom: string, quantite: number, motif: string): boolean {
    const stockItem = this.findStockItemByName(nom)

    if (!stockItem) {
      return false
    }

    // Mettre à jour le stock
    this.updateStockItem(stockItem.id, {
      stockDisponible: stockItem.stockDisponible + quantite,
    })

    // Enregistrer la transaction
    this.addTransaction({
      stockItemId: stockItem.id,
      type: "entree",
      quantite,
      motif,
    })

    return true
  }

  // Gestion des transactions
  private addTransaction(transaction: Omit<StockTransaction, "id" | "createdAt">) {
    const newTransaction: StockTransaction = {
      ...transaction,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }

    this.transactions.push(newTransaction)
    this.saveToStorage()
  }

  getTransactions(): StockTransaction[] {
    return [...this.transactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  // Alertes de stock faible
  getLowStockAlerts(): StockItem[] {
    return this.stockItems.filter((item) => item.stockDisponible <= item.seuilAlerte)
  }

  // Statistiques
  getStockStats() {
    const totalItems = this.stockItems.length
    const lowStockItems = this.getLowStockAlerts().length
    const outOfStockItems = this.stockItems.filter((item) => item.stockDisponible === 0).length
    const totalValue = this.stockItems.reduce((sum, item) => sum + item.stockDisponible * item.prixUnitaire, 0)

    return {
      totalItems,
      lowStockItems,
      outOfStockItems,
      totalValue,
    }
  }

  resetToBaseStock(id: string): boolean {
    const stockItem = this.getStockItem(id)
    if (!stockItem) return false

    const difference = stockItem.stockDeBase - stockItem.stockDisponible

    if (difference > 0) {
      this.incrementStock(stockItem.nom, difference, "Réinitialisation au stock de base")
    } else if (difference < 0) {
      this.decrementStock(stockItem.nom, Math.abs(difference), "RESET_BASE")
    }

    return true
  }

  getStockPercentage(item: StockItem): number {
    if (item.stockDeBase === 0) return 0
    return Math.round((item.stockDisponible / item.stockDeBase) * 100)
  }
}

export default StockManager
