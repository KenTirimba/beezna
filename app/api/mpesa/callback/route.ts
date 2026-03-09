import { NextResponse } from "next/server"
import { db } from "../../../../lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

export async function POST(req: Request) {
  const body = await req.json()

  try {
    const stk = body.Body.stkCallback

    if (stk.ResultCode === 0) {
      const metadata = stk.CallbackMetadata.Item
      const amount = metadata.find((i: any) => i.Name === "Amount")?.Value
      const receipt = metadata.find((i: any) => i.Name === "MpesaReceiptNumber")?.Value
      const phone = metadata.find((i: any) => i.Name === "PhoneNumber")?.Value

      await addDoc(collection(db, "payments"), {
        method: "mpesa",
        amount,
        receipt,
        phone,
        createdAt: serverTimestamp()
      })
    }
  } catch (err) {
    console.error("M-Pesa callback error", err)
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" })
}