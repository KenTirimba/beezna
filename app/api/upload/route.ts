import { NextResponse } from "next/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

export const runtime = "nodejs" // VERY IMPORTANT

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const key = `plans/${Date.now()}-${file.name}`

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    )

    return NextResponse.json({ key })
  } catch (error: any) {
    console.error("R2 Upload Error:", error)

    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    )
  }
}