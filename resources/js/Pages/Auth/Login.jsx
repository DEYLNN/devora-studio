import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    return (
        <GuestLayout>
            <Head title="Admin login" />

            <div className="mb-7">
                <div className="inline-flex rounded-full border border-cyan-200/15 bg-cyan-200/10 px-3 py-1 text-[11px] font-black uppercase tracking-[.22em] text-cyan-100">
                    Secure Console
                </div>
                <h1 className="mt-4 text-3xl font-black tracking-[-.06em] text-white">Welcome back.</h1>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                    Login untuk manage provider, model, traffic, dan Devora Studio dashboard.
                </p>
            </div>

            {status && <div className="mb-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">{status}</div>}

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label htmlFor="email" className="mb-2 block text-xs font-black uppercase tracking-[.18em] text-slate-500">Email</label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        autoComplete="username"
                        autoFocus
                        onChange={(e) => setData('email', e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-200/45 focus:bg-black/35 focus:ring-2 focus:ring-cyan-200/10"
                        placeholder="you@example.com"
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <label htmlFor="password" className="block text-xs font-black uppercase tracking-[.18em] text-slate-500">Password</label>
                        {canResetPassword && (
                            <Link href={route('password.request')} className="text-xs font-bold text-slate-500 transition hover:text-cyan-100">
                                Forgot password?
                            </Link>
                        )}
                    </div>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-200/45 focus:bg-black/35 focus:ring-2 focus:ring-cyan-200/10"
                        placeholder="••••••••"
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="flex items-center justify-between gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-400">
                        <Checkbox name="remember" checked={data.remember} onChange={(e) => setData('remember', e.target.checked)} />
                        <span>Remember me</span>
                    </label>
                    <span className="text-xs text-slate-600">Admin only</span>
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="group relative w-full overflow-hidden rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-xl shadow-cyan-950/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-55"
                >
                    <span className="relative z-10">{processing ? 'Signing in…' : 'Enter dashboard'}</span>
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-cyan-100/70 to-transparent opacity-0 transition duration-700 group-hover:translate-x-full group-hover:opacity-100" />
                </button>
            </form>
        </GuestLayout>
    );
}
