import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#05060a] px-6 py-10 text-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(34,211,238,.20),transparent_30%),radial-gradient(circle_at_82%_8%,rgba(168,85,247,.18),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(15,23,42,.95),transparent_42%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-[.08] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:42px_42px]" />
            <div className="relative mb-7 text-center">
                <Link href="/" className="mx-auto mb-4 grid size-14 place-items-center rounded-3xl border border-cyan-200/25 bg-cyan-200/10 text-xl font-black text-cyan-100 shadow-[0_0_70px_rgba(34,211,238,.18)] transition hover:border-cyan-100/40 hover:bg-cyan-200/15">D</Link>
                <div className="text-sm font-black tracking-[.34em] text-white/85">DEVORA STUDIO</div>
                <div className="mt-2 text-xs text-slate-500">Private admin access</div>
            </div>
            <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/78 p-6 shadow-2xl shadow-black/45 backdrop-blur-xl">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/40 to-transparent" />
                {children}
            </div>
        </div>
    );
}
