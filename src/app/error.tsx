"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-bold">Wokora Foods</h1>
      <p className="mt-3 text-sm text-brand-cream/60">Something went wrong. Please try again in a moment.</p>
      <button type="button" onClick={() => reset()} className="btn-glow mt-8 px-6 py-3">
        Try again
      </button>
    </div>
  );
}
