// lib/cloudinary.ts
// Server-side helper — gọi thẳng Cloudinary API, không qua fetch nội bộ
import crypto from "crypto"

/** Trích public_id từ Cloudinary URL.
 *  VD: https://res.cloudinary.com/cloud/image/upload/v123/folder/abc.jpg → folder/abc
 */
export function extractPublicId(url: string): string | null {
  try {
    const uploadIndex = url.indexOf("/upload/")
    if (uploadIndex === -1) return null
    const afterUpload = url.slice(uploadIndex + "/upload/".length)
    const withoutVersion = afterUpload.replace(/^v\d+\//, "")
    const publicId = withoutVersion.replace(/\.[^/.]+$/, "")
    return publicId || null
  } catch {
    return null
  }
}

/**
 * Xóa một ảnh khỏi Cloudinary theo URL.
 * Bỏ qua lỗi — ảnh mồ côi có thể dọn thủ công sau.
 * Chỉ chạy phía server.
 */
export async function deleteCloudinaryImage(url: string): Promise<void> {
  if (!url || !url.includes("cloudinary.com")) return

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) return

  const publicId = extractPublicId(url)
  if (!publicId) return

  const timestamp = Math.floor(Date.now() / 1000)
  const signaturePayload = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`
  const signature = crypto.createHash("sha1").update(signaturePayload).digest("hex")

  const form = new URLSearchParams()
  form.append("public_id", publicId)
  form.append("timestamp", String(timestamp))
  form.append("api_key", apiKey)
  form.append("signature", signature)

  try {
    await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      { method: "POST", body: form }
    )
  } catch {
    // Bỏ qua lỗi — không để lỗi Cloudinary chặn việc xóa account
  }
}
