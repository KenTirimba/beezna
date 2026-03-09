import { NextResponse } from "next/server"

export async function GET() {
  const auth = Buffer.from(
    `${process.env.MPESA_LIVE_CONSUMER_KEY}:${process.env.MPESA_LIVE_CONSUMER_SECRET}`
  ).toString("base64")

  const res = await fetch(
    `${process.env.MPESA_LIVE_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: {
        Authorization: `Basic ${auth}`
      }
    }
  )

  const data = await res.json()
  return NextResponse.json(data)
}