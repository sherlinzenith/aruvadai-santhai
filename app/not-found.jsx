import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#fdfbf7", padding: "24px" }}>
      <div style={{ textAlign: "center", maxWidth: "480px" }}>
        <h1 style={{ fontSize: "3rem", color: "#0f3d2e", margin: 0 }}>404</h1>
        <h2 style={{ fontSize: "1.4rem", color: "#1b2420", marginTop: "8px" }}>Page Not Found</h2>
        <p style={{ color: "#5c6b64", marginTop: "8px", fontSize: "0.95rem" }}>
          The page you are looking for does not exist or may have been moved.
        </p>
        <div style={{ marginTop: "24px" }}>
          <Link
            href="/"
            style={{
              display: "inline-block",
              background: "#0f3d2e",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            ← Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

