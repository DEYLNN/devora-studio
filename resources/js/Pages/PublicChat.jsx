import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const STORE_KEY = 'devora-studio.public.sessions.v2';
const prompts = ['Give me ideas for a productive morning', 'Summarize a topic in simple words', 'Help me write a polite message', 'Plan a simple weekend activity'];
const RECENT_CONTEXT_LIMIT = 14;
const SUMMARY_AFTER_MESSAGES = 18;
const SUMMARY_KEEP_RECENT = 8;
const MAX_HISTORY_SESSIONS = 20;

const uid = () => (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
const formatTime = (value) => new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(value ? new Date(value) : new Date());
const sessionTimestamp = (session) => new Date(session.updatedAt ?? session.createdAt ?? 0).getTime() || 0;
const newestSessions = (items = []) => [...items].sort((a, b) => sessionTimestamp(b) - sessionTimestamp(a));
const trimHistory = (items = []) => newestSessions(items.filter((session) => (session.messages?.length ?? 0) > 0)).slice(0, MAX_HISTORY_SESSIONS);
const needsContinuation = (text = '') => /\b(let me|i(?:'|’)ll|i will|i am going to|i'm going to|saya akan|aku akan|gue akan|gw akan|sebentar|tunggu|mohon tunggu|wait)\b.{0,80}\b(search|check|look up|find|cari|cek|periksa|telusuri|nyari|mencari|berita|news|informasi)\b/i.test(text);

function csrf() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

function xsrfCookie() {
    const match = document.cookie.split('; ').find((row) => row.startsWith('XSRF-TOKEN='));
    return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : '';
}

const modelCategoryIcons = {
    openai: '/assets/models/openai.svg',
    claude: '/assets/models/claude.png',
    gemini: '/assets/models/gemini.png',
    qwen: '/assets/models/qwen.png',
    kimi: '/assets/models/kimi.png',
    deepseek: '/assets/models/deepseek.png',
    grok: '/assets/models/grok.png',
    llama: '/assets/models/llama.svg',
    mistral: '/assets/models/mistral.png',
    zai: '/assets/models/zai.png',
};

const modelCategoryLabels = {
    openai: 'OpenAI / GPT',
    claude: 'Anthropic / Claude',
    gemini: 'Gemini',
    qwen: 'Qwen',
    kimi: 'Moonshot / Kimi',
    deepseek: 'DeepSeek',
    grok: 'Grok',
    llama: 'Llama',
    mistral: 'Mistral',
    zai: 'Z.ai',
    generic: 'Generic AI',
};
const modelCategoryLabel = (model) => modelCategoryLabels[model?.category ?? 'generic'] ?? 'Generic AI';

function ModelIcon({ model }) {
    const category = model?.category ?? 'generic';
    const icon = modelCategoryIcons[category];
    return (
        <span className="grid size-8 place-items-center rounded-xl border border-white/10 bg-white/[.045]">
            {icon ? <img src={icon} alt={category} className="size-5 object-contain opacity-90" /> : <span className="text-xs font-black text-violet-100">AI</span>}
        </span>
    );
}



function CapabilityIcons({ model, compact = false }) {
    const box = `${compact ? 'size-4' : 'size-5'} inline-grid place-items-center rounded-md border`;
    const svg = compact ? 'size-3' : 'size-3.5';
    return <span className="inline-flex items-center gap-1">
        <span title="Text generation" className={`${box} border-slate-500/35 bg-slate-500/10 text-slate-100`}>
            <svg className={svg} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 6.5h14M12 6.5v11M8 17.5h8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </span>
        {model?.supports_vision && <span title="Image input" className={`${box} border-sky-300/35 bg-sky-400/15 text-sky-200`}>
            <svg className={svg} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="4" y="5" width="16" height="14" rx="3" stroke="currentColor" strokeWidth="2" />
                <circle cx="15.5" cy="9.5" r="1.5" fill="currentColor" />
                <path d="M5.5 17l4.2-4.2a1.2 1.2 0 0 1 1.7 0l2 2 1.4-1.4a1.2 1.2 0 0 1 1.7 0L20 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </span>}
        {model?.supports_files && <span title="File input" className={`${box} border-violet-300/35 bg-violet-400/15 text-violet-200`}>
            <svg className={svg} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M7 3.5h6.2L18 8.3v12.2H7v-17Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <path d="M13 3.8V9h5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <path d="M9.5 13h5M9.5 16h3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        </span>}
    </span>;
}

function ModelPicker({ models = [], value, onChange }) {
    const [open, setOpen] = useState(false);
    const pickerRef = useRef(null);

    useEffect(() => {
        if (!open) return;

        const handlePointerDown = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);
    const active = models.find((model) => String(model.id) === String(value) && model.is_active) ?? models.find((model) => model.is_active) ?? models[0];

    return (
        <div ref={pickerRef} className="relative">
            <button type="button" onClick={() => setOpen((v) => !v)} className="inline-flex max-w-[42vw] items-center gap-2 rounded-2xl border border-white/10 bg-white/[.045] px-2.5 py-2 text-left shadow-lg shadow-black/20 transition hover:bg-white/[.075] sm:max-w-none sm:px-3">
                <ModelIcon model={active} />
                <span className="min-w-0">
                    <span className="block max-w-[72px] truncate text-xs font-black text-white sm:max-w-[150px] sm:text-sm">{active?.display_name ?? 'Model'}</span>
                    
                </span>
            </button>
            {open && <div className="absolute right-0 z-50 mt-2 scrollbar-none max-h-[272px] w-72 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/95 p-2 pr-1 shadow-2xl backdrop-blur-xl">
                {models.map((model) => <button key={model.id} type="button" disabled={!model.is_active} onClick={() => { if (!model.is_active) return; onChange(model.id); setOpen(false); }} className={`mr-1 flex w-[calc(100%-0.25rem)] items-center gap-3 rounded-xl px-3 py-2 text-left transition ${!model.is_active ? 'cursor-not-allowed opacity-40 grayscale' : String(model.id) === String(value) ? 'bg-cyan-300/10' : 'hover:bg-white/[.055]'}`}>
                    <ModelIcon model={model} />
                    <span className="min-w-0 flex-1">
                        <span className="flex min-w-0 items-center gap-1.5"><span className="block truncate text-sm font-black text-white">{model.display_name}</span>{model.is_latest && model.is_active && <span className="shrink-0 rounded-full bg-orange-500 px-1.5 py-[1px] text-[8px] font-black leading-none tracking-[.08em] text-white shadow-[0_0_14px_rgba(249,115,22,.28)]">NEW</span>}</span>
                        <span className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-slate-500"><span>{model.is_active ? modelCategoryLabel(model) : `${modelCategoryLabel(model)} · inactive`}</span><CapabilityIcons model={model} compact /></span>
                    </span>
                </button>)}
            </div>}
        </div>
    );
}

function CodeBlock({ language = 'text', code = '' }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1100);
    };
    return (
        <div className="my-4 overflow-hidden rounded-2xl border border-white/10 bg-[#06070b]">
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[.035] px-4 py-2">
                <span className="text-xs font-black uppercase tracking-[.2em] text-slate-400">{language}</span>
                <button onClick={copy} className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-slate-300 hover:bg-cyan-300/10 hover:text-cyan-100">{copied ? 'Copied' : 'Copy'}</button>
            </div>
            <pre className="max-h-[520px] overflow-auto p-4 text-[13px] leading-6 text-slate-200"><code>{code}</code></pre>
        </div>
    );
}

function Markdown({ children }) {
    return (
        <div className="prose prose-sm prose-invert max-w-none prose-headings:font-black prose-p:leading-7 prose-code:before:content-none prose-code:after:content-none prose-a:text-cyan-200">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                code({ inline, className, children, ...props }) {
                    const match = /language-([\w-]+)/.exec(className || '');
                    const code = String(children).replace(/\n$/, '');
                    if (!inline && (match || code.includes('\n'))) return <CodeBlock language={match?.[1] ?? 'text'} code={code} />;
                    return <code className="rounded-md bg-cyan-300/10 px-1.5 py-0.5 text-cyan-100" {...props}>{children}</code>;
                },
                a({ href, children, ...props }) {
                    const external = href?.startsWith('http');
                    return <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer noopener' : undefined} {...props}>{children}</a>;
                },
                table({ children }) { return <div className="my-4 overflow-x-auto rounded-2xl border border-white/10"><table className="min-w-full">{children}</table></div>; },
                th({ children }) { return <th className="bg-white/[.045] px-3 py-2 text-left text-xs uppercase tracking-[.14em] text-slate-300">{children}</th>; },
                td({ children }) { return <td className="border-t border-white/10 px-3 py-2 text-slate-300">{children}</td>; },
            }}>{children}</ReactMarkdown>
        </div>
    );
}


function TypewriterText({ text = '', onDone }) {
    const [visible, setVisible] = useState('');
    useEffect(() => {
        setVisible('');
        if (!text) {
            onDone?.();
            return;
        }
        let index = 0;
        const step = Math.max(1, Math.ceil(text.length / 900));
        const timer = window.setInterval(() => {
            index = Math.min(text.length, index + step);
            setVisible(text.slice(0, index));
            if (index >= text.length) {
                window.clearInterval(timer);
                onDone?.();
            }
        }, 10);
        return () => window.clearInterval(timer);
    }, [text]);

    return <Markdown>{visible}</Markdown>;
}

function Message({ message, onEdit, onContinue, canContinue = false, isTyping = false, onTypingDone }) {
    const isUser = message.role === 'user';
    return (
        <div className={`group flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && <div className="mt-1 hidden size-8 shrink-0 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 sm:grid"><ModelIcon model={message.model} /></div>}
            <div className={`${isUser ? 'max-w-[88%] rounded-[1.35rem] bg-cyan-300 px-3 py-2.5 text-slate-950 sm:max-w-[76%] sm:px-4 sm:py-3' : 'max-w-[96%] rounded-[1.35rem] border border-white/10 bg-white/[.055] px-3 py-2.5 text-slate-100 shadow-xl sm:max-w-[82%] sm:px-4 sm:py-3'} text-sm leading-6`}>
                {isUser ? <div className="whitespace-pre-wrap">{message.content}</div> : <>{isTyping ? <TypewriterText text={message.content} onDone={onTypingDone} /> : <Markdown>{message.content}</Markdown>}{canContinue && <button type="button" onClick={() => onContinue?.()} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-black text-cyan-100 transition hover:border-cyan-200/40 hover:bg-cyan-300/15">Continue</button>}<div className="mt-3 border-t border-white/10 pt-2 text-right text-[11px] italic text-slate-500">{message.model_name ? `${message.model_name} · ` : ''}{formatTime(message.created_at ?? message.createdAt)}</div></>}
            </div>
        </div>
    );
}

function Typing() {
    return <div className="flex gap-2 sm:gap-3"><div className="hidden size-8 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 sm:grid"><ModelIcon model={null} /></div><div className="rounded-[1.35rem] border border-white/10 bg-white/[.055] px-3 py-2.5 text-sm text-slate-300 sm:px-4 sm:py-3">Thinking <span className="inline-flex gap-1 pl-2"><i className="size-1.5 animate-bounce rounded-full bg-cyan-200 [animation-delay:-.2s]"/><i className="size-1.5 animate-bounce rounded-full bg-cyan-200 [animation-delay:-.1s]"/><i className="size-1.5 animate-bounce rounded-full bg-cyan-200"/></span></div></div>;
}

export default function PublicChat({ models = [] }) {
    const [sessions, setSessions] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [input, setInput] = useState('');
    const [modelId, setModelId] = useState(models.find((m) => m.is_active && m.is_default)?.id ?? models.find((m) => m.is_active)?.id ?? models[0]?.id ?? null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [attachments, setAttachments] = useState([]);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editingText, setEditingText] = useState('');
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [typingMessageId, setTypingMessageId] = useState(null);
    const viewport = useRef(null);

    useEffect(() => {
        let saved = [];
        try {
            const raw = localStorage.getItem(STORE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            saved = Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.warn('Resetting broken Devora Studio chat history', error);
            localStorage.removeItem(STORE_KEY);
            saved = [];
        }
        const nonEmpty = trimHistory(saved);
        const starter = { id: uid(), title: 'New chat', modelId, messages: [], summary: '', summarizedUntil: 0, createdAt: new Date().toISOString(), starter: true };
        setSessions([starter, ...nonEmpty]);
        setActiveId(starter.id);
    }, []);

    useEffect(() => {
        try {
            const persistable = trimHistory(sessions);
            localStorage.setItem(STORE_KEY, JSON.stringify(persistable));
        } catch (error) {
            console.warn('Unable to persist Devora Studio chat history', error);
        }
    }, [sessions]);
    useEffect(() => { viewport.current?.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' }); }, [sessions, activeId, loading]);

    const active = sessions.find((s) => s.id === activeId) ?? sessions[0];
    const activeModel = models.find((m) => String(m.id) === String(modelId) && m.is_active) ?? models.find((m) => m.is_active) ?? models[0];
    const supportsImages = Boolean(activeModel?.supports_vision);

    const patchActive = (updater) => setSessions((items) => items.map((s) => s.id === active?.id ? updater(s) : s));
    const newChat = () => { const s = { id: uid(), title: 'New chat', modelId, messages: [], summary: '', summarizedUntil: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; setSessions((items) => [s, ...trimHistory(items)]); setActiveId(s.id); setInput(''); setTypingMessageId(null); setMobileSidebarOpen(false); };

    const deleteSession = (id) => {
        setSessions((items) => {
            const next = items.filter((item) => item.id !== id);
            if (activeId === id) {
                const fallback = next[0] ?? { id: uid(), title: 'New chat', modelId, messages: [], summary: '', summarizedUntil: 0, createdAt: new Date().toISOString() };
                if (!next.length) next.push(fallback);
                setActiveId(fallback.id);
            }
            return next;
        });
    };

    const uploadImages = async (files) => {
        if (!supportsImages) return;
        const selected = Array.from(files || []).slice(0, Math.max(0, 4 - attachments.length));
        if (!selected.length) return;
        setUploading(true);
        try {
            const uploaded = [];
            for (const file of selected) {
                const form = new FormData();
                form.append('image', file);
                const res = await fetch('/chat/images', { method: 'POST', credentials: 'same-origin', headers: { 'X-CSRF-TOKEN': csrf(), 'X-XSRF-TOKEN': xsrfCookie(), Accept: 'application/json' }, body: form });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Image upload failed.');
                uploaded.push(data);
            }
            setAttachments((items) => [...items, ...uploaded].slice(0, 4));
        } catch (e) {
            setSessions((items) => items.map((s) => s.id === active?.id ? { ...s, messages: [...s.messages, { id: uid(), role: 'assistant', content: `Image upload error: ${e.message}`, createdAt: new Date().toISOString() }], updatedAt: new Date().toISOString() } : s));
        } finally {
            setUploading(false);
        }
    };

    const buildContextMessages = (session, nextMessages) => {
        const recent = nextMessages.slice(-RECENT_CONTEXT_LIMIT).map(({ role, content, images }) => ({ role, content, images: images ?? [] }));
        if (!session?.summary) return recent;
        return [
            {
                role: 'system',
                content: `Earlier conversation summary for continuity:\n${session.summary}\n\nUse this summary as context, but answer the latest user request directly.`,
            },
            ...recent,
        ];
    };

    const maybeSummarize = async (session, messages) => {
        if (messages.length < SUMMARY_AFTER_MESSAGES) return;
        const summarizedUntil = session.summarizedUntil ?? 0;
        const cutoff = Math.max(0, messages.length - SUMMARY_KEEP_RECENT);
        if (cutoff <= summarizedUntil) return;
        const chunk = messages.slice(summarizedUntil, cutoff).filter((message) => !message.images?.length);
        if (chunk.length < 6) return;
        try {
            const res = await fetch('/chat/summarize', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf(), 'X-XSRF-TOKEN': xsrfCookie(), Accept: 'application/json' },
                body: JSON.stringify({ model_id: modelId, existing_summary: session.summary ?? '', messages: chunk.map(({ role, content }) => ({ role, content })), website: '' }),
            });
            const data = await res.json();
            if (res.ok && data.summary) {
                setSessions((items) => items.map((item) => item.id === session.id ? { ...item, summary: data.summary, summarizedUntil: cutoff, updatedAt: new Date().toISOString() } : item));
            }
        } catch (_) {
            // Summary is best-effort; never block chat.
        }
    };

    const requestAssistant = async (nextMessages) => {
        setLoading(true);
        try {
            const res = await fetch('/chat/message', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf(), 'X-XSRF-TOKEN': xsrfCookie(), Accept: 'application/json' }, body: JSON.stringify({ model_id: modelId, messages: buildContextMessages(active, nextMessages), website: '' }) });
            const data = await res.json();
            const assistant = res.ok ? data.message : { id: uid(), role: 'assistant', content: data.message || 'Provider error.', createdAt: new Date().toISOString() };
            const fullMessages = [...nextMessages, assistant];
            patchActive((s) => ({ ...s, messages: fullMessages }));
            if (assistant.role === 'assistant') setTypingMessageId(assistant.id);
            await maybeSummarize(active, fullMessages);
        } catch (e) {
            patchActive((s) => ({ ...s, messages: [...s.messages, { id: uid(), role: 'assistant', content: e.message?.startsWith('Too many') ? e.message : `Network error: ${e.message}`, createdAt: new Date().toISOString() }] }));
        } finally { setLoading(false); }
    };

    const send = async (text = input) => {
        const content = text.trim() || (attachments.length ? 'Please analyze the attached image.' : '');
        if ((!content && attachments.length === 0) || !active || loading || uploading) return;
        const userMessage = { id: uid(), role: 'user', content, images: attachments, createdAt: new Date().toISOString() };
        const nextMessages = [...active.messages, userMessage];
        patchActive((s) => ({ ...s, title: s.title === 'New chat' ? content.slice(0, 48) : s.title, modelId, messages: nextMessages }));
        setInput(''); setAttachments([]);
        await requestAssistant(nextMessages);
    };

    const continueAssistant = async () => {
        if (!active || loading || uploading) return;
        const userMessage = {
            id: uid(),
            role: 'user',
            content: 'Continue. Give the final answer now based on what you know. Do not say you are still searching unless live browsing is actually available.',
            createdAt: new Date().toISOString(),
        };
        const nextMessages = [...active.messages, userMessage];
        patchActive((s) => ({ ...s, messages: nextMessages }));
        await requestAssistant(nextMessages);
    };

    const startEdit = (message) => {
        setEditingMessageId(message.id);
        setEditingText(message.content);
    };

    const cancelEdit = () => {
        setEditingMessageId(null);
        setEditingText('');
    };

    const submitEdit = async () => {
        const content = editingText.trim();
        if (!content || !active || loading) return;
        const index = active.messages.findIndex((message) => message.id === editingMessageId);
        if (index < 0) return;
        const original = active.messages[index];
        if ((original.images?.length ?? 0) > 0) return;
        const edited = { ...original, content, editedAt: new Date().toISOString() };
        const nextMessages = [...active.messages.slice(0, index), edited];
        patchActive((s) => ({ ...s, messages: nextMessages, title: index === 0 ? content.slice(0, 48) : s.title }));
        cancelEdit();
        await requestAssistant(nextMessages);
    };

    return (
        <div className="h-[100dvh] overflow-hidden bg-[#07080d] text-white">
            <Head title="AI Chat" />
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,.13),transparent_34%)]" />
            <div className="relative grid h-[100dvh] overflow-hidden grid-cols-1 md:grid-cols-[280px_1fr]">
                {mobileSidebarOpen && <div className="fixed inset-0 z-50 md:hidden">
                    <button aria-label="Close sidebar" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
                    <aside className="absolute inset-y-0 left-0 flex w-[84vw] max-w-[320px] flex-col border-r border-white/10 bg-slate-950/95 p-3 shadow-2xl">
                        <div className="mb-3 flex items-center justify-between px-1">
                            <div><div className="text-sm font-black">History</div><div className="text-xs text-slate-500">Local sessions</div></div>
                            <button onClick={() => setMobileSidebarOpen(false)} className="grid size-9 place-items-center rounded-xl border border-white/10 text-slate-300">✕</button>
                        </div>
                        <button onClick={newChat} className="mb-3 rounded-2xl border border-white/10 bg-white/[.055] px-4 py-3 text-left text-sm font-black hover:border-cyan-300/30 hover:bg-cyan-300/10">+ New chat</button>
                        <div className="scrollbar-none flex-1 space-y-1 overflow-y-auto">
                            {sessions.map((s) => <div key={s.id} className={`group flex items-center rounded-xl ${s.id === active?.id ? 'bg-white/[.09]' : 'hover:bg-white/[.045]'}`}><button onClick={() => { setActiveId(s.id); setMobileSidebarOpen(false); }} className={`min-w-0 flex-1 truncate px-3 py-2 text-left text-sm ${s.id === active?.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{s.title}{s.summary && <span className="ml-2 text-[10px] text-cyan-300/70">memory</span>}</button><button onClick={() => deleteSession(s.id)} className="mr-1 grid size-8 place-items-center rounded-lg text-slate-500 opacity-70 hover:bg-red-400/10 hover:text-red-200">×</button></div>)}
                        </div>
                        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[.025] px-4 py-3 text-[11px] leading-5 text-slate-500"><div>Designed by Deylnn Assistant</div><div>Built by <a href="https://dkzhen.org" target="_blank" rel="noreferrer noopener" className="font-bold text-cyan-200 hover:text-cyan-100">Zhen</a></div></div>
                    </aside>
                </div>}
                <aside className="hidden h-screen border-r border-white/10 bg-black/30 p-3 backdrop-blur-xl md:flex md:flex-col">
                    <button onClick={newChat} className="mb-3 rounded-2xl border border-white/10 bg-white/[.055] px-4 py-3 text-left text-sm font-black hover:border-cyan-300/30 hover:bg-cyan-300/10">+ New chat</button>
                    <div className="scrollbar-none flex-1 space-y-1 overflow-y-auto">
                        {sessions.map((s) => <div key={s.id} className={`group flex items-center rounded-xl ${s.id === active?.id ? 'bg-white/[.09]' : 'hover:bg-white/[.045]'}`}><button onClick={() => setActiveId(s.id)} className={`min-w-0 flex-1 truncate px-3 py-2 text-left text-sm ${s.id === active?.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{s.title}{s.summary && <span className="ml-2 text-[10px] text-cyan-300/70">memory</span>}</button><button onClick={() => deleteSession(s.id)} className="mr-1 grid size-8 place-items-center rounded-lg text-slate-500 opacity-0 transition group-hover:opacity-100 hover:bg-red-400/10 hover:text-red-200">×</button></div>)}
                    </div>
                    <div className="mt-3 rounded-2xl border border-white/10 bg-white/[.025] px-4 py-3 text-[11px] leading-5 text-slate-500"><div>Designed by Deylnn Assistant</div><div>Built by <a href="https://dkzhen.org" target="_blank" rel="noreferrer noopener" className="font-bold text-cyan-200 hover:text-cyan-100">Zhen</a></div></div>
                </aside>
                <main className="flex h-[100dvh] min-h-0 min-w-0 flex-col overflow-hidden">
                    <nav className="relative z-40 flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-[#07080d]/95 px-4 shadow-lg shadow-black/20 backdrop-blur-xl">
                        <div className="flex items-center gap-3"><button onClick={() => setMobileSidebarOpen(true)} className="grid size-10 place-items-center rounded-xl border border-white/10 text-slate-200 md:hidden" aria-label="Open history"><span className="space-y-1.5"><i className="block h-0.5 w-5 rounded-full bg-current"/><i className="block h-0.5 w-5 rounded-full bg-current"/><i className="block h-0.5 w-5 rounded-full bg-current"/></span></button><div className="text-sm font-black tracking-[-.03em]">Devora Studio</div></div>
                        <ModelPicker models={models} value={modelId} onChange={(id) => { setModelId(id); const next = models.find((m) => Number(m.id) === Number(id)); if (!next?.supports_vision) setAttachments([]); }} />
                    </nav>
                    <section ref={viewport} className="scrollbar-none min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                        <div className="mx-auto flex min-h-full max-w-4xl flex-col gap-4 px-1 pb-6 sm:gap-5 sm:px-0">
                            {(active?.messages?.length ?? 0) === 0 && <div className="flex flex-1 items-center justify-center text-center"><div className="w-full py-6"><div className="mx-auto mb-4 grid size-14 place-items-center rounded-[1.25rem] border border-cyan-300/20 bg-cyan-300/10"><ModelIcon model={activeModel} /></div><h1 className="text-3xl font-black tracking-[-.06em] sm:text-4xl">What can I help with?</h1><p className="mt-2 text-sm text-slate-400">Devora Studio keeps your sessions in this browser · {active?.summary ? 'summary memory on' : 'local memory'}</p><div className="mx-auto mt-6 grid max-w-2xl gap-2 sm:grid-cols-2">{prompts.map((p) => <button key={p} onClick={() => send(p)} className="rounded-2xl border border-white/10 bg-white/[.04] p-3 text-left text-sm text-slate-300 hover:border-cyan-300/30 hover:bg-cyan-300/10">{p}</button>)}</div></div></div>}
                            {active?.messages?.map((m, index) => <Message key={m.id} message={m} onEdit={startEdit} onContinue={continueAssistant} canContinue={!loading && !uploading && m.role === 'assistant' && index === active.messages.length - 1 && needsContinuation(m.content)} isTyping={m.id === typingMessageId} onTypingDone={() => setTypingMessageId((id) => id === m.id ? null : id)} />)}
                            {loading && <Typing />}
                        </div>
                    </section>
                    <div className="z-30 shrink-0 border-t border-white/10 bg-[#07080d]/90 p-3 backdrop-blur-xl">
                        <form onSubmit={(e) => { e.preventDefault(); editingMessageId ? submitEdit() : send(); }} className="mx-auto max-w-4xl rounded-[1.5rem] border border-white/10 bg-white/[.055] p-3 shadow-2xl">
                            {editingMessageId && <div className="mb-2 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-black uppercase tracking-[.18em] text-amber-100">Editing prompt</span><button type="button" onClick={cancelEdit} className="text-xs font-bold text-slate-300 hover:text-white">Cancel</button></div><textarea value={editingText} onChange={(e) => setEditingText(e.target.value)} className="min-h-20 w-full resize-none rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-200/50 focus:ring-0" /><div className="mt-2 text-xs text-slate-400">Submitting will delete newer messages and regenerate the assistant response.</div></div>}
                            {!editingMessageId && <>{attachments.length > 0 && <div className="mb-2 flex gap-2 overflow-x-auto px-2 pt-1">{attachments.map((image) => <div key={image.id} className="relative shrink-0"><img src={image.url} alt={image.name} className="size-16 rounded-2xl border border-white/10 object-cover" /><button type="button" onClick={() => setAttachments((items) => items.filter((item) => item.id !== image.id))} className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-black text-xs text-white">×</button></div>)}</div>}
                            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={attachments.length ? 'Ask about the attached image…' : 'Message Devora Studio…'} className="max-h-36 min-h-10 w-full resize-none border-0 bg-transparent px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:ring-0" /></>}
                            <div className="flex items-center justify-between px-2 pb-1"><div className="flex items-center gap-2">{!editingMessageId && supportsImages && <label title="Attach image" className="inline-grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border border-white/10 text-slate-300 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-cyan-100"><input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { uploadImages(e.target.files); e.target.value = ''; }} />{uploading ? <span className="block -translate-y-px text-base font-black leading-none">…</span> : <svg className="size-5" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 4.25v11.5M4.25 10h11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>}</label>}<span className="hidden text-xs text-slate-500 sm:inline">{editingMessageId ? 'Edit prompt · regenerate from here' : supportsImages ? 'Images supported · Enter to send' : 'Text-only model · Enter to send'}</span></div><button disabled={loading || uploading || (editingMessageId ? !editingText.trim() : (!input.trim() && attachments.length === 0))} className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950 disabled:opacity-40">{editingMessageId ? 'Update' : 'Send'}</button></div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}
