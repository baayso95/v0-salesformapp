"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import StockManager, { type StockItem } from "@/lib/stock-manager"

const PackageIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
    />
  </svg>
)

const AlertTriangleIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
    />
  </svg>
)

const CheckCircleIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

interface ProductSelectorProps {
  value: string
  onChange: (productName: string, stockInfo?: { available: number; unit: string; price: number }) => void
  placeholder?: string
  className?: string
}

export function ProductSelector({
  value,
  onChange,
  placeholder = "Sélectionner un produit...",
  className,
}: ProductSelectorProps) {
  const [open, setOpen] = useState(false)
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [filteredItems, setFilteredItems] = useState<StockItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [stockManager] = useState(() => StockManager.getInstance())
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)
  const [inputWidth, setInputWidth] = useState(200)

  useEffect(() => {
    const items = stockManager.getStockItems()
    setStockItems(items)
    setFilteredItems(items)
  }, [stockManager])

  useEffect(() => {
    const filtered = stockItems.filter((item) => item.nom.toLowerCase().includes(searchTerm.toLowerCase()))
    setFilteredItems(filtered)
  }, [searchTerm, stockItems])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
        setSearchTerm("")
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  const calculateWidth = (text: string) => {
    if (measureRef.current) {
      measureRef.current.textContent = text || placeholder
      const width = measureRef.current.offsetWidth + 80 // Add padding for icon and spacing
      return Math.max(width, 200) // Minimum width of 200px
    }
    return 200
  }

  useEffect(() => {
    const newWidth = calculateWidth(value)
    setInputWidth(newWidth)
  }, [value, placeholder])

  const getStockStatus = (item: StockItem) => {
    if (item.stockDisponible === 0) return { label: "Rupture", color: "bg-red-500", icon: AlertTriangleIcon }
    if (item.stockDisponible <= item.seuilAlerte)
      return { label: "Stock faible", color: "bg-orange-500", icon: AlertTriangleIcon }
    return { label: "En stock", color: "bg-green-500", icon: CheckCircleIcon }
  }

  const handleSelect = (productName: string) => {
    const stockItem = stockItems.find((item) => item.nom === productName)
    if (stockItem) {
      onChange(productName, {
        available: stockItem.stockDisponible,
        unit: stockItem.unite,
        price: stockItem.prixUnitaire,
      })
    } else {
      onChange(productName)
    }
    setOpen(false)
    setSearchTerm("")
  }

  const handleToggle = () => {
    setOpen(!open)
    if (!open) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }

  const truncateText = (text: string, maxLength = 25) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
  }

  const selectedItem = stockItems.find((item) => item.nom === value)

  return (
    <div className="relative space-y-2" ref={dropdownRef}>
      <span
        ref={measureRef}
        className="absolute invisible whitespace-nowrap text-sm font-medium"
        style={{ left: "-9999px" }}
      />

      <Button
        type="button"
        variant="outline"
        onClick={handleToggle}
        style={{ width: `${inputWidth}px` }}
        className={cn("justify-between bg-gray-50 hover:bg-gray-100 min-w-[200px] max-w-full", className)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <PackageIcon />
          <span className="whitespace-nowrap overflow-hidden text-ellipsis">{value || placeholder}</span>
        </div>
        <ChevronDownIcon className={cn("ml-2 h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
      </Button>

      {open && (
        <div
          className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-hidden"
          style={{ width: `${Math.max(inputWidth, 300)}px` }}
        >
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">Aucun produit.</div>
            ) : (
              filteredItems.map((item) => {
                const status = getStockStatus(item)
                const StatusIcon = status.icon
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.nom)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-left border-b border-gray-50 last:border-b-0 transition-colors duration-150"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="font-medium text-gray-900 leading-tight">{truncateText(item.nom, 35)}</p>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-blue-600">
                            {item.prixUnitaire.toLocaleString()} F
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{item.unite}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <Badge
                        className={`${status.color} text-white text-xs px-3 py-1 flex items-center gap-1 whitespace-nowrap`}
                      >
                        <StatusIcon />
                        <span>{item.stockDisponible}</span>
                      </Badge>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}

      {selectedItem && (
        <div className="flex items-center gap-3 text-sm bg-blue-50 p-3 rounded-md border border-blue-200">
          <Badge className={`${getStockStatus(selectedItem).color} text-white px-3 py-1`}>
            {getStockStatus(selectedItem).label}: {selectedItem.stockDisponible}
          </Badge>
          <span className="text-gray-700 font-medium">
            {selectedItem.prixUnitaire.toLocaleString()} F / {selectedItem.unite}
          </span>
        </div>
      )}
    </div>
  )
}
