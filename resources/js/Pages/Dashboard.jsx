import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';

const StatCard = ({ label, value, hint }) => (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[.035] p-5 shadow-xl backdrop-blur">
        <div className="text-xs font-bold uppercase tracking-[.24em] text-slate-500">{label}</div>
        <div className="mt-3 text-4xl font-black tracking-[-.06em] text-white">{value}</div>
        <div className="mt-2 text-sm text-slate-400">{hint}</div>
    </div>
);

export default function Dashboard({ stats = {}, recentChats = [], providers = [], usage = {}, traffic = {}, errorLogs = [] }) {
    const createChat = () => router.post(route('chat.store'), { title: 'New Chat' });

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[.35em] text-cyan-200/70">Command Center</p>
                        <h2 className="mt-2 text-3xl font-black tracking-[-.05em] text-white">Dashboard</h2>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={createChat} className="rounded-full bg-cyan-300 px-5 py-2 text-sm font-black text-slate-950 hover:bg-cyan-200">New Chat</button>
                        <Link href={route('admin.providers.index')} className="rounded-full border border-white/10 px-5 py-2 text-sm font-semibold text-white/80 hover:border-white/30">Providers</Link>
                    </div>
                </div>
            }
        >
            <Head title="Dashboard" />
            <div className="mx-auto max-w-7xl space-y-5 p-4">
                <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/75 p-6 shadow-2xl backdrop-blur-xl lg:p-8">
                    <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
                    <div className="relative grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
                        <div>
                            <div className="mb-4 inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-200">System online</div>
                            <h1 className="max-w-3xl text-4xl font-black leading-none tracking-[-.06em] text-white sm:text-5xl">Your Laravel AI workspace is ready.</h1>
                            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400">Manage model providers, launch chat sessions, inspect usage, and keep this project portfolio-ready with a PHP-first architecture.</p>
                            <div className="mt-7 flex flex-wrap gap-3">
                                <Link href={route('chat.index')} className="rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950">Open Chat</Link>
                                <Link href={route('admin.models.index')} className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white/80">Model Catalog</Link>
                            </div>
                        </div>
                        <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-5">
                            <div className="text-xs font-bold uppercase tracking-[.24em] text-slate-500">Usage snapshot</div>
                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <div className="rounded-2xl bg-white/[.05] p-4"><div className="text-2xl font-black text-white">{usage.requests ?? 0}</div><div className="text-xs text-slate-500">ok requests</div></div>
                                <div className="rounded-2xl bg-white/[.05] p-4"><div className="text-2xl font-black text-white">{usage.total_tokens ?? 0}</div><div className="text-xs text-slate-500">tokens</div></div>
                                <div className="rounded-2xl bg-white/[.05] p-4"><div className="text-2xl font-black text-white">{usage.public_chat_hits ?? 0}</div><div className="text-xs text-slate-500">/chat hits</div></div>
                                <div className="rounded-2xl bg-red-300/10 p-4"><div className="text-2xl font-black text-red-100">{usage.errors ?? 0}</div><div className="text-xs text-red-200/70">errors</div></div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Chats" value={stats.chats ?? 0} hint="saved conversations" />
                    <StatCard label="Messages" value={stats.messages ?? 0} hint="stored in MySQL" />
                    <StatCard label="Providers" value={stats.providers ?? 0} hint="active endpoints" />
                    <StatCard label="Models" value={stats.models ?? 0} hint="available catalog" />
                </section>


                <section className="grid gap-4 lg:grid-cols-[380px_1fr]">
                    <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-5 shadow-2xl backdrop-blur-xl">
                        <div className="mb-4 flex items-center justify-between"><h3 className="font-black text-white">Traffic hits</h3><span className="text-xs text-slate-500">200 only</span></div>
                        <div className="space-y-2">
                            {(traffic.ok_by_path ?? []).length === 0 && <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-slate-500">No traffic yet.</div>}
                            {(traffic.ok_by_path ?? []).map((row) => <div key={row.path} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.03] px-4 py-3"><span className="truncate text-sm text-slate-300">{row.path}</span><span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-100">{row.hits}</span></div>)}
                        </div>
                    </div>
                    <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-5 shadow-2xl backdrop-blur-xl">
                        <div className="mb-4 flex items-center justify-between"><h3 className="font-black text-white">Recent AI errors</h3><span className="text-xs text-slate-500">stored only on error</span></div>
                        <div className="space-y-3">
                            {errorLogs.length === 0 && <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-500">No errors logged.</div>}
                            {errorLogs.map((log) => <div key={log.id} className="rounded-2xl border border-red-300/10 bg-red-300/[.045] p-4">
                                <div className="flex flex-wrap items-center gap-2 text-xs"><span className="rounded-full bg-red-300/10 px-2 py-1 font-black text-red-100">{log.status_code ?? 'ERR'}</span><span className="text-slate-300">{log.path ?? 'unknown path'}</span><span className="text-slate-500">{log.created_at}</span></div>
                                <div className="mt-2 text-sm font-bold text-white">{log.ai_model?.display_name ?? 'Unknown model'} <span className="text-slate-500">·</span> {log.provider?.name ?? 'Unknown provider'}</div>
                                <pre className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap rounded-xl bg-black/30 p-3 text-xs leading-5 text-red-100/90">{log.error}</pre>
                            </div>)}
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                    <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-5 shadow-2xl backdrop-blur-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-black text-white">Recent chats</h3>
                            <Link href={route('chat.index')} className="text-sm text-cyan-200">View all</Link>
                        </div>
                        <div className="space-y-3">
                            {recentChats.length === 0 && <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-500">No chat history yet.</div>}
                            {recentChats.map((chat) => (
                                <Link key={chat.id} href={route('chat.show', chat.uuid)} className="block rounded-2xl border border-white/10 bg-white/[.03] p-4 transition hover:border-cyan-300/30 hover:bg-cyan-300/5">
                                    <div className="font-bold text-white">{chat.title}</div>
                                    <div className="mt-1 text-xs text-slate-500">updated {chat.updated_at}</div>
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-5 shadow-2xl backdrop-blur-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-black text-white">Provider status</h3>
                            <Link href={route('admin.providers.index')} className="text-sm text-cyan-200">Manage</Link>
                        </div>
                        <div className="space-y-3">
                            {providers.length === 0 && <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-500">No provider configured yet.</div>}
                            {providers.map((provider) => (
                                <div key={provider.id} className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="font-bold text-white">{provider.name}</div>
                                        <span className={(provider.is_active ? 'bg-emerald-300/10 text-emerald-200 border-emerald-300/20' : 'bg-red-300/10 text-red-200 border-red-300/20') + ' rounded-full border px-2 py-1 text-xs font-bold'}>{provider.is_active ? 'active' : 'off'}</span>
                                    </div>
                                    <div className="mt-1 truncate text-xs text-slate-500">{provider.slug} · {provider.models_count} models</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
