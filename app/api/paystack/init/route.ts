import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { amount, reference } = body

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount * 100,
        currency: "KES",
        reference,
        email: "customer@beezna.com", // ✅ REQUIRED
      }),
    })

    const data = await res.json()

    console.log("Paystack raw response:", data)

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Server error:", error)
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    )
  }
}