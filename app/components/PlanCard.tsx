"use client"

import { useEffect, useState } from "react"

type Plan = {
  id: string
  title: string
  price: number
  fileKey: string
  category?: string
}

const PURCHASE_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

export default function PlanCard({
  plan,
  layout = "grid",
}: {
  plan: Plan
  layout?: "grid" | "list"
}) {
  const [loading, setLoading] = useState(false)
  const [paid, setPaid] = useState(false)

  // Load Paystack script
  useEffect(() => {
    if ((window as any).PaystackPop) return

    const script = document.createElement("script")
    script.src = "https://js.paystack.co/v1/inline.js"
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  // Check if user previously purchased (localStorage)
  useEffect(() => {
    const purchases = JSON.parse(
      localStorage.getItem("beezna_purchases") || "{}"
    )

    const record = purchases[plan.id]

    if (!record) return

    const now = Date.now()

    if (now - record.timestamp < PURCHASE_EXPIRY) {
      setPaid(true)
    } else {
      delete purchases[plan.id]
      localStorage.setItem(
        "beezna_purchases",
        JSON.stringify(purchases)
      )
    }
  }, [plan.id])

  const savePurchase = () => {
    const purchases = JSON.parse(
      localStorage.getItem("beezna_purchases") || "{}"
    )

    purchases[plan.id] = {
      timestamp: Date.now(),
    }

    localStorage.setItem(
      "beezna_purchases",
      JSON.stringify(purchases)
    )
  }

  const payWithPaystack = async () => {
    if (!(window as any).PaystackPop) {
      alert("Payment system not ready. Refresh and try again.")
      return
    }

    setLoading(true)

    try {
      const reference = `beezna_${plan.id}_${Date.now()}`

      const res = await fetch("/api/paystack/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: plan.price,
          reference,
        }),
      })

      const data = await res.json()

      if (!data.status) {
        throw new Error(data.message || "Payment initialization failed")
      }

      const handler = (window as any).PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: "customer@beezna.com",
        amount: plan.price * 100,
        currency: "KES",
        ref: reference,
        callback: function () {
          setPaid(true)
          savePurchase() // persist purchase
        },
      })

      handler.openIframe()
    } catch (err: any) {
      alert(err.message || "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  const downloadFile = async () => {
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileKey: plan.fileKey }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error("Download failed")

      window.open(data.url, "_blank")
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div
      className={`group rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-300
      bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100
      border border-gray-300 backdrop-blur-sm
      ${
        layout === "list"
          ? "flex items-center justify-between"
          : "flex flex-col justify-between"
      }`}
    >
      <div>
        {plan.category && (
          <span className="text-[10px] uppercase tracking-wide text-gray-600 font-semibold bg-white/60 px-2 py-1 rounded-full">
            {plan.category}
          </span>
        )}

        <h3 className="mt-3 text-sm font-semibold text-gray-900 leading-snug">
          {plan.title}
        </h3>

        <p className="mt-2 text-lg font-bold text-gray-800">
          KES {plan.price}
        </p>
      </div>

      <div className={layout === "list" ? "" : "mt-5"}>
        {!paid ? (
          <button
            onClick={payWithPaystack}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 rounded-xl transition disabled:opacity-60"
          >
            {loading ? "Processing..." : "Purchase"}
          </button>
        ) : (
          <button
            onClick={downloadFile}
            className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2.5 rounded-xl transition"
          >
            Download
          </button>
        )}
      </div>
    </div>
  )
}