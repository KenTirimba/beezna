import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { phone, amount, reference } = await req.json()

  // Get access token
  const tokenRes = await fetch(`${process.env.MPESA_LIVE_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${process.env.MPESA_LIVE_CONSUMER_KEY}:${process.env.MPESA_LIVE_CONSUMER_SECRET}`
      ).toString("base64")}`
    }
  })

  const tokenData = await tokenRes.json()
  const accessToken = tokenData.access_token

  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14)

  const password = Buffer.from(
    `${process.env.MPESA_LIVE_SHORTCODE}${process.env.MPESA_LIVE_PASSKEY}${timestamp}`
  ).toString("base64")

  const stkRes = await fetch(
    `${process.env.MPESA_LIVE_BASE_URL}/mpesa/stkpush/v1/processrequest`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        BusinessShortCode: process.env.MPESA_LIVE_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: process.env.MPESA_LIVE_SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: process.env.MPESA_LIVE_CALLBACK_URL,
        AccountReference: reference,
        TransactionDesc: "Beezna Business Plan"
      })
    }
  )

  const stkData = await stkRes.json()
  return NextResponse.json(stkData)
}