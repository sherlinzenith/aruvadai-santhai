"use client";

import Link from "next/link";

export default function ErrorPage({ error, reset }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#fdfbf7", padding: "24px" }}>
      <div style={{ textAlign: "center", maxWidth: "480px" }}>
        <h1 style={{ fontSize: "3rem", color: "#c81e1e", margin: 0 }}>500</h1>
        <h2 style={{ fontSize: "1.4rem", color: "#1b2420", marginTop: "8px" }}>Something went wrong</h2>
        <p style={{ color: "#5c6b64", marginTop: "8px", fontSize: "0.95rem" }}>
          An unexpected error occurred. Please try again or return to home.
        </p>
        <div style={{ marginTop: "24px", display: "flex", gap: "12px", justifyContent: "center" }}>
          {reset && (
            <button
              onClick={() => reset()}
              style={{
                background: "#0f3d2e",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Try Again
            </button>
          )}
          <Link
            href="/"
            style={{
              display: "inline-block",
              background: "#e5ece8",
              color: "#0f3d2e",
              padding: "10px 20px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

