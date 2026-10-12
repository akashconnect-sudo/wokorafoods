import Link from "next/link";

export function CtaBanner() {
  return (
    <section className="mx-auto max-w-7xl page-pad pb-12 sm:pb-20">
      <div className="dark-band overflow-hidden rounded-[1.5rem] border border-brand-red/40 bg-[linear-gradient(120deg,#1a0a0c_0%,#0d0d0d_46%,#1a1408_100%)] px-5 py-10 text-center shadow-neon sm:rounded-[2rem] sm:px-8 sm:py-14">
        <p className="font-wall text-2xl text-brand-gold sm:text-3xl">Taste Talks Here</p>
        <h2 className="mt-2 font-display text-2xl font-bold leading-tight text-white sm:text-4xl">Table ready. Menu open. Mood better.</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-white/65">
          Scan the booth, tap the plate, stay in the glow.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
          <Link href="/menu" className="btn-glow px-7 py-3 text-center">View menu</Link>
          <Link href="/about" className="rounded-full border border-white/40 px-7 py-3 text-center font-display font-semibold text-white hover:border-brand-gold">
            About the cafe
          </Link>
        </div>
      </div>
    </section>
  );
}
