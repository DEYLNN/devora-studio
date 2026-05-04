import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const categories = [
    { value: 'openai', label: 'OpenAI / GPT', icon: '/assets/models/openai.svg' },
    { value: 'claude', label: 'Anthropic / Claude', icon: '/assets/models/claude.png' },
    { value: 'gemini', label: 'Gemini', icon: '/assets/models/gemini.png' },
    { value: 'qwen', label: 'Qwen', icon: '/assets/models/qwen.png' },
    { value: 'kimi', label: 'Moonshot / Kimi', icon: '/assets/models/kimi.png' },
    { value: 'deepseek', label: 'DeepSeek', icon: '/assets/models/deepseek.png' },
    { value: 'grok', label: 'Grok', icon: '/assets/models/grok.png' },
    { value: 'llama', label: 'Llama', icon: '/assets/models/llama.svg' },
    { value: 'mistral', label: 'Mistral', icon: '/assets/models/mistral.png' },
    { value: 'zai', label: 'Z.ai', icon: '/assets/models/zai.png' },
    { value: 'xiaomi', label: 'Xiaomi / Mimo', icon: '/assets/models/xiaomi.svg' },
    { value: 'minimax', label: 'MiniMax', icon: '/assets/models/minimax.png' },
    { value: 'generic', label: 'Generic AI', icon: null },
];
const categoryMeta = (value) => categories.find((category) => category.value === value) ?? categories[categories.length - 1];
const dateInputValue = (value) => value ? String(value).slice(0, 10) : '';
const formatLaunchDate = (value) => value ? new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit' }).format(new Date(value)) : null;

function ModelIcon({ category }) {
    const meta = categoryMeta(category);
    return <span className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-white/[.045]">{meta.icon ? <img src={meta.icon} alt={meta.label} className="size-5 object-contain" /> : <span className="text-xs font-black text-violet-100">AI</span>}</span>;
}

function Toggle({ checked, onChange, label, hint }) {
    return <button type="button" onClick={() => onChange(!checked)} className={`rounded-2xl border p-3 text-left transition ${checked ? 'border-cyan-300/30 bg-cyan-300/10' : 'border-white/10 bg-white/[.03] hover:bg-white/[.055]'}`}><div className="flex items-center justify-between gap-3"><span className="text-sm font-bold text-white">{label}</span><span className={`h-5 w-9 rounded-full p-0.5 transition ${checked ? 'bg-cyan-300' : 'bg-white/10'}`}><i className={`block size-4 rounded-full bg-slate-950 transition ${checked ? 'translate-x-4' : ''}`} /></span></div>{hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}</button>;
}

function EditModelCard({ model, providers }) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        provider_id: model.provider_id,
        model_id: model.model_id ?? '',
        display_name: model.display_name ?? '',
        category: model.category ?? 'generic',
        context_window: model.context_window ?? '',
        supports_vision: Boolean(model.supports_vision),
        supports_files: Boolean(model.supports_files),
        supports_streaming: Boolean(model.supports_streaming),
        is_default: Boolean(model.is_default),
        is_latest: Boolean(model.is_latest),
        launched_at: dateInputValue(model.launched_at),
        is_active: Boolean(model.is_active),
    });
    const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
    const save = () => router.patch(route('admin.models.update', model.id), form, { preserveScroll: true, onSuccess: () => setOpen(false) });

    return <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-3"><ModelIcon category={form.category} /><div className="min-w-0"><div className="truncate font-bold text-white">{form.display_name}</div><div className="mt-1 text-xs text-slate-500">{model.provider?.name} · {form.model_id}{formatLaunchDate(form.launched_at) ? ` · Launch ${formatLaunchDate(form.launched_at)}` : ''}</div><div className="mt-2 flex flex-wrap gap-1 text-[10px] font-black uppercase tracking-[.12em]"><span className="rounded-full bg-white/10 px-2 py-1 text-slate-300">{categoryMeta(form.category).label}</span>{form.supports_vision && <span className="rounded-full bg-cyan-300/10 px-2 py-1 text-cyan-100">image</span>}{form.supports_files && <span className="rounded-full bg-violet-300/10 px-2 py-1 text-violet-100">file</span>}{model.is_latest && form.is_active && <span className="rounded-full border border-orange-300/20 bg-orange-300/10 px-2 py-1 text-orange-100">NEW</span>}{form.is_default && <span className="rounded-full bg-emerald-300/10 px-2 py-1 text-emerald-100">default</span>}{!form.is_active && <span className="rounded-full bg-red-300/10 px-2 py-1 text-red-100">inactive</span>}</div></div></div>
            <button onClick={() => setOpen((v) => !v)} className="w-full rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 sm:w-auto sm:py-1">{open ? 'Close' : 'Edit'}</button>
        </div>
        {open && <div className="mt-5 grid gap-4 border-t border-white/10 pt-5">
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                <div><label className="mb-2 block text-xs font-bold uppercase tracking-[.2em] text-slate-500">Display name</label><input value={form.display_name} onChange={(e) => set('display_name', e.target.value)} className="w-full rounded-2xl border-white/10 bg-black/30 text-white focus:border-cyan-300 focus:ring-cyan-300" /></div>
                <div><label className="mb-2 block text-xs font-bold uppercase tracking-[.2em] text-slate-500">Model ID</label><input value={form.model_id} onChange={(e) => set('model_id', e.target.value)} className="w-full rounded-2xl border-white/10 bg-black/30 text-white focus:border-cyan-300 focus:ring-cyan-300" /></div>
                <div><label className="mb-2 block text-xs font-bold uppercase tracking-[.2em] text-slate-500">Provider</label><select value={form.provider_id} onChange={(e) => set('provider_id', Number(e.target.value))} className="w-full rounded-2xl border-white/10 bg-black/30 text-white focus:border-cyan-300 focus:ring-cyan-300">{providers.map((p)=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <div><label className="mb-2 block text-xs font-bold uppercase tracking-[.2em] text-slate-500">Category</label><select value={form.category} onChange={(e) => set('category', e.target.value)} className="w-full rounded-2xl border-white/10 bg-black/30 text-white focus:border-cyan-300 focus:ring-cyan-300">{categories.map((c)=><option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
                <div><label className="mb-2 block text-xs font-bold uppercase tracking-[.2em] text-slate-500">Context window</label><input value={form.context_window} onChange={(e) => set('context_window', e.target.value)} className="w-full rounded-2xl border-white/10 bg-black/30 text-white focus:border-cyan-300 focus:ring-cyan-300" /></div>
                <div><label className="mb-2 block text-xs font-bold uppercase tracking-[.2em] text-slate-500">Launch at</label><input type="date" value={form.launched_at} onChange={(e) => set('launched_at', e.target.value)} className="w-full rounded-2xl border-white/10 bg-black/30 text-white focus:border-cyan-300 focus:ring-cyan-300" /></div>
            </div>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"><Toggle checked={form.supports_vision} onChange={(v)=>set('supports_vision', v)} label="Image" hint="show + upload" /><Toggle checked={form.supports_files} onChange={(v)=>set('supports_files', v)} label="Files" hint="future file upload" /><Toggle checked={form.supports_streaming} onChange={(v)=>set('supports_streaming', v)} label="Streaming" hint="SSE capable" /><Toggle checked={form.is_default} onChange={(v)=>set('is_default', v)} label="Default" hint="global chat default" /><Toggle checked={form.is_latest} onChange={(v)=>set('is_latest', v)} label="Latest" hint="one per category" /><Toggle checked={form.is_active} onChange={(v)=>set('is_active', v)} label="Active" hint="visible in chat" /></div>
            <button onClick={save} className="w-full rounded-2xl bg-cyan-300 px-4 py-3 font-black text-slate-950">Save changes</button>
        </div>}
    </div>;
}

export default function Index({ models = [], providers = [] }) {
    const { data, setData, post, processing, errors, reset } = useForm({ provider_id: providers[0]?.id ?? '', model_id: '', display_name: '', category: 'generic', context_window: '', launched_at: '', supports_vision: false, supports_files: false, supports_streaming: true, is_default: false, is_latest: false, is_active: true });
    const submit = (e) => { e.preventDefault(); post(route('admin.models.store'), { onSuccess: () => reset('model_id','display_name','context_window','launched_at') }); };
    return (
        <AuthenticatedLayout header={<div><p className="text-xs font-bold uppercase tracking-[.35em] text-cyan-200/70">Admin</p><h2 className="mt-2 text-2xl font-black tracking-[-.04em] text-white">AI Models</h2></div>}>
            <Head title="AI Models" />
            <div className="mx-auto grid max-w-7xl gap-4 p-3 sm:p-4 lg:grid-cols-[420px_1fr]">
                <form onSubmit={submit} className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4 sm:rounded-[1.75rem] sm:p-5 shadow-2xl backdrop-blur-xl">
                    <div className="mb-5 text-sm text-slate-400">Register model ID and capabilities. Public chat uses category icons and hides image upload when Image is off.</div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[.2em] text-slate-500">provider</label>
                    <select value={data.provider_id} onChange={(e)=>setData('provider_id',e.target.value)} className="mb-4 w-full rounded-2xl border-white/10 bg-black/30 text-white focus:border-cyan-300 focus:ring-cyan-300">{providers.map((p)=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
                    {['model_id','display_name','context_window','launched_at'].map((field) => <div key={field} className="mb-4"><label className="mb-2 block text-xs font-bold uppercase tracking-[.2em] text-slate-500">{field.replace('_',' ')}</label><input type={field === 'launched_at' ? 'date' : 'text'} value={data[field]} onChange={(e)=>setData(field,e.target.value)} className="w-full rounded-2xl border-white/10 bg-black/30 text-white focus:border-cyan-300 focus:ring-cyan-300" />{errors[field] && <p className="mt-1 text-xs text-red-300">{errors[field]}</p>}</div>)}
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[.2em] text-slate-500">category</label><select value={data.category} onChange={(e)=>setData('category',e.target.value)} className="mb-4 w-full rounded-2xl border-white/10 bg-black/30 text-white focus:border-cyan-300 focus:ring-cyan-300">{categories.map((c)=><option key={c.value} value={c.value}>{c.label}</option>)}</select>
                    <div className="mb-4 grid gap-3"><Toggle checked={data.supports_vision} onChange={(v)=>setData('supports_vision', v)} label="Supports image" hint="Enable + upload in public chat" /><Toggle checked={data.supports_files} onChange={(v)=>setData('supports_files', v)} label="Supports files" hint="Reserved for future file upload" /><Toggle checked={data.is_latest} onChange={(v)=>setData('is_latest', v)} label="Latest" hint="One per category" /></div>
                    <button disabled={processing || providers.length===0} className="w-full rounded-2xl bg-cyan-300 px-4 py-3 font-black text-slate-950 disabled:opacity-50">Save Model</button>
                </form>
                <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4 sm:rounded-[1.75rem] sm:p-5 shadow-2xl backdrop-blur-xl">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-white">Model Catalog</h3><Link href={route('admin.providers.index')} className="text-sm text-cyan-200">Providers →</Link></div>
                    <div className="space-y-3">{models.map((m)=><EditModelCard key={m.id} model={m} providers={providers} />)}{models.length===0 && <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-500">No model yet.</div>}</div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
