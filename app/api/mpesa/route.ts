export async function POST(req: Request) {
  const { phone, amount, planTitle, planFileKey } = await req.json()

  const consumerKey = process.env.MPESA_LIVE_CONSUMER_KEY
  const consumerSecret = process.env.MPESA_LIVE_CONSUMER_SECRET
  const shortcode = process.env.MPESA_LIVE_SHORTCODE!
  const passkey = process.env.MPESA_LIVE_PASSKEY!
  const callbackUrl = process.env.MPESA_LIVE_CALLBACK_URL
  const baseUrl = process.env.MPESA_LIVE_BASE_URL

  // 1️⃣ Generate OAuth token
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")
  const tokenRes = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  })
  const { access_token } = await tokenRes.json()

  // 2️⃣ Create timestamp & password
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)
  const password = Buffer.from(shortcode + passkey + timestamp).toString("base64")

  // 3️⃣ STK Push request
  const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: callbackUrl,
      AccountReference: planTitle,
      TransactionDesc: `Purchase ${planTitle}`,
    }),
  })

  const data = await stkRes.json()
  return new Response(JSON.stringify(data), { status: 200 })
}