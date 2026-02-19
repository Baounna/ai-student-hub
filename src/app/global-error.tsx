"use client";

import Link from "next/link";

export default function GlobalError() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#041430",
          color: "#ffffff"
        }}
      >
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "24px",
            textAlign: "center"
          }}
        >
          <div style={{ maxWidth: "640px" }}>
            <p style={{ fontSize: "12px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#5db0ff", fontWeight: 700 }}>
              Critical Error
            </p>
            <h1 style={{ margin: "10px 0 0", fontSize: "40px", lineHeight: 1.15 }}>We hit a critical issue</h1>
            <p style={{ marginTop: "14px", fontSize: "16px", lineHeight: 1.6, color: "#c7d7f5" }}>
              Please refresh the page. If the issue persists, return later while we resolve it.
            </p>
            <Link
              href="/en"
              style={{
                marginTop: "20px",
                display: "inline-block",
                background: "#0069ff",
                color: "#ffffff",
                textDecoration: "none",
                borderRadius: "10px",
                padding: "10px 16px",
                fontWeight: 700
              }}
            >
              Go home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
