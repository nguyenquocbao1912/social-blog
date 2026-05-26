"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, LoaderCircle, Lock, Mail, Play, Sparkles, User } from "lucide-react"
import Notification from "@/components/ui/Notification"
import { RegisterSchema } from "@/lib/validations"

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirm: "", avatar: ""
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [notif, setNotif] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    // ... inside handleSubmit
    const validation = RegisterSchema.safeParse({
      name: form.name,
      email: form.email,
      password: form.password,
    });

    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    if (form.password !== form.confirm) {
      setError("Password confirm does not match!");
      return;
    }

    setLoading(true)

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? "Registration failed. Please try again.")
      return
    }

    setNotif({ msg: "Account created! Welcome to PixelVerse!", type: "success" })
    setTimeout(() => router.push("/login"), 1200)
  }

  return (
    <>
      {notif && (
        <Notification msg={notif.msg} type={notif.type} onClose={() => setNotif(null)} />
      )}

      <div className="auth-wrap">
        <div className="auth-box pixel-card" style={{ maxWidth: 480 }}>

          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <Sparkles className="auth-mark" size={38} aria-hidden="true" />
            <div className="auth-title">CREATE ACCOUNT</div>
            <div className="auth-sub">JOIN THE PIXEL WORLD</div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label"><User size={16} aria-hidden="true" /> Username</label>
                <input id="reg-name" className="pixel-input" placeholder="cool_username" value={form.name} onChange={set("name")} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label"><Mail size={16} aria-hidden="true" /> Email</label>
                <input id="reg-email" className="pixel-input" type="email" placeholder="you@email.com" value={form.email} onChange={set("email")} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label"><Lock size={16} aria-hidden="true" /> Password</label>
                <input id="reg-password" className="pixel-input" type="password" placeholder="••••••••" value={form.password} onChange={set("password")} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label"><Lock size={16} aria-hidden="true" /> Confirm</label>
                <input id="reg-confirm" className="pixel-input" type="password" placeholder="••••••••" value={form.confirm} onChange={set("confirm")} />
              </div>
            </div>

            {error && (
              <div style={{
                color: "var(--red)", fontSize: 10, marginBottom: 12, lineHeight: 1.6,
                border: "2px solid var(--red)", padding: "8px 10px", background: "var(--error-bg)"
              }}>
                <AlertCircle size={16} aria-hidden="true" /> {error}
              </div>
            )}

            <button
              id="reg-submit"
              type="submit"
              className="btn btn-lav btn-icon-text"
              disabled={loading}
              style={{ width: "100%", fontSize: 10 }}
            >
              {loading ? (
                <>
                  <LoaderCircle size={16} className="spin" aria-hidden="true" />
                  CREATING...
                </>
              ) : (
                <>
                  <Play size={16} aria-hidden="true" />
                  REGISTER NOW
                </>
              )}
            </button>
          </form>

          <div className="auth-switch">
            Already have an account?{" "}
            <a className="auth-link" href="/login">LOGIN</a>
          </div>

        </div>
      </div>
    </>
  )
}
