import { NextRequest, NextResponse } from "next/server"
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3"

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json()

    if (!key) {
      return NextResponse.json(
        { error: "Missing file key" },
        { status: 400 }
      )
    }

    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    })

    await s3.send(command)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("R2 Delete Error:", error)

    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    )
  }
}