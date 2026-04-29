import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

const fieldLabels = {
    name: 'Provider name',
    slug: 'Slug',
    base_url: 'Base URL',
    api_key: 'API key',
};

const fieldHints = {
    name: 'Display name, e.g. Devora or OpenRouter.',
    slug: 'Short internal identifier. Lowercase is best.',
    base_url: 'OpenAI-compatible endpoint, usually ending in /v1 or /chat/completions.',
    api_key: 'Stored encrypted by Laravel. Leave empty only if endpoint does not need a key.',
};

function maskKey(hasKey) {
    return hasKey ? '•••• •••• •••• encrypted' : 'No key saved';
}

function shortDate(value) {
    if (!value) return '—';
    return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit' }).format(new Date(value));
}

export default function Index({ providers = [] }) {
    const [editingId, setEditingId] = useState(null);
    const createForm = useForm({ name: '', slug: '', base_url: '', api_key: '' });
    const editForm = useForm({ name: '', slug: '', base_url: '', api_key: '', is_active: true });

    const submit = (e) => {
        e.preventDefault();
        createForm.post(route('admin.providers.store'), { onSuccess: () => createForm.reset() });
    };

    const startEdit = (provider) => {
        setEditingId(provider.id);
        editForm.setData({
            name: provider.name ?? '',
            slug: provider.slug ?? '',
            base_url: provider.base_url ?? '',
            api_key: '',
            is_active: Boolean(provider.is_active),
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        editForm.reset();
        editForm.clearErrors();
    };

    const submitEdit = (e, provider) => {
        e.preventDefault();
        editForm.patch(route('admin.providers.update', provider.id), {
            preserveScroll: true,
            onSuccess: () => cancelEdit(),
        });
    };

    return (
        <AuthenticatedLayout header={<div><p className="text-xs font-bold uppercase tracking-[.35em] text-cyan-200/70">Admin</p><h2 className="mt-2 text-2xl font-black tracking-[-.04em] text-white">Providers</h2></div>}>
            <Head title="Providers" />
            <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[420px_1fr]">
                <form onSubmit={submit} className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-5 shadow-2xl backdrop-blur-xl">
                    <div className="mb-6">
                        <div className="inline-flex rounded-full border border-cyan-200/15 bg-cyan-200/10 px-3 py-1 text-[11px] font-black uppercase tracking-[.2em] text-cyan-100">Encrypted config</div>
                        <h3 className="mt-4 text-xl font-black tracking-[-.04em] text-white">Add provider</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-400">API key disimpan encrypted di database. Base URL tetap visible supaya gampang audit endpoint.</p>
                    </div>

                    {['name','slug','base_url','api_key'].map((field) => (
                        <div key={field} className="mb-4">
                            <label className="mb-2 block text-xs font-black uppercase tracking-[.18em] text-slate-500">{fieldLabels[field]}</label>
                            <input
                                type={field === 'api_key' ? 'password' : 'text'}
                                value={createForm.data[field]}
                                onChange={(e) => createForm.setData(field, e.target.value)}
                                placeholder={field === 'base_url' ? 'https://example.com/v1' : field === 'api_key' ? 'sk-...' : ''}
                                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10"
                            />
                            <div className="mt-1.5 text-xs leading-5 text-slate-600">{fieldHints[field]}</div>
                            {createForm.errors[field] && <p className="mt-1 text-xs text-red-300">{createForm.errors[field]}</p>}
                        </div>
                    ))}

                    <button disabled={createForm.processing} className="mt-2 w-full rounded-2xl bg-cyan-200 px-4 py-3 font-black text-slate-950 shadow-lg shadow-cyan-950/20 transition hover:scale-[1.01] disabled:opacity-50">
                        {createForm.processing ? 'Saving…' : 'Save provider'}
                    </button>
                </form>

                <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-5 shadow-2xl backdrop-blur-xl">
                    <div className="mb-5 flex items-start justify-between gap-4">
                        <div>
                            <h3 className="font-black text-white">Configured providers</h3>
                            <p className="mt-1 text-sm text-slate-500">Keys are masked. Edit form never shows the old key; fill API key only to replace it.</p>
                        </div>
                        <Link href={route('admin.models.index')} className="rounded-xl border border-white/10 px-3 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-200/10">Models →</Link>
                    </div>

                    <div className="space-y-3">
                        {providers.map((provider) => {
                            const editing = editingId === provider.id;
                            return (
                                <div key={provider.id} className="rounded-2xl border border-white/10 bg-white/[.035] p-4 transition hover:border-cyan-200/20 hover:bg-white/[.055]">
                                    {!editing ? (
                                        <>
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <div className="font-black text-white">{provider.name}</div>
                                                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[.16em] ${provider.is_active ? 'bg-emerald-300/10 text-emerald-100' : 'bg-slate-500/10 text-slate-400'}`}>{provider.is_active ? 'Active' : 'Inactive'}</span>
                                                    </div>
                                                    <div className="mt-1 text-xs text-slate-500">{provider.slug} · {provider.type ?? 'openai_compatible'} · {provider.models_count} models</div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <div className={`rounded-full border px-3 py-1 text-xs font-bold ${provider.has_api_key ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100' : 'border-amber-300/20 bg-amber-300/10 text-amber-100'}`}>{maskKey(provider.has_api_key)}</div>
                                                    <button type="button" onClick={() => startEdit(provider)} className="rounded-xl border border-white/10 px-3 py-1.5 text-xs font-black text-slate-300 transition hover:border-cyan-200/30 hover:bg-cyan-200/10 hover:text-cyan-100">Edit</button>
                                                </div>
                                            </div>

                                            <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-3">
                                                <div className="mb-1 text-[10px] font-black uppercase tracking-[.2em] text-slate-600">Base URL</div>
                                                <code className="break-all text-xs text-slate-300">{provider.base_url}</code>
                                            </div>

                                            <div className="mt-3 text-right text-[11px] text-slate-600">Created {shortDate(provider.created_at)}</div>
                                        </>
                                    ) : (
                                        <form onSubmit={(e) => submitEdit(e, provider)} className="space-y-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <div className="text-sm font-black text-white">Edit provider</div>
                                                    <div className="mt-1 text-xs text-slate-500">API key lama tidak ditampilkan. Isi API key hanya kalau mau replace.</div>
                                                </div>
                                                <button type="button" onClick={cancelEdit} className="rounded-xl border border-white/10 px-3 py-1.5 text-xs font-black text-slate-400 hover:text-white">Cancel</button>
                                            </div>

                                            {['name','slug','base_url'].map((field) => (
                                                <div key={field}>
                                                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[.18em] text-slate-500">{fieldLabels[field]}</label>
                                                    <input value={editForm.data[field]} onChange={(e) => editForm.setData(field, e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10" />
                                                    {editForm.errors[field] && <p className="mt-1 text-xs text-red-300">{editForm.errors[field]}</p>}
                                                </div>
                                            ))}

                                            <div>
                                                <label className="mb-2 block text-[10px] font-black uppercase tracking-[.18em] text-slate-500">Replace API key</label>
                                                <input type="password" value={editForm.data.api_key} onChange={(e) => editForm.setData('api_key', e.target.value)} placeholder={provider.has_api_key ? 'Leave empty to keep existing encrypted key' : 'sk-...'} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10" />
                                                <div className="mt-1.5 text-xs text-slate-600">Current key: {maskKey(provider.has_api_key)}</div>
                                                {editForm.errors.api_key && <p className="mt-1 text-xs text-red-300">{editForm.errors.api_key}</p>}
                                            </div>

                                            <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">
                                                <span>Provider active</span>
                                                <input type="checkbox" checked={editForm.data.is_active} onChange={(e) => editForm.setData('is_active', e.target.checked)} className="rounded border-white/20 bg-black/40 text-cyan-300 focus:ring-cyan-300" />
                                            </label>
                                            {editForm.errors.is_active && <p className="text-xs text-red-300">{editForm.errors.is_active}</p>}

                                            <button disabled={editForm.processing} className="w-full rounded-2xl bg-white px-4 py-3 font-black text-slate-950 transition hover:scale-[1.01] disabled:opacity-50">{editForm.processing ? 'Updating…' : 'Update provider'}</button>
                                        </form>
                                    )}
                                </div>
                            );
                        })}
                        {providers.length === 0 && <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-500">No provider yet.</div>}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
