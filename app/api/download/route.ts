import { NextResponse } from "next/server"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

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
    const { fileKey } = await req.json()

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileKey,
    })

    const signedUrl = await getSignedUrl(s3, command, {
      expiresIn: 60 * 5, // 5 minutes
    })

    return NextResponse.json({ url: signedUrl })
  } catch (error: any) {
    console.error("Download error:", error)
    return NextResponse.json(
      { error: "Failed to generate download link" },
      { status: 500 }
    )
  }
}