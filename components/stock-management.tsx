"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Package, Plus, Edit, Trash2, TrendingUp, TrendingDown, AlertCircle, Target } from "lucide-react"
import StockManager, { type StockItem, type StockTransaction } from "@/lib/stock-manager"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

export function StockManagement() {
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [transactions, setTransactions] = useState<StockTransaction[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAdjustDialog, setShowAdjustDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const [newItem, setNewItem] = useState({
    nom: "",
    stockDisponible: 0,
    stockDeBase: 0,
    seuilAlerte: 5,
    unite: "UNITE" as "KG" | "G" | "DOUZAINE" | "DEMI-DOUZAINE" | "UNITE",
    prixUnitaire: 0,
  })

  const [adjustment, setAdjustment] = useState({
    type: "entree" as "entree" | "sortie",
    quantite: 0,
    motif: "",
  })

  const stockManager = StockManager.getInstance()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setStockItems(stockManager.getStockItems())
    setTransactions(stockManager.getTransactions())
  }

  const handleAddItem = () => {
    if (!newItem.nom.trim()) {
      alert("Veuillez saisir le nom du produit")
      return
    }

    if (newItem.stockDeBase < 0) {
      alert("Le stock de base ne peut pas être négatif")
      return
    }

    stockManager.addStockItem(newItem)
    loadData()
    setShowAddDialog(false)
    setNewItem({
      nom: "",
      stockDisponible: 0,
      stockDeBase: 0,
      seuilAlerte: 5,
      unite: "UNITE",
      prixUnitaire: 0,
    })
  }

  const handleEditItem = () => {
    if (!selectedItem) return

    stockManager.updateStockItem(selectedItem.id, {
      nom: selectedItem.nom,
      stockDeBase: selectedItem.stockDeBase,
      seuilAlerte: selectedItem.seuilAlerte,
      unite: selectedItem.unite,
      prixUnitaire: selectedItem.prixUnitaire,
    })
    loadData()
    setShowEditDialog(false)
    setSelectedItem(null)
  }

  const handleDeleteItem = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet article ?")) {
      const itemToDelete = stockItems.find((item) => item.id === id)
      if (itemToDelete) {
        // Add to trash before deleting
        const trashedStockItem = {
          ...itemToDelete,
          deletedAt: new Date().toISOString(),
          type: "stock" as const,
        }

        // Add to stock trash
        const existingStockTrash = JSON.parse(localStorage.getItem("stock-trash-data") || "[]")
        localStorage.setItem("stock-trash-data", JSON.stringify([trashedStockItem, ...existingStockTrash]))

        // Trigger trash update event
        window.dispatchEvent(new CustomEvent("stockTrashUpdated"))
      }

      stockManager.deleteStockItem(id)
      loadData()
    }
  }

  const handleStockAdjustment = () => {
    if (!selectedItem || !adjustment.motif.trim() || adjustment.quantite <= 0) {
      alert("Veuillez remplir tous les champs")
      return
    }

    if (adjustment.type === "entree") {
      stockManager.incrementStock(selectedItem.nom, adjustment.quantite, adjustment.motif)
    } else {
      const availability = stockManager.checkAvailability(selectedItem.nom, adjustment.quantite)
      if (!availability.available) {
        alert(`Stock insuffisant. Stock actuel: ${availability.stockActuel}`)
        return
      }
      stockManager.decrementStock(selectedItem.nom, adjustment.quantite, "AJUSTEMENT")
    }

    loadData()
    setShowAdjustDialog(false)
    setSelectedItem(null)
    setAdjustment({ type: "entree", quantite: 0, motif: "" })
  }

  const handleResetToBase = (item: StockItem) => {
    if (confirm(`Réinitialiser le stock de "${item.nom}" au stock de base (${item.stockDeBase} ${item.unite}) ?`)) {
      stockManager.resetToBaseStock(item.id)
      loadData()
    }
  }

  const filteredItems = stockItems.filter((item) => item.nom.toLowerCase().includes(searchTerm.toLowerCase()))

  const lowStockItems = stockManager.getLowStockAlerts()
  const stats = stockManager.getStockStats()

  const getStockStatus = (item: StockItem) => {
    if (item.stockDisponible === 0) return { label: "Rupture", color: "bg-red-500" }
    if (item.stockDisponible <= item.seuilAlerte) return { label: "Stock faible", color: "bg-orange-500" }
    return { label: "En stock", color: "bg-green-500" }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Articles</p>
                <p className="text-2xl font-bold">{stats.totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Stock Faible</p>
                <p className="text-2xl font-bold text-orange-600">{stats.lowStockItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Rupture Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.outOfStockItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Valeur Stock</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalValue.toLocaleString()} F CFA</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="w-5 h-5" />
              Alertes Stock Faible ({lowStockItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <span className="font-medium">{item.nom}</span>
                  <Badge variant="destructive">
                    {item.stockDisponible} {item.unite}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="stock" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stock">Gestion Stock</TabsTrigger>
          <TabsTrigger value="transactions">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <Input
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter Article
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un Nouvel Article</DialogTitle>
                  <DialogDescription>Ajoutez un nouvel article à votre inventaire</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nom">Nom du produit *</Label>
                    <Input
                      id="nom"
                      value={newItem.nom}
                      onChange={(e) => setNewItem({ ...newItem, nom: e.target.value })}
                      placeholder="Ex: Smartphone Samsung"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stock">Stock initial</Label>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        value={newItem.stockDisponible}
                        onChange={(e) => setNewItem({ ...newItem, stockDisponible: Number(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="stockBase">Stock de base</Label>
                      <Input
                        id="stockBase"
                        type="number"
                        min="0"
                        value={newItem.stockDeBase}
                        onChange={(e) => setNewItem({ ...newItem, stockDeBase: Number(e.target.value) || 0 })}
                        placeholder="Stock de référence"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="seuil">Seuil d'alerte</Label>
                      <Input
                        id="seuil"
                        type="number"
                        min="0"
                        value={newItem.seuilAlerte}
                        onChange={(e) => setNewItem({ ...newItem, seuilAlerte: Number(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="prix">Prix unitaire (F CFA)</Label>
                      <Input
                        id="prix"
                        type="number"
                        min="0"
                        value={newItem.prixUnitaire}
                        onChange={(e) => setNewItem({ ...newItem, prixUnitaire: Number(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="unite">Unité</Label>
                    <Select
                      value={newItem.unite}
                      onValueChange={(value: any) => setNewItem({ ...newItem, unite: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNITE">UNITE</SelectItem>
                        <SelectItem value="KG">KG</SelectItem>
                        <SelectItem value="G">G</SelectItem>
                        <SelectItem value="DOUZAINE">DOUZAINE</SelectItem>
                        <SelectItem value="DEMI-DOUZAINE">DEMI-DOUZAINE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleAddItem}>Ajouter</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const status = getStockStatus(item)
              const stockPercentage = stockManager.getStockPercentage(item)
              return (
                <Card key={item.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{item.nom}</CardTitle>
                      <Badge className={`${status.color} text-white`}>{status.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Stock vs Base</span>
                        <span className="font-medium">{stockPercentage}%</span>
                      </div>
                      <Progress value={stockPercentage} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">Stock actuel</p>
                        <p className="font-semibold">
                          {item.stockDisponible} {item.unite}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Stock de base</p>
                        <p className="font-semibold text-blue-600">
                          {item.stockDeBase} {item.unite}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Seuil alerte</p>
                        <p className="font-semibold">
                          {item.seuilAlerte} {item.unite}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Prix unitaire</p>
                        <p className="font-semibold">{item.prixUnitaire.toLocaleString()} F CFA</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedItem(item)
                          setShowEditDialog(true)
                        }}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedItem(item)
                          setShowAdjustDialog(true)
                        }}
                      >
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Ajuster
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-600 hover:text-blue-700 bg-transparent"
                        onClick={() => handleResetToBase(item)}
                        title="Réinitialiser au stock de base"
                      >
                        <Target className="w-3 h-3 mr-1" />
                        Base
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteItem(item.id)}>
                        <Trash2 className="w-3 h-3 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Mouvements de Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {transactions.map((transaction) => {
                  const stockItem = stockItems.find((item) => item.id === transaction.stockItemId)
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded border"
                    >
                      <div className="flex items-center gap-3">
                        {transaction.type === "entree" ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium">{stockItem?.nom || "Article supprimé"}</p>
                          <p className="text-sm text-gray-600">{transaction.motif}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${transaction.type === "entree" ? "text-green-600" : "text-red-600"}`}
                        >
                          {transaction.type === "entree" ? "+" : "-"}
                          {transaction.quantite} {stockItem?.unite || ""}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(transaction.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'Article</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-nom">Nom du produit</Label>
                <Input
                  id="edit-nom"
                  value={selectedItem.nom}
                  onChange={(e) => setSelectedItem({ ...selectedItem, nom: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-stockBase">Stock de base</Label>
                  <Input
                    id="edit-stockBase"
                    type="number"
                    min="0"
                    value={selectedItem.stockDeBase}
                    onChange={(e) => setSelectedItem({ ...selectedItem, stockDeBase: Number(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-seuil">Seuil d'alerte</Label>
                  <Input
                    id="edit-seuil"
                    type="number"
                    min="0"
                    value={selectedItem.seuilAlerte}
                    onChange={(e) => setSelectedItem({ ...selectedItem, seuilAlerte: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-prix">Prix unitaire (F CFA)</Label>
                  <Input
                    id="edit-prix"
                    type="number"
                    min="0"
                    value={selectedItem.prixUnitaire}
                    onChange={(e) => setSelectedItem({ ...selectedItem, prixUnitaire: Number(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-unite">Unité</Label>
                  <Select
                    value={selectedItem.unite}
                    onValueChange={(value: any) => setSelectedItem({ ...selectedItem, unite: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNITE">UNITE</SelectItem>
                      <SelectItem value="KG">KG</SelectItem>
                      <SelectItem value="G">G</SelectItem>
                      <SelectItem value="DOUZAINE">DOUZAINE</SelectItem>
                      <SelectItem value="DEMI-DOUZAINE">DEMI-DOUZAINE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleEditItem}>Sauvegarder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustement de Stock</DialogTitle>
            <DialogDescription>
              {selectedItem &&
                `Article: ${selectedItem.nom} (Stock actuel: ${selectedItem.stockDisponible} ${selectedItem.unite})`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="adj-type">Type d'ajustement</Label>
              <Select
                value={adjustment.type}
                onValueChange={(value: any) => setAdjustment({ ...adjustment, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entree">Entrée (+)</SelectItem>
                  <SelectItem value="sortie">Sortie (-)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="adj-quantite">Quantité</Label>
              <Input
                id="adj-quantite"
                type="number"
                min="1"
                value={adjustment.quantite}
                onChange={(e) => setAdjustment({ ...adjustment, quantite: Number(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="adj-motif">Motif</Label>
              <Input
                id="adj-motif"
                value={adjustment.motif}
                onChange={(e) => setAdjustment({ ...adjustment, motif: e.target.value })}
                placeholder="Ex: Réapprovisionnement, Casse, Inventaire..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdjustDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleStockAdjustment}>Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
