"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { AlertCircle, Gamepad2, Lightbulb, LoaderCircle, Mail, Play, Lock } from "lucide-react"
import Notification from "@/components/ui/Notification"
import { LoginSchema } from "@/lib/validations"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [notif, setNotif] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const validation = LoginSchema.safeParse({ email, password });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (!result?.ok) {
      if (result?.status === 429) {
        setError("Too many requests. Try again later!");
        return;
      }

      if (result?.error) {
        const ERROR_MESSAGES: Record<string, string> = {
          INVALID_CREDENTIALS: "Incorrect email or password!",
          TOO_MANY_REQUESTS: "Too many requests. Try again later!",
        };

        // Xử lý LOCKED_ riêng vì có giá trị động
        if (result.error.startsWith("LOCKED_")) {
          const mins = result.error.split("_")[1];
          setError(`Please try again after ${mins} minutes!`);
          return;
        }

        const message = ERROR_MESSAGES[result.error] ?? "Something went wrong. Please try again!";
        setError(message);
        return;
      }

      setError("Something went wrong. Please try again!");
      return;
    }

    setNotif({ msg: "Welcome back!", type: "success" })
    setTimeout(() => {
      router.push("/dashboard")
      router.refresh()
    }, 800)
  }

  return (
    <>
      {notif && (
        <Notification msg={notif.msg} type={notif.type} onClose={() => setNotif(null)} />
      )}

      <div className="auth-wrap">
        <div className="auth-box pixel-card">

          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Gamepad2 className="auth-mark" size={42} aria-hidden="true" />
            <div className="auth-title">PIXELVERSE</div>
            <div className="auth-sub">8-BIT SOCIAL NETWORK</div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label"><Mail size={16} aria-hidden="true" /> Email</label>
              <input
                id="login-email"
                className="pixel-input"
                type="email"
                placeholder="pixel@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label"><Lock size={16} aria-hidden="true" /> Password</label>
              <input
                id="login-password"
                className="pixel-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div style={{
                color: "var(--red)",
                fontSize: 10,
                marginBottom: 12,
                border: "2px solid var(--red)",
                padding: "8px 10px",
                background: "var(--error-bg)",
                lineHeight: 1.6
              }}>
                <AlertCircle size={16} aria-hidden="true" /> {error}
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              className="btn btn-pink btn-icon-text"
              disabled={loading}
              style={{ width: "100%", fontSize: 11 }}
            >
              {loading ? (
                <>
                  <LoaderCircle size={16} className="spin" aria-hidden="true" />
                  LOGGING IN...
                </>
              ) : (
                <>
                  <Play size={16} aria-hidden="true" />
                  LOGIN
                </>
              )}
            </button>
          </form>

          {/* Demo hint */}
          <div style={{
            marginTop: 12,
            background: "var(--bg3)",
            padding: "8px 10px",
            fontSize: 8,
            color: "var(--dim)",
            border: "1px solid rgba(48,104,68,0.2)",
            display: "flex",
            alignItems: "center",
            gap: 6
          }}>
            <Lightbulb size={16} aria-hidden="true" /> Demo: use any registered account
          </div>

          {/* Switch to register */}
          <div className="auth-switch">
            No account yet?{" "}
            <a className="auth-link" href="/register">REGISTER NOW</a>
          </div>

        </div>
      </div>
    </>
  )
}
