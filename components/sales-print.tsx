"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Printer } from "lucide-react"
import type { Sale } from "@/app/page"

interface SalesPrintProps {
  sale: Sale
  onClose: () => void
}

export function SalesPrint({ sale, onClose }: SalesPrintProps) {
  const qrFinalCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const generateQRCode = async () => {
      if (!qrFinalCanvasRef.current) return

      try {
        const QRCode = (await import("qrcode")).default

        const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
        const qrUrl = `${baseUrl}/vente/${sale.id}`

        await QRCode.toCanvas(qrFinalCanvasRef.current, qrUrl, {
          width: 64,
          margin: 1,
          color: {
            dark: "#1f2937",
            light: "#ffffff",
          },
          errorCorrectionLevel: "M",
        })
      } catch (error) {
        console.error("Erreur lors de la génération du QR code:", error)
      }
    }

    generateQRCode()

    const style = document.createElement("style")
    style.textContent = `
      @media print {
        body * {
          visibility: hidden;
        }
        .print-area, .print-area * {
          visibility: visible;
        }
        .print-area {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .no-print {
          display: none !important;
        }
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [sale])

  const handlePrint = () => {
    window.print()
  }

  const totalVente = sale.produits.reduce((sum, p) => sum + p.quantite * p.prixUnitaire, 0)
  const quantiteTotale = sale.produits.reduce((sum, p) => sum + p.quantite, 0)

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="no-print flex justify-between items-center mb-6">
          <Button onClick={onClose} variant="outline" className="flex items-center gap-2 bg-transparent">
            <X className="w-4 h-4" />
            Retour
          </Button>
          <Button onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Imprimer
          </Button>
        </div>

        <div className="print-area bg-white p-8 rounded-lg shadow-lg">
          <div className="flex justify-between items-start mb-8 border-b-2 border-gray-300 pb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">FICHE DE VENTE</h1>
              <p className="text-gray-600 mb-3">
                N° {sale.id} - {new Date(sale.createdAt).toLocaleDateString("fr-FR")}
              </p>
              <div className="mt-2">
                <canvas
                  ref={qrFinalCanvasRef}
                  className="w-16 h-16 border border-gray-200 rounded"
                  style={{ width: "64px", height: "64px" }}
                />
              </div>
            </div>
            <div className="text-center">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGO%20DESIGNER.jpg-Bbt0O4WQXVS9oWTngAw2NzG3Tif6Ky.jpeg"
                alt="Designer Women's Logo"
                className="w-24 h-24 object-contain rounded-full border-2 border-gray-200"
              />
              <p className="text-xs text-gray-500 mt-2">Designer Women's</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Date de Vente</h3>
                <p className="text-xl font-bold text-gray-800">
                  {new Date(sale.dateVente).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Téléphone Client</h3>
                <p className="text-xl font-bold text-gray-800">{sale.telephoneClient}</p>
              </div>

              {sale.telephoneClient2 && (
                <div className="border-l-4 border-teal-500 pl-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Téléphone Client 2</h3>
                  <p className="text-xl font-bold text-gray-800">{sale.telephoneClient2}</p>
                </div>
              )}

              <div className="border-l-4 border-indigo-500 pl-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Adresse de Livraison</h3>
                <p className="text-xl font-bold text-gray-800">{sale.adresseLivraison}</p>
              </div>

              <div className="border-l-4 border-yellow-500 pl-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Prix Total</h3>
                <p className="text-2xl font-bold text-yellow-600">{totalVente.toLocaleString()} F CFA</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="border-l-4 border-orange-500 pl-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Quantité Totale</h3>
                <p className="text-xl font-bold text-gray-800">{quantiteTotale}</p>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Modes de Paiement</h3>
                <div className="flex gap-4">
                  <Badge
                    className={`text-lg font-bold px-3 py-1 ${
                      sale.modePaiement === "ORANGE"
                        ? "bg-orange-100 text-orange-800 border-orange-300"
                        : sale.modePaiement === "WAVE"
                          ? "bg-blue-100 text-blue-800 border-blue-300"
                          : "bg-green-100 text-green-800 border-green-300"
                    }`}
                  >
                    {sale.modePaiement === "ORANGE" ? (
                      <img src="/orange-money-logo.png" alt="ORANGE MONEY" className="w-10 h-10" />
                    ) : sale.modePaiement === "WAVE" ? (
                      <img src="/wave-logo.png" alt="Wave" className="w-10 h-10" />
                    ) : sale.modePaiement === "LIQUIDE" ? (
                      <img src="/espece-logo.png" alt="Espèces" className="w-10 h-10" />
                    ) : (
                      sale.modePaiement
                    )}
                  </Badge>

                  {sale.modePaiement2 && (
                    <Badge
                      className={`text-lg font-bold px-3 py-1 ${
                        sale.modePaiement2 === "ORANGE"
                          ? "bg-orange-100 text-orange-800 border-orange-300"
                          : sale.modePaiement2 === "WAVE"
                            ? "bg-blue-100 text-blue-800 border-blue-300"
                            : "bg-green-100 text-green-800 border-green-300"
                      }`}
                    >
                      {sale.modePaiement2 === "ORANGE" ? (
                        <img src="/orange-money-logo.png" alt="ORANGE MONEY" className="w-10 h-10" />
                      ) : sale.modePaiement2 === "WAVE" ? (
                        <img src="/wave-logo.png" alt="Wave" className="w-10 h-10" />
                      ) : sale.modePaiement2 === "LIQUIDE" ? (
                        <img src="/espece-logo.png" alt="Espèces" className="w-10 h-10" />
                      ) : (
                        sale.modePaiement2
                      )}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Détail des Produits</h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-purple-100">
                    <tr>
                      <th className="text-left p-3 font-semibold text-gray-700">Produit</th>
                      <th className="text-center p-3 font-semibold text-gray-700">Quantité</th>
                      <th className="text-right p-3 font-semibold text-gray-700">Prix unitaire</th>
                      <th className="text-right p-3 font-semibold text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.produits.map((produit, index) => (
                      <tr key={index} className="border-t border-gray-200">
                        <td className="p-3 font-medium">{produit.nom}</td>
                        <td className="p-3 text-center">{produit.quantite}</td>
                        <td className="p-3 text-right">{produit.prixUnitaire.toLocaleString()} F CFA</td>
                        <td className="p-3 text-right font-semibold">
                          {(produit.quantite * produit.prixUnitaire).toLocaleString()} F CFA
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">RÉCAPITULATIF FINANCIER</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold">Nombre d'articles:</span>
                <span>{sale.produits.length}</span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold">Quantité totale:</span>
                <span>{quantiteTotale}</span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold">Modes de paiement:</span>
                <div className="flex gap-2">
                  <Badge
                    className={`${
                      sale.modePaiement === "ORANGE"
                        ? "bg-orange-100 text-orange-800"
                        : sale.modePaiement === "WAVE"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                    }`}
                  >
                    {sale.modePaiement === "ORANGE" ? (
                      <img src="/orange-money-logo.png" alt="ORANGE MONEY" className="w-8 h-8" />
                    ) : sale.modePaiement === "WAVE" ? (
                      <img src="/wave-logo.png" alt="Wave" className="w-8 h-8" />
                    ) : sale.modePaiement === "LIQUIDE" ? (
                      <img src="/espece-logo.png" alt="Espèces" className="w-8 h-8" />
                    ) : (
                      sale.modePaiement
                    )}
                  </Badge>
                  {sale.modePaiement2 && (
                    <Badge
                      className={`${
                        sale.modePaiement2 === "ORANGE"
                          ? "bg-orange-100 text-orange-800"
                          : sale.modePaiement2 === "WAVE"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {sale.modePaiement2 === "ORANGE" ? (
                        <img src="/orange-money-logo.png" alt="ORANGE MONEY" className="w-8 h-8" />
                      ) : sale.modePaiement2 === "WAVE" ? (
                        <img src="/wave-logo.png" alt="Wave" className="w-8 h-8" />
                      ) : sale.modePaiement2 === "LIQUIDE" ? (
                        <img src="/espece-logo.png" alt="Espèces" className="w-8 h-8" />
                      ) : (
                        sale.modePaiement2
                      )}
                    </Badge>
                  )}
                </div>
              </div>
              <hr className="my-3 border-yellow-300" />
              <div className="flex justify-between items-center text-xl font-bold text-yellow-700">
                <span>TOTAL À PAYER:</span>
                <span>{totalVente.toLocaleString()} F CFA</span>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Livreur</h3>
              <p className="text-xl font-bold text-gray-800">{sale.livreur}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t-2 border-gray-200">
            <div className="text-center">
              <div className="border-b border-gray-400 mb-2 h-16"></div>
              <p className="text-sm font-semibold text-gray-600">Signature du Client</p>
            </div>
            <div className="text-center">
              <div className="border-b border-gray-400 mb-2 h-16"></div>
              <p className="text-sm font-semibold text-gray-600">Signature du Livreur</p>
            </div>
          </div>

          <div className="text-center mt-8 text-xs text-gray-500">
            <p>Document généré automatiquement le {new Date().toLocaleDateString("fr-FR")}</p>
          </div>

          <div className="text-center mt-4 text-xs text-gray-400 space-y-1">
            <p>NINEA 007671177</p>
            <p>REGISTRE DE COMMERCE RC:SN:DKR2019 A26145</p>
          </div>
        </div>
      </div>
    </div>
  )
}
