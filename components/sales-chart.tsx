"use client"

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Sale } from "@/app/page"

interface SalesChartProps {
  sales: Sale[]
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00", "#ff00ff", "#00ffff", "#ff0000"]

export function SalesChart({ sales }: SalesChartProps) {
  const paymentMethodData = sales.reduce(
    (acc, sale) => {
      if (sale.status === "active" || !sale.status) {
        acc[sale.modePaiement] = (acc[sale.modePaiement] || 0) + 1
        if (sale.modePaiement2) {
          acc[sale.modePaiement2] = (acc[sale.modePaiement2] || 0) + 1
        }
      }
      return acc
    },
    {} as Record<string, number>,
  )

  const paymentChartData = Object.entries(paymentMethodData).map(([method, count]) => ({
    name: method,
    value: count,
    percentage: ((count / Object.values(paymentMethodData).reduce((a, b) => a + b, 0)) * 100).toFixed(1),
  }))

  const productData = sales.reduce(
    (acc, sale) => {
      if (sale.status === "active" || !sale.status) {
        sale.produits.forEach((product) => {
          acc[product.nom] = (acc[product.nom] || 0) + product.quantite
        })
      }
      return acc
    },
    {} as Record<string, number>,
  )

  const productChartData = Object.entries(productData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([product, quantity]) => ({
      name: product,
      value: quantity,
      percentage: ((quantity / Object.values(productData).reduce((a, b) => a + b, 0)) * 100).toFixed(1),
    }))

  const monthlySales = sales.reduce(
    (acc, sale) => {
      if (sale.status === "active" || !sale.status) {
        const month = new Date(sale.dateVente).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })
        const total = sale.produits.reduce((sum, p) => sum + p.quantite * p.prixUnitaire, 0)
        acc[month] = (acc[month] || 0) + total
      }
      return acc
    },
    {} as Record<string, number>,
  )

  const monthlyChartData = Object.entries(monthlySales).map(([month, total]) => ({
    month,
    total,
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{`${label}`}</p>
          <p className="text-blue-600">{`Quantité: ${payload[0].value}`}</p>
          <p className="text-green-600">{`Pourcentage: ${payload[0].payload.percentage}%`}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Répartition des Modes de Paiement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1000}
                >
                  {paymentChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{
                    paddingTop: "20px",
                    fontSize: "14px",
                    fontWeight: "bold",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Top 8 Produits les Plus Vendus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${percentage}%`}
                  outerRadius={80}
                  fill="#82ca9d"
                  dataKey="value"
                  animationBegin={200}
                  animationDuration={1200}
                >
                  {productChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{
                    paddingTop: "20px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 bg-gradient-to-br from-purple-50 to-pink-100 border-2 border-purple-200 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Évolution des Ventes Mensuelles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fontWeight: "bold" }} stroke="#6366f1" />
                <YAxis tick={{ fontSize: 12, fontWeight: "bold" }} stroke="#6366f1" />
                <Tooltip
                  formatter={(value: number) => [`${value.toLocaleString()} F CFA`, "Chiffre d'affaires"]}
                  labelStyle={{ fontWeight: "bold", color: "#374151" }}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "2px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Bar
                  dataKey="total"
                  fill="url(#colorGradient)"
                  radius={[4, 4, 0, 0]}
                  animationBegin={400}
                  animationDuration={1000}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
