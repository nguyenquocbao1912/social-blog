"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { ImagePlus, RefreshCw, Trash2, X } from "lucide-react"

type Props = {
  /** Display URL — can be a Cloudinary URL (existing post) or a local objectURL (just picked) */
  value: string
  label?: string
  /** Called with "" when user removes the image */
  onChange: (url: string) => void
  /** Called with the raw File when user picks a new one, or null when removed */
  onFileSelect: (file: File | null) => void
  disabled?: boolean
}

const MAX_SIZE_MB = 3
const ACCEPT = "image/*"

export default function ImageUpload({ value, label = "Cover Image", onChange, onFileSelect, disabled }: Props) {
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // Clean up any object URLs we created to avoid memory leaks
  const prevObjectUrl = useRef<string>("")
  useEffect(() => {
    return () => {
      if (prevObjectUrl.current.startsWith("blob:")) {
        URL.revokeObjectURL(prevObjectUrl.current)
      }
    }
  }, [])

  const processFile = useCallback((file: File) => {
    setError("")
    if (!file.type.startsWith("image/")) {
      setError("Only image files are accepted (PNG, JPG, WEBP)")
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_SIZE_MB} MB`)
      return
    }

    // Revoke previous object URL if we created one
    if (prevObjectUrl.current.startsWith("blob:")) {
      URL.revokeObjectURL(prevObjectUrl.current)
    }
    const localUrl = URL.createObjectURL(file)
    prevObjectUrl.current = localUrl

    onFileSelect(file)
    onChange(localUrl)   // show preview immediately
  }, [onChange, onFileSelect])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    // Reset input so the same file can be re-selected after removal
    e.target.value = ""
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }, [processFile])

  const handleRemove = () => {
    if (prevObjectUrl.current.startsWith("blob:")) {
      URL.revokeObjectURL(prevObjectUrl.current)
      prevObjectUrl.current = ""
    }
    onFileSelect(null)
    onChange("")
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className="img-upload-wrap">
      <label className="form-label">
        <ImagePlus size={16} aria-hidden="true" /> {label}
        <span style={{ color: "var(--dim)", fontWeight: "normal", marginLeft: 6 }}>(optional)</span>
      </label>

      {!value ? (
        /* ── Drop zone ── */
        <div
          className={`img-upload-zone${dragOver ? " drag-over" : ""}${disabled ? " uploading" : ""}`}
          onClick={() => !disabled && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={e => e.key === "Enter" && !disabled && inputRef.current?.click()}
          aria-label={`Select ${label.toLowerCase()}`}
        >
          <div className="img-upload-msg">
            <ImagePlus size={22} className="img-upload-icon" aria-hidden="true" />
            <span>CLICK OR DRAG &amp; DROP</span>
            <span className="img-upload-hint">PNG · JPG · WEBP — max {MAX_SIZE_MB} MB</span>
          </div>
        </div>
      ) : (
        /* ── Preview ── */
        <div className="img-upload-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={`${label} preview`} className="img-upload-img" />

          <div className="img-upload-overlay">
            <button
              type="button"
              className="btn btn-outline btn-icon-text"
              onClick={() => !disabled && inputRef.current?.click()}
              disabled={disabled}
              style={{ fontSize: 8, padding: "4px 10px" }}
            >
              <RefreshCw size={12} aria-hidden="true" /> CHANGE
            </button>
            <button
              type="button"
              className="btn btn-red btn-icon-text"
              onClick={handleRemove}
              disabled={disabled}
              style={{ fontSize: 8, padding: "4px 10px" }}
            >
              <Trash2 size={12} aria-hidden="true" /> REMOVE
            </button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleFileChange}
        style={{ display: "none" }}
        disabled={disabled}
      />

      {error && (
        <div className="img-upload-error">
          <X size={11} aria-hidden="true" />
          {error}
          <button className="img-upload-err-close" onClick={() => setError("")} aria-label="Dismiss">
            <X size={10} />
          </button>
        </div>
      )}
    </div>
  )
}
