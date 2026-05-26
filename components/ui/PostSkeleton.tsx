export default function PostSkeleton() {
  return (
    <div className="post-card" style={{ opacity: 0.7, pointerEvents: 'none' }}>
      <div className="post-header">
        <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'var(--surface-color)', border: '2px solid var(--border-color)' }} className="blink" />
        <div style={{ flex: 1, marginLeft: 12 }}>
          <div style={{ width: '40%', height: 16, backgroundColor: 'var(--surface-color)', marginBottom: 8 }} className="blink" />
          <div style={{ width: '20%', height: 12, backgroundColor: 'var(--surface-color)' }} className="blink" />
        </div>
        <div style={{ width: 60, height: 20, backgroundColor: 'var(--surface-color)', borderRadius: 4 }} className="blink" />
      </div>

      <div className="post-body" style={{ marginTop: 16 }}>
        <div style={{ width: '80%', height: 24, backgroundColor: 'var(--surface-color)', marginBottom: 12 }} className="blink" />
        <div style={{ width: '100%', height: 200, backgroundColor: 'var(--surface-color)', marginBottom: 12, borderRadius: 8 }} className="blink" />
        <div style={{ width: '100%', height: 14, backgroundColor: 'var(--surface-color)', marginBottom: 6 }} className="blink" />
        <div style={{ width: '90%', height: 14, backgroundColor: 'var(--surface-color)', marginBottom: 6 }} className="blink" />
        <div style={{ width: '60%', height: 14, backgroundColor: 'var(--surface-color)' }} className="blink" />
      </div>

      <div className="post-footer" style={{ marginTop: 16, borderTop: '2px solid var(--border-color)', paddingTop: 16, display: 'flex', gap: 16 }}>
        <div style={{ width: 60, height: 24, backgroundColor: 'var(--surface-color)', borderRadius: 4 }} className="blink" />
        <div style={{ width: 60, height: 24, backgroundColor: 'var(--surface-color)', borderRadius: 4 }} className="blink" />
      </div>
    </div>
  );
}
