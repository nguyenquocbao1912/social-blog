/* ── Shared Helper Functions & Constants ─────────────────────── */

export function timeAgo(str: string): string {
  const diff = (Date.now() - new Date(str).getTime()) / 1000
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export const STATUS_COLORS: Record<string, string> = {
  published: "#E07A5F",
  draft: "#7D7495",
}

export async function uploadImageToCloudinary(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)

  const cloudRes = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  )
  const cloudData = await cloudRes.json()

  if (!cloudRes.ok) {
    throw new Error(cloudData.error?.message || "Upload failed")
  }

  return cloudData.secure_url
}

/** SWR fetcher function */
export const fetcher = (url: string) => fetch(url).then(r => r.json())
