"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0d0d0d] px-4 py-24 text-center text-[#f5f5f0]">
        <h1 style={{ fontSize: "2rem", fontWeight: 800 }}>Wokora Foods</h1>
        <p style={{ marginTop: 12, opacity: 0.7 }}>Something went wrong. Please try again in a moment.</p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            marginTop: 32,
            borderRadius: 999,
            background: "#ffc800",
            color: "#fff",
            padding: "12px 24px",
            border: 0,
            fontWeight: 700,
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
