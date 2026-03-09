"use client"

type MpesaButtonProps = {
  phone: string
  amount: number
  planTitle: string
  planFileKey: string
}

export default function MpesaButton({ phone, amount, planTitle, planFileKey }: MpesaButtonProps) {
  const handleMpesa = async () => {
    try {
      const res = await fetch("/api/mpesa", {
        method: "POST",
        body: JSON.stringify({ phone, amount, planTitle, planFileKey }),
        headers: { "Content-Type": "application/json" },
      })
      const data = await res.json()
      alert("STK Push sent. Check your phone.")
      console.log(data)
    } catch (err) {
      console.error(err)
      alert("Failed to send STK Push")
    }
  }

  return (
    <button
      onClick={handleMpesa}
      className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
    >
      Pay with M-PESA
    </button>
  )
}