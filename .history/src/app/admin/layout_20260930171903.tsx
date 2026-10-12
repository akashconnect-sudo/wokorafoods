import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { LogoutButton } from "@/components/layout/LogoutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "admin") redirect("/");

  return (
    <div>
      <div className="hidden border-b border-white/10 bg-ink/80 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 text-sm">
          <div className="flex flex-wrap items-center gap-4 lg:flex-nowrap lg:gap-6">
            <Link href="/admin" className="text-brand-gold">Orders</Link>
            <Link href="/admin/menu">Menu</Link>
            <Link href="/admin/settings">Settings</Link>
            <Link href="/admin/kiosk">Print kiosk</Link>
            <Link href="/admin/tables">Table QR</Link>
          </div>
          <LogoutButton className="shrink-0 rounded-full border border-brand-red/40 px-3 py-1 text-brand-red hover:bg-brand-red/10" />
        </div>
      </div>
      {children}
    </div>
  );
}
