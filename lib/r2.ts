import { S3Client } from "@aws-sdk/client-s3"

export const r2 = new S3Client({
  region: "auto",
  endpoint: "https://c359c5fd784423d50f3d0c0522cdd1f8.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})