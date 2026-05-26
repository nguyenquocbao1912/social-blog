"use client"

import { useState } from "react"
import { FileText, Globe2, LoaderCircle, NotebookPen, PencilLine, Play, Plus, X } from "lucide-react"
import ImageUpload from "@/components/ui/ImageUpload"
import type { Post } from "@/lib/types"
import { useActionCooldown } from "@/hooks/useActionCooldown"

export default function PostEditor({
  editPost,
  onSave,
  onCancel,
  loading,
}: {
  editPost: Post | null
  onSave: (
    title: string,
    content: string,
    published: boolean,
    existingThumbnail: string,
    pendingFile: File | null,
    oldThumbnail: string
  ) => void
  onCancel: () => void
  loading: boolean
}) {
  const { withCooldown } = useActionCooldown(3000);
  const [form, setForm] = useState({
    title: editPost?.title ?? "",
    content: editPost?.content ?? "",
    published: editPost?.published ?? false,
  })
  const [previewUrl, setPreviewUrl] = useState(editPost?.thumbnail ?? "")
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  const handle = () => {
    const existingThumbnail = pendingFile ? "" : previewUrl
    onSave(
      form.title.trim(),
      form.content.trim(),
      form.published,
      existingThumbnail,
      pendingFile,
      editPost?.thumbnail ?? ""
    )
  }

  return (
    <div>
      <div className="page-title">
        {editPost ? <PencilLine size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
        {editPost ? "EDIT POST" : "NEW POST"} <span className="blink">_</span>
      </div>
      <div className="pixel-card">
        <div className="form-group">
          <span className="form-label"><FileText size={16} aria-hidden="true" /> Post title</span>
          <input
            id="post-title"
            className="pixel-input"
            placeholder="An interesting title…"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            maxLength={80}
          />
          <div style={{ fontSize: 10, color: "var(--dim)", marginTop: 8, textAlign: "right" }}>
            {form.title.length}/80
          </div>
        </div>

        <div className="form-group">
          <span className="form-label"><NotebookPen size={16} aria-hidden="true" /> Content</span>
          <textarea
            id="post-content"
            className="pixel-input"
            placeholder="Share something awesome with the community…"
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            rows={6}
            maxLength={500}
          />
          <div style={{ fontSize: 10, color: "var(--dim)", marginTop: 8, textAlign: "right" }}>
            {form.content.length}/500
          </div>
        </div>

        <div className="form-group">
          <ImageUpload
            value={previewUrl}
            onChange={(url) => {
              setPreviewUrl(url)
              if (!url) setPendingFile(null)
            }}
            onFileSelect={(file) => {
              setPendingFile(file)
            }}
            disabled={loading}
          />
        </div>

        <div className="form-group" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            id="post-published"
            type="checkbox"
            checked={form.published}
            onChange={e => setForm(f => ({ ...f, published: e.target.checked }))}
            style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--pink)" }}
          />
          <label htmlFor="post-published" className="form-label" style={{ margin: 0, cursor: "pointer" }}>
            <Globe2 size={16} aria-hidden="true" /> Publish publicly
          </label>
        </div>

        <div className="btn-group">
          <button id="post-save" className="btn btn-pink btn-icon-text" onClick={withCooldown(handle)} disabled={loading} style={{ flex: 1 }}>
            {loading ? <LoaderCircle size={16} className="spin" aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
            {loading ? "SAVING..." : editPost ? "SAVE CHANGES" : "PUBLISH"}
          </button>
          <button className="btn btn-lav btn-icon-text" onClick={withCooldown(onCancel)}>
            <X size={16} aria-hidden="true" />
            CANCEL
          </button>
        </div>
      </div>
    </div>
  )
}
