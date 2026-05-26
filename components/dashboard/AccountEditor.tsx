"use client"

import { useState } from "react"
import { AlertCircle, CircleUserRound, LoaderCircle, Play, Settings, Trash2, User, X } from "lucide-react"
import ImageUpload from "@/components/ui/ImageUpload"
import type { AvatarUser } from "@/lib/types"

export default function AccountEditor({
  user,
  loading,
  onSave,
  onDeleteAccount,
}: {
  user: AvatarUser & { id?: string | number }
  loading: boolean
  onSave: (
    name: string,
    existingAvatar: string,
    pendingFile: File | null,
    oldAvatar: string,
    password: string
  ) => Promise<boolean>
  onDeleteAccount: (password: string) => Promise<void>
}) {
  const [name, setName] = useState(user.name ?? "")
  const [password, setPassword] = useState("")
  const [previewUrl, setPreviewUrl] = useState(user.avatar ?? "")
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [err, setErr] = useState("")

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteErr, setDeleteErr] = useState("")

  const handle = async () => {
    setErr("")
    const saved = await onSave(
      name,
      pendingFile ? "" : previewUrl,
      pendingFile,
      user.avatar ?? "",
      password
    )
    if (saved) {
      setPassword("")
      setPendingFile(null)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteErr("")
    setDeleteLoading(true)
    try {
      await onDeleteAccount(deletePassword)
    } catch (e: unknown) {
      setDeleteErr(e instanceof Error ? e.message : "Delete account failed")
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div>
      <div className="page-title">
        <CircleUserRound size={18} aria-hidden="true" />
        ACCOUNT <span className="blink">_</span>
      </div>
      <div className="pixel-card">
        <div className="form-group">
          <label htmlFor="display-name" className="form-label">
            <User size={16} aria-hidden="true" /> Display Name
          </label>
          <input
            id="display-name"
            className="pixel-input"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={loading}
            maxLength={20}
          />
        </div>
        <div className="form-group">
          <ImageUpload
            label="Avatar Image"
            value={previewUrl}
            onChange={(url) => {
              setPreviewUrl(url)
              if (!url) setPendingFile(null)
            }}
            onFileSelect={setPendingFile}
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label className="form-label"><Settings size={16} aria-hidden="true" /> New Password</label>
          <input
            type="password"
            className="pixel-input"
            placeholder="Leave blank to keep current"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>
        {err && (
          <div style={{
            color: "var(--red)", fontSize: 8, marginBottom: 12,
            border: "2px solid var(--red)", padding: "8px 10px", background: "var(--error-bg)"
          }}>
            <AlertCircle size={16} aria-hidden="true" /> {err}
          </div>
        )}
        <div className="btn-group">
          <button className="btn btn-pink btn-icon-text" onClick={handle} disabled={loading || deleteLoading}>
            {loading ? <LoaderCircle size={16} className="spin" aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
            {loading ? "SAVING..." : "SAVE CHANGES"}
          </button>
          <button
            id="delete-account-btn"
            className="btn btn-lav btn-icon-text"
            onClick={() => { setShowDeleteConfirm(v => !v); setDeleteErr(""); setDeletePassword("") }}
            disabled={loading || deleteLoading}
            aria-expanded={showDeleteConfirm}
          >
            <Trash2 size={16} aria-hidden="true" />
            DELETE ACCOUNT
          </button>
        </div>

        {showDeleteConfirm && (
          <div
            id="delete-account-confirm"
            style={{
              marginTop: 16, padding: "8px 10px",
              border: "2px solid var(--red)", background: "var(--error-bg)",
            }}
          >
            <div style={{ fontSize: 10, color: "var(--red)", fontWeight: 700, lineHeight: 1.6, marginBottom: 8 }}>
              <AlertCircle size={16} aria-hidden="true" /> Confirm Delete Account - this action can&apos;t be undone!
            </div>
            <div style={{ fontSize: 10, color: "var(--dim)", marginBottom: 10, lineHeight: 1.6 }}>
              All posts, comments, images and data will be deleted permanently.
            </div>
            <input
              id="delete-account-password"
              type="password"
              className="pixel-input"
              placeholder="Enter your password to confirm"
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleDeleteAccount()}
              disabled={deleteLoading}
            />
            {deleteErr && (
              <div style={{ color: "var(--red)", fontSize: 10, marginTop: 10, lineHeight: 1.6 }}>
                <AlertCircle size={16} aria-hidden="true" /> {deleteErr}
              </div>
            )}
            <div className="btn-group">
              <button
                id="delete-account-confirm-btn"
                className="btn btn-pink btn-icon-text"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
              >
                {deleteLoading ? <LoaderCircle size={16} className="spin" aria-hidden="true" /> : <Trash2 size={16} aria-hidden="true" />}
                {deleteLoading ? "Deleting..." : "DELETE"}
              </button>
              <button
                className="btn btn-lav btn-icon-text"
                onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); setDeleteErr("") }}
                disabled={deleteLoading}
              >
                <X size={16} aria-hidden="true" /> CANCEL
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
