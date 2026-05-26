import { Gamepad2 } from "lucide-react"

/** Next.js tự động hiển thị file này khi dashboard đang tải */
export default function DashboardLoading() {
  return (
    <div style={{ textAlign: "center", marginTop: 100 }}>
      <Gamepad2
        size={34}
        aria-hidden="true"
        style={{
          color: "var(--pink)",
          animation: "spin 1.5s linear infinite",
        }}
      />
      <div
        style={{
          fontFamily: "var(--pixel-font)",
          fontSize: 10,
          color: "var(--pink)",
          marginTop: 12,
        }}
      >
        LOADING<span className="blink">_</span>
      </div>
    </div>
  )
}
