import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const suggestions = ['Draft a Laravel feature plan', 'Explain my DB schema', 'Create SEO landing copy'];

function CodeBlockWithCopy({ language = 'text', code = '' }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
        } catch (_) {
            const textarea = document.createElement('textarea');
            textarea.value = code;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
        }
    };

    return (
        <div className="my-4 overflow-hidden rounded-2xl border border-white/10 bg-[#05060a] shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[.035] px-4 py-2.5">
                <div className="flex items-center gap-2">
                    <span className="grid size-6 place-items-center rounded-lg bg-cyan-300/10 text-[10px] font-black text-cyan-200">{'</>'}</span>
                    <span className="text-xs font-black uppercase tracking-[.2em] text-slate-400">{language || 'text'}</span>
                </div>
                <button type="button" onClick={copy} className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-slate-300 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-cyan-100">
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <pre className="max-h-[520px] overflow-auto p-4 text-[13px] leading-6 text-slate-200"><code>{code}</code></pre>
        </div>
    );
}

function MarkdownContent({ content, dark = false }) {
    return (
        <div className={(dark ? 'prose-invert' : '') + ' prose prose-sm max-w-none prose-headings:mb-2 prose-headings:mt-5 prose-headings:font-black prose-p:my-2 prose-p:leading-7 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-strong:font-black prose-code:rounded-md prose-code:bg-cyan-300/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-cyan-100 prose-code:before:content-none prose-code:after:content-none prose-pre:m-0 prose-pre:bg-transparent prose-pre:p-0 prose-blockquote:rounded-r-2xl prose-blockquote:border-l-4 prose-blockquote:border-cyan-300/40 prose-blockquote:bg-white/[.035] prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:not-italic prose-blockquote:text-slate-300 prose-a:text-cyan-200'}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code({ inline, className, children, ...props }) {
                        const match = /language-([\w-]+)/.exec(className || '');
                        const code = String(children).replace(/\n$/, '');
                        if (!inline && match) {
                            return <CodeBlockWithCopy language={match[1]} code={code} />;
                        }
                        if (!inline && code.includes('\n')) {
                            return <CodeBlockWithCopy language="text" code={code} />;
                        }
                        return <code className="rounded-md bg-cyan-300/10 px-1.5 py-0.5 text-cyan-100" {...props}>{children}</code>;
                    },
                    a({ href, children, ...props }) {
                        const external = href?.startsWith('http');
                        return <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer noopener' : undefined} {...props}>{children}</a>;
                    },
                    table({ children }) {
                        return <div className="my-4 overflow-x-auto rounded-2xl border border-white/10"><table className="min-w-full divide-y divide-white/10">{children}</table></div>;
                    },
                    th({ children }) {
                        return <th className="bg-white/[.045] px-3 py-2 text-left text-xs font-black uppercase tracking-[.14em] text-slate-300">{children}</th>;
                    },
                    td({ children }) {
                        return <td className="border-t border-white/10 px-3 py-2 text-sm text-slate-300">{children}</td>;
                    },
                }}
            >
                {content || ''}
            </ReactMarkdown>
        </div>
    );
}

function TypewriterMessage({ message, shouldType = false }) {
    const [visible, setVisible] = useState(shouldType ? '' : message.content);

    useEffect(() => {
        if (!shouldType) {
            setVisible(message.content);
            return;
        }
        setVisible('');
        let i = 0;
        const text = message.content || '';
        const step = () => {
            i = Math.min(i + 3, text.length);
            setVisible(text.slice(0, i));
            if (i < text.length) window.setTimeout(step, 14);
        };
        const timer = window.setTimeout(step, 80);
        return () => window.clearTimeout(timer);
    }, [message.id, message.content, shouldType]);

    const isUser = message.role === 'user';

    return (
        <div className={(isUser ? 'ml-auto bg-cyan-300 text-slate-950' : 'bg-white/[.06] text-slate-100') + ' max-w-3xl rounded-[1.35rem] p-4 shadow-lg'}>
            <div className="mb-2 text-xs font-black uppercase tracking-[.18em] opacity-50">{message.role}</div>
            {isUser ? (
                <div className="whitespace-pre-wrap text-sm leading-6">{visible}</div>
            ) : (
                <>
                    <MarkdownContent content={visible} dark={true} />
                    {shouldType && visible.length < (message.content || '').length && <span className="ml-1 inline-block h-4 w-2 animate-pulse rounded-sm bg-cyan-200 align-middle" />}
                </>
            )}
        </div>
    );
}

function ModelIcon({ name = '' }) {
    const label = name.toLowerCase();
    const ring = label.includes('5.5') ? 'border-fuchsia-200/25 bg-fuchsia-300/10' : 'border-cyan-200/25 bg-cyan-300/10';

    return (
        <span className={`grid size-10 shrink-0 place-items-center rounded-2xl border ${ring} shadow-[0_0_32px_rgba(34,211,238,.12)]`}>
            <img src="/assets/models/openai.svg" alt="GPT model" className="size-5 opacity-90" />
        </span>
    );
}

function ModelPicker({ chat, models, onChange }) {
    const [open, setOpen] = useState(false);
    const active = models.find((model) => String(model.id) === String(chat?.ai_model_id)) ?? models[0];

    return (
        <div className="relative">
            <button
                type="button"
                disabled={!chat?.uuid || models.length === 0}
                onClick={() => setOpen((value) => !value)}
                className="group flex min-w-[220px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[.045] p-2.5 pr-3 text-left shadow-xl backdrop-blur transition hover:border-cyan-300/30 hover:bg-white/[.07] disabled:opacity-40"
            >
                <ModelIcon name={active?.display_name} />
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black text-white">{active?.display_name ?? 'No model'}</span>
                    <span className="block truncate text-xs text-slate-500">{active?.provider?.name ?? 'Provider'}</span>
                </span>
                <svg className={`size-4 text-slate-500 transition ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
            </button>
            {open && (
                <div className="absolute right-0 z-30 mt-3 w-[320px] overflow-hidden rounded-[1.35rem] border border-white/10 bg-slate-950/95 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl">
                    <div className="px-3 py-2 text-[10px] font-black uppercase tracking-[.26em] text-slate-500">Choose model</div>
                    <div className="space-y-1">
                        {models.map((model) => {
                            const selected = String(model.id) === String(active?.id);
                            return (
                                <button
                                    key={model.id}
                                    type="button"
                                    onClick={() => { onChange(model.id); setOpen(false); }}
                                    className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${selected ? 'bg-cyan-300/10 ring-1 ring-cyan-300/20' : 'hover:bg-white/[.055]'}`}
                                >
                                    <ModelIcon name={model.display_name} />
                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-center gap-2">
                                            <span className="truncate text-sm font-black text-white">{model.display_name}</span>
                                            {selected && <span className="rounded-full bg-cyan-300 px-2 py-0.5 text-[10px] font-black text-slate-950">ACTIVE</span>}
                                        </span>
                                        <span className="mt-0.5 block truncate text-xs text-slate-500">{model.provider?.name ?? 'Provider'}</span>
                                    </span>
                                    <span className="grid size-6 place-items-center rounded-full border border-white/10 text-xs text-slate-500">{selected ? '✓' : ''}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Index({ chat = null, sessions = [], models = [] }) {
    const createChat = () => router.post(route('chat.store'), { title: 'New Chat', ai_model_id: models[0]?.id ?? null });
    const form = useForm({ content: '' });
    const pendingContent = form.processing ? form.data.content : '';
    const messages = chat?.messages ?? [];
    const lastAssistantId = useMemo(() => [...messages].reverse().find((m) => m.role === 'assistant')?.id, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!chat?.uuid || !form.data.content.trim()) return;
        form.post(route('chat.message', chat.uuid), { preserveScroll: true, onSuccess: () => form.reset('content') });
    };

    const changeModel = (modelId) => {
        if (!chat?.uuid) return;
        router.patch(route('chat.model', chat.uuid), { ai_model_id: modelId }, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout header={<div><p className="text-xs font-bold uppercase tracking-[.35em] text-cyan-200/70">Workspace</p><h2 className="mt-2 text-2xl font-black tracking-[-.04em] text-white">Devora Studio</h2></div>}>
            <Head title="Devora Studio" />
            <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[310px_1fr]">
                <aside className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/70 shadow-2xl backdrop-blur-xl">
                    <div className="border-b border-white/10 p-4">
                        <button onClick={createChat} className="w-full rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 shadow-[0_0_48px_rgba(34,211,238,.18)] transition hover:bg-cyan-200">+ New Chat</button>
                    </div>
                    <div className="scrollbar-none space-y-2 overflow-y-auto p-3">
                        <div className="px-3 py-2 text-xs font-bold uppercase tracking-[.22em] text-slate-500">Sessions</div>
                        {sessions.length === 0 && <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-500">No chat yet. Start one.</div>}
                        {sessions.map((s) => (
                            <Link key={s.id} href={route('chat.show', s.uuid)} className="block rounded-2xl border border-transparent px-4 py-3 text-sm text-slate-300 transition hover:border-white/10 hover:bg-white/[.04]">{s.title}</Link>
                        ))}
                    </div>
                </aside>
                <main className="min-h-[76vh] overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/70 shadow-2xl backdrop-blur-xl">
                    <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="text-xs font-bold uppercase tracking-[.22em] text-slate-500">Active model</div>
                            <div className="mt-1 font-semibold text-white">{chat?.ai_model?.display_name ?? models[0]?.display_name ?? 'No model configured yet'}</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <ModelPicker chat={chat} models={models} onChange={(id) => changeModel(id)} />
                            <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-200">Typewriter</div>
                        </div>
                    </div>
                    <div className="space-y-5 p-6">
                        {messages.length === 0 && (
                            <div className="grid min-h-[360px] place-items-center rounded-[1.5rem] border border-dashed border-white/10 bg-white/[.025] p-8 text-center">
                                <div>
                                    <div className="mx-auto grid size-14 place-items-center rounded-3xl border border-cyan-300/20 bg-cyan-300/10 text-2xl">✦</div>
                                    <h3 className="mt-5 text-2xl font-black tracking-[-.04em] text-white">Ready for the first prompt.</h3>
                                    <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">Chat is connected to your OpenAI-compatible provider. Responses now reveal with a typewriter effect.</p>
                                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                                        {suggestions.map((x) => <span key={x} className="rounded-full border border-white/10 bg-white/[.04] px-3 py-2 text-xs text-slate-300">{x}</span>)}
                                    </div>
                                </div>
                            </div>
                        )}
                        {messages.map((m) => <TypewriterMessage key={m.id} message={m} shouldType={m.id === lastAssistantId && m.role === 'assistant' && !form.processing} />)}
                        {form.processing && pendingContent && <div className="ml-auto max-w-3xl rounded-[1.35rem] bg-cyan-300 p-4 text-slate-950 shadow-lg opacity-80"><div className="mb-1 text-xs font-black uppercase tracking-[.18em] opacity-50">user</div><div className="whitespace-pre-wrap text-sm leading-6">{pendingContent}</div></div>}
                        {form.processing && <div className="max-w-3xl rounded-[1.35rem] border border-white/10 bg-white/[.06] p-4 text-slate-100 shadow-lg"><div className="mb-2 text-xs font-black uppercase tracking-[.18em] text-slate-500">assistant</div><div className="flex items-center gap-3 text-sm text-slate-300"><span>Thinking</span><span className="flex gap-1"><i className="size-2 animate-bounce rounded-full bg-cyan-200 [animation-delay:-.2s]"/><i className="size-2 animate-bounce rounded-full bg-cyan-200 [animation-delay:-.1s]"/><i className="size-2 animate-bounce rounded-full bg-cyan-200"/></span></div></div>}
                    </div>
                    <div className="border-t border-white/10 p-4">
                        <form onSubmit={sendMessage} className="rounded-[1.5rem] border border-white/10 bg-black/30 p-3">
                            <textarea value={form.data.content} onChange={(e)=>form.setData('content', e.target.value)} className="min-h-24 w-full resize-none border-0 bg-transparent p-3 text-sm text-white placeholder:text-slate-500 focus:ring-0" placeholder={chat?.uuid ? 'Ask anything… AI response will be saved to DB.' : 'Create a chat first.'} />
                            <div className="flex items-center justify-between px-3 pb-2">
                                <span className="text-xs text-slate-500">DB persistence · model switcher · typewriter response</span>
                                <button disabled={!chat?.uuid || form.processing} className="rounded-full bg-white px-5 py-2 text-sm font-bold text-slate-950 disabled:opacity-40">{form.processing ? 'Sending…' : 'Send'}</button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </AuthenticatedLayout>
    );
}
