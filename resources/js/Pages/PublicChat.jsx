import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const STORE_KEY = 'devora-studio.public.sessions.v2';
const APP_VERSION = '0.1.19';
const CHANGELOG = [
    {
        version: '0.1.19',
        date: '2026-05-01',
        title: 'Improve XLSX XML extraction',
        changes: [
            'Improved the XLSX fallback parser to read workbook sheet relationships, shared strings, inline strings, booleans, and cell coordinate gaps.',
            'Restarted the local runtime with XML/SimpleXML extensions available for workbook XML parsing.',
        ],
    },
    {
        version: '0.1.18',
        date: '2026-05-01',
        title: 'Allow empty extracted file content',
        changes: [
            'Relaxed chat message validation so uploaded files with empty extracted content do not block the AI request.',
            'Added a fallback note for files that upload successfully but produce no extractable text.',
        ],
    },
    {
        version: '0.1.17',
        date: '2026-05-01',
        title: 'Prefer XLSX fallback parser',
        changes: [
            'Changed .xlsx parsing to try the unzip/XML fallback before PhpSpreadsheet so runtimes without ZipArchive can still parse basic Excel files.',
            'Restarted the local Devora Studio PHP runtime on port 8333 with zip/gd/pdo_mysql extensions installed in the container.',
        ],
    },
    {
        version: '0.1.16',
        date: '2026-05-01',
        title: 'Fix mobile file modal layout',
        changes: [
            'Improved the file intelligence modal on mobile with bottom-sheet positioning and safer viewport height.',
            'Made the modal body scroll independently while keeping header/footer visible.',
            'Stacked footer actions and scan card content on narrow screens.',
            'Reduced text sizing and spacing on mobile to prevent overflow.',
        ],
    },
    {
        version: '0.1.15',
        date: '2026-05-01',
        title: 'Clarify file prompt flow and XLSX fallback',
        changes: [
            'Added modal guidance explaining that users upload files first, then type their prompt in the chat box after the file card appears.',
            'Added an XLSX unzip fallback parser for runtimes without PHP ZipArchive.',
            'Keeps PhpSpreadsheet as the primary parser when ZipArchive is available.',
        ],
    },
    {
        version: '0.1.14',
        date: '2026-05-01',
        title: 'Highlight file scan result card',
        changes: [
            'Removed the upload count from the file modal upload button.',
            'Added a distinct Scan result section so detected file analysis is visually separated from general guidance.',
            'Increased contrast for file grade cards and grade badges.',
        ],
    },
    {
        version: '0.1.13',
        date: '2026-05-01',
        title: 'File intelligence upload guide',
        changes: [
            'Added a pre-upload file intelligence modal when users click the file button.',
            'Shows supported/less-ideal file guidance before upload.',
            'Grades selected files with a score and status such as Excellent, Good, Usable, Risky, or Unsupported.',
            'Blocks unsupported files before upload and warns when only the first 2 valid files will be attached.',
        ],
    },
    {
        version: '0.1.12',
        date: '2026-05-01',
        title: 'Backend document parsing pipeline',
        changes: [
            'Added /chat/files backend upload endpoint for file-capable models.',
            'Added Laravel parser service for PDF, Excel, CSV/TSV, and text/code files.',
            'PDF text extraction uses smalot/pdfparser; scanned PDFs return a clear OCR warning.',
            'Excel parsing uses PhpSpreadsheet with sheet and row limits for safer model context.',
            'CSV parsing uses League CSV with delimiter detection.',
            'Removed browser-side XLSX dependency and moved parsing responsibility to backend.',
        ],
    },
    {
        version: '0.1.11',
        date: '2026-05-01',
        title: 'Add Excel spreadsheet attachment support',
        changes: [
            'Added browser-side spreadsheet parsing for .xlsx, .xlsm, and .xls attachments via SheetJS.',
            'Converts up to 5 sheets and 80 rows per sheet into CSV-like text before sending to the model.',
            'Keeps the existing max 2 file attachment limit for file-capable models.',
        ],
    },
    {
        version: '0.1.10',
        date: '2026-05-01',
        title: 'Enable file attachments for file-capable models',
        changes: [
            'Added a file attachment button that appears only when the selected model has file support enabled.',
            'Limited file attachments to a maximum of 2 files per message.',
            'Sends attached text/code file content into the model request with clear File 1/File 2 labels.',
            'Added file attachment cards in the composer and user message bubbles.',
        ],
    },
    {
        version: '0.1.9',
        date: '2026-05-01',
        title: 'Refresh file capability icon',
        changes: [
            'Changed the file capability icon from a portrait document to a landscape card shape.',
            'Matched the icon proportions with the image capability icon for a more cohesive picker style.',
        ],
    },
    {
        version: '0.1.8',
        date: '2026-05-01',
        title: 'Mark unavailable models in picker',
        changes: [
            'Changed inactive model dropdown rows to show Unavailable instead of inactive.',
            'Disabled unavailable rows and added a lock icon on the right side.',
            'Hid capability chips for unavailable models to make the disabled state clearer.',
        ],
    },
    {
        version: '0.1.7',
        date: '2026-04-30',
        title: 'Fix MiniMax icon source',
        changes: [
            'Replaced MiniMax SVG icon with proper color PNG from LobeHub.',
        ],
    },
    {
        version: '0.1.6',
        date: '2026-04-30',
        title: 'Add MiniMax provider category',
        changes: [
            'Added MiniMax as a new model provider category with icon from Simple Icons.',
            'Category icon mapped to minimax.svg.',
        ],
    },
    {
        version: '0.1.5',
        date: '2026-04-30',
        title: 'Fix sidebar footer responsive layout',
        changes: [
            'Made the sidebar footer stick to the bottom consistently on desktop and mobile.',
            'Added proper scroll containment so the footer never gets pushed off-screen.',
            'Improved padding and spacing for the version label on narrow sidebars.',
        ],
    },
    {
        version: '0.1.4',
        date: '2026-04-30',
        title: 'Add Xiaomi / Mimo provider category',
        changes: [
            'Added Xiaomi / Mimo as a new model provider category.',
            'Added the Xiaomi brand icon SVG to the provider assets.',
        ],
    },
    {
        version: '0.1.3',
        date: '2026-04-30',
        title: 'Chat nav brand typography',
        changes: [
            'Updated the chat nav brand title to a compact mono uppercase style inspired by the Strait Hormuz waitlist nav.',
            'Applied wider letter spacing for a sharper brand mark feel.',
        ],
    },
    {
        version: '0.1.2',
        date: '2026-04-30',
        title: 'Welcome logo refresh',
        changes: [
            'Updated the empty-chat welcome logo with the new Devora brand image.',
            'Kept the welcome card layout compact and centered for desktop and mobile.',
        ],
    },
    {
        version: '0.1.1',
        date: '2026-04-30',
        title: 'Sidebar version label polish',
        changes: [
            'Changed the sidebar footer from a prominent Version control card to a small italic version label.',
            'Kept the changelog button available without making the sidebar feel noisy.',
        ],
    },
    {
        version: '0.1.0',
        date: '2026-04-30',
        title: 'Version control baseline',
        changes: [
            'Added sidebar version badge under chat history.',
            'Added changelog modal for release notes.',
            'Linked app version discipline to package.json and project changelog.',
        ],
    },
];
const prompts = ['Give me ideas for a productive morning', 'Summarize a topic in simple words', 'Help me write a polite message', 'Plan a simple weekend activity'];
const RECENT_CONTEXT_LIMIT = 14;
const SUMMARY_AFTER_MESSAGES = 18;
const SUMMARY_KEEP_RECENT = 8;
const MAX_HISTORY_SESSIONS = 20;
const MAX_IMAGES_PER_MESSAGE = 2;
const MAX_FILES_PER_MESSAGE = 2;
const MAX_TEXT_FILE_CHARS = 24000;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_FILE_TYPES = ['text/plain', 'text/markdown', 'application/json', 'text/csv', 'application/xml', 'text/xml', 'application/javascript', 'text/javascript', 'text/typescript', 'text/x-python', 'application/x-php'];
const TEXT_FILE_EXTENSIONS = ['txt', 'md', 'markdown', 'json', 'csv', 'xml', 'js', 'jsx', 'ts', 'tsx', 'py', 'php', 'css', 'html', 'yml', 'yaml', 'toml', 'env', 'log'];
const SPREADSHEET_EXTENSIONS = ['xlsx', 'xlsm', 'xls'];
const PDF_EXTENSIONS = ['pdf'];
const SUPPORTED_FILE_EXTENSIONS = [...TEXT_FILE_EXTENSIONS, ...SPREADSHEET_EXTENSIONS, ...PDF_EXTENSIONS, 'tsv'];

const uid = () => (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
const formatTime = (value) => new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(value ? new Date(value) : new Date());
const sessionTimestamp = (session) => new Date(session.updatedAt ?? session.createdAt ?? 0).getTime() || 0;
const newestSessions = (items = []) => [...items].sort((a, b) => sessionTimestamp(b) - sessionTimestamp(a));
const trimHistory = (items = []) => newestSessions(items.filter((session) => (session.messages?.length ?? 0) > 0)).slice(0, MAX_HISTORY_SESSIONS);

const friendlyHttpError = (status) => {
    if (status === 429) return 'Too many requests. Please wait a moment before sending another message.';
    if ([401, 403, 404, 422].includes(status)) return 'The selected AI model is temporarily unavailable. Please choose another model or try again later.';
    if (status === 408 || status === 504) return 'The selected AI model took too long to respond. Please try again, or switch to another model if this keeps happening.';
    if (status >= 500) return 'The AI provider is temporarily unavailable. Please try again in a moment or switch to another model.';
    return 'The selected AI model could not respond right now. Please try again or switch to another model.';
};


const fileExtension = (file) => file.name.split('.').pop()?.toLowerCase() || '';

const gradeFile = (file) => {
    const extension = fileExtension(file);
    const sizeMb = file.size / 1024 / 1024;
    const supported = SUPPORTED_FILE_EXTENSIONS.includes(extension) || ALLOWED_FILE_TYPES.includes(file.type);
    const warnings = [];
    let score = 95;
    let type = 'Text/code';

    if (!supported) {
        return {
            supported: false,
            score: 0,
            grade: 'Unsupported',
            tone: 'red',
            type: 'Unsupported',
            summary: 'This file type is not supported yet.',
            warnings: ['Use PDF, CSV/TSV, Excel, text, markdown, JSON, XML, code, config, or log files.'],
        };
    }

    if (SPREADSHEET_EXTENSIONS.includes(extension)) {
        type = 'Excel workbook';
        score = 88;
        warnings.push('Best when sheets have clear headers and important data is near the top.');
        warnings.push('Very complex formulas, charts, hidden sheets, or heavy formatting are simplified into table text.');
    } else if (extension === 'csv' || extension === 'tsv') {
        type = extension === 'tsv' ? 'TSV table' : 'CSV table';
        score = 96;
        warnings.push('Ideal for data analysis because rows and columns are easy to extract.');
    } else if (extension === 'pdf') {
        type = 'PDF document';
        score = 78;
        warnings.push('Best when the PDF text is selectable/copyable.');
        warnings.push('Scanned/image-only PDFs may need OCR and can return little or no text.');
    } else if (TEXT_FILE_EXTENSIONS.includes(extension) || ALLOWED_FILE_TYPES.includes(file.type)) {
        type = 'Text/code file';
        score = 92;
        warnings.push('Great for logs, configs, code review, JSON/XML, markdown, and plain documents.');
    }

    if (sizeMb > 10) {
        score = 0;
        warnings.unshift('File is above the current 10MB upload limit.');
    } else if (sizeMb > 5) {
        score -= 12;
        warnings.push('Large files may be truncated before reaching the model.');
    }

    const grade = score >= 90 ? 'Excellent' : score >= 80 ? 'Good' : score >= 65 ? 'Usable' : score > 0 ? 'Risky' : 'Unsupported';
    const tone = score >= 90 ? 'emerald' : score >= 80 ? 'cyan' : score >= 65 ? 'amber' : 'red';

    return {
        supported: score > 0,
        score,
        grade,
        tone,
        type,
        summary: `${type} · ${sizeMb < 0.1 ? `${Math.round(file.size / 1024)}KB` : `${sizeMb.toFixed(1)}MB`}`,
        warnings,
    };
};

const readJsonResponse = async (response) => {
    const text = await response.text();
    if (!text) return {};
    try { return JSON.parse(text); } catch (_) { return {}; }
};
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
    xiaomi: '/assets/models/xiaomi.svg',
    minimax: '/assets/models/minimax.png',
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
    xiaomi: 'Xiaomi / Mimo',
    minimax: 'MiniMax',
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


function VersionChangelog({ open, onClose }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="version-changelog-title">
            <button type="button" aria-label="Close changelog" className="absolute inset-0" onClick={onClose} />
            <div className="relative w-full max-w-lg overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950 shadow-2xl shadow-cyan-950/20">
                <div className="shrink-0 border-b border-white/10 bg-white/[.035] px-4 py-3 sm:px-5 sm:py-4">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div>
                            <div className="text-[11px] font-black uppercase tracking-[.24em] text-cyan-200">Release notes</div>
                            <h2 id="version-changelog-title" className="mt-1 text-lg font-black tracking-[-.04em] text-white sm:text-xl">Devora Studio v{APP_VERSION}</h2>
                        </div>
                        <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-xl border border-white/10 text-slate-300 transition hover:bg-white/[.07] hover:text-white">×</button>
                    </div>
                </div>
                <div className="max-h-[62vh] overflow-y-auto p-5">
                    {CHANGELOG.map((release) => (
                        <article key={release.version} className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-cyan-300 px-2.5 py-1 text-[11px] font-black text-slate-950">v{release.version}</span>
                                <span className="text-xs font-bold text-slate-500">{release.date}</span>
                            </div>
                            <h3 className="mt-3 text-sm font-black text-white">{release.title}</h3>
                            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                                {release.changes.map((change) => <li key={change} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-cyan-200" /> <span>{change}</span></li>)}
                            </ul>
                        </article>
                    ))}
                </div>
            </div>
        </div>
    );
}

function SidebarFooter({ onOpenChangelog }) {
    return (
        <div className="shrink-0">
            <div className="rounded-2xl border border-white/10 bg-white/[.025] px-4 py-3 text-[11px] leading-5 text-slate-500">
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <div>Designed by Deylnn Assistant</div>
                        <div>Built by <a href="https://dkzhen.org" target="_blank" rel="noreferrer noopener" className="font-bold text-cyan-200 hover:text-cyan-100">Zhen</a></div>
                    </div>
                    <span className="text-[10px] italic text-slate-500">v{APP_VERSION}</span>
                </div>
                <div className="mt-2 border-t border-white/10 pt-2">
                    <button type="button" onClick={onOpenChangelog} className="text-[10px] font-bold text-cyan-200/80 transition hover:text-cyan-100">Changelog</button>
                </div>
            </div>
        </div>
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
                <rect x="4" y="6" width="16" height="12" rx="2.5" stroke="currentColor" strokeWidth="2" />
                <path d="M7.5 9.5h9M7.5 12h6M7.5 14.5h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M16.5 14.5h.01" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
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
                {models.map((model) => {
                    const unavailable = !model.is_active;

                    return <button key={model.id} type="button" disabled={unavailable} aria-disabled={unavailable} title={unavailable ? 'This model is unavailable' : model.display_name} onClick={() => { if (unavailable) return; onChange(model.id); setOpen(false); }} className={`mr-1 flex w-[calc(100%-0.25rem)] items-center gap-3 rounded-xl px-3 py-2 text-left transition ${unavailable ? 'cursor-not-allowed opacity-55 grayscale' : String(model.id) === String(value) ? 'bg-cyan-300/10' : 'hover:bg-white/[.055]'}`}>
                        <ModelIcon model={model} />
                        <span className="min-w-0 flex-1">
                            <span className="flex min-w-0 items-center gap-1.5"><span className={`block truncate text-sm font-black ${unavailable ? 'text-slate-500' : 'text-white'}`}>{model.display_name}</span>{model.is_latest && model.is_active && <span className="shrink-0 rounded-full bg-orange-500 px-1.5 py-[1px] text-[8px] font-black leading-none tracking-[.08em] text-white shadow-[0_0_14px_rgba(249,115,22,.28)]">NEW</span>}</span>
                            <span className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-slate-500"><span>{unavailable ? 'Unavailable' : modelCategoryLabel(model)}</span>{!unavailable && <CapabilityIcons model={model} compact />}</span>
                        </span>
                        {unavailable && <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full border border-slate-600/50 bg-slate-800/70 text-slate-400">
                            <svg className="size-3.5" viewBox="0 0 20 20" fill="none"><path d="M5.75 8.5V6.75a4.25 4.25 0 0 1 8.5 0V8.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M4.75 8.5h10.5A1.75 1.75 0 0 1 17 10.25v5A1.75 1.75 0 0 1 15.25 17H4.75A1.75 1.75 0 0 1 3 15.25v-5A1.75 1.75 0 0 1 4.75 8.5Z" stroke="currentColor" strokeWidth="1.7"/><path d="M10 12v1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                        </span>}
                    </button>;
                })}
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



function FileGuideModal({ open, files = [], onClose, onConfirm }) {
    if (!open) return null;

    const grades = files.map((file) => ({ file, ...gradeFile(file) }));
    const accepted = grades.filter((item) => item.supported).slice(0, MAX_FILES_PER_MESSAGE);
    const blocked = grades.filter((item) => !item.supported);
    const canUpload = accepted.length > 0;

    const toneClass = {
        emerald: 'border-emerald-300/45 bg-emerald-400/15 text-emerald-100 shadow-[0_0_28px_rgba(16,185,129,.12)]',
        cyan: 'border-cyan-300/45 bg-cyan-400/15 text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,.12)]',
        amber: 'border-amber-300/45 bg-amber-400/15 text-amber-100 shadow-[0_0_28px_rgba(251,191,36,.12)]',
        red: 'border-red-300/45 bg-red-400/15 text-red-100 shadow-[0_0_28px_rgba(248,113,113,.12)]',
    };

    const badgeClass = {
        emerald: 'bg-emerald-300 text-emerald-950',
        cyan: 'bg-cyan-300 text-cyan-950',
        amber: 'bg-amber-300 text-amber-950',
        red: 'bg-red-300 text-red-950',
    };

    return (
        <div className="fixed inset-0 z-[80] grid place-items-end bg-black/70 p-2 backdrop-blur-sm sm:place-items-center sm:px-4" role="dialog" aria-modal="true" aria-labelledby="file-guide-title">
            <button type="button" aria-label="Close file guide" className="absolute inset-0" onClick={onClose} />
            <div className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-[1.4rem] border border-white/10 bg-slate-950 shadow-2xl shadow-violet-950/25 sm:max-h-[86vh] sm:rounded-[1.75rem]">
                <div className="shrink-0 border-b border-white/10 bg-white/[.035] px-4 py-3 sm:px-5 sm:py-4">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div>
                            <div className="text-[11px] font-black uppercase tracking-[.24em] text-violet-200">File intelligence check</div>
                            <h2 id="file-guide-title" className="mt-1 text-lg font-black tracking-[-.04em] text-white sm:text-xl">Will this file analyze well?</h2>
                            <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">Devora checks the file type before upload so users understand what works best.</p><p className="mt-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-[11px] font-bold leading-5 text-cyan-100 sm:text-xs">Upload the file here first, then write your prompt in the chat box below after the file card appears.</p>
                        </div>
                        <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-xl border border-white/10 text-slate-300 transition hover:bg-white/[.07] hover:text-white">×</button>
                    </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
                    <div className="grid gap-2 sm:grid-cols-2">
                        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-3">
                            <div className="text-xs font-black uppercase tracking-[.16em] text-emerald-100">Best files</div>
                            <div className="mt-2 text-xs leading-5 text-emerald-50/85 sm:text-sm">CSV/TSV, clean Excel sheets, selectable-text PDFs, logs, code, JSON, markdown.</div>
                        </div>
                        <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-3">
                            <div className="text-xs font-black uppercase tracking-[.16em] text-amber-100">Less ideal</div>
                            <div className="mt-2 text-xs leading-5 text-amber-50/85 sm:text-sm">Scanned PDFs, huge spreadsheets, complex formulas/charts, image-only documents.</div>
                        </div>
                    </div>

                    <div className="mt-4 sm:mt-5">
                        <div className="mb-2 flex items-center gap-2">
                            <span className="grid size-6 place-items-center rounded-full bg-violet-300 text-xs font-black text-violet-950">✓</span>
                            <div className="text-xs font-black uppercase tracking-[.2em] text-white">Scan result</div>
                        </div>
                        <div className="space-y-2 rounded-3xl border border-violet-300/25 bg-violet-300/[.055] p-2">
                            {grades.map((item, index) => (
                                <div key={`${item.file.name}-${index}`} className={`rounded-2xl border p-3 ${toneClass[item.tone] ?? toneClass.red}`}>
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                                        <div className="min-w-0">
                                            <div className="mb-1 inline-flex rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-black uppercase tracking-[.16em] text-white/75">Detected file</div>
                                            <div className="break-all text-sm font-black text-white sm:truncate">{item.file.name}</div>
                                            <div className="mt-1 text-xs opacity-80">{item.summary}</div>
                                        </div>
                                        <div className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${badgeClass[item.tone] ?? badgeClass.red}`}>{item.grade} · {item.score}/100</div>
                                    </div>
                                    <ul className="mt-2 space-y-1 text-xs opacity-90">
                                        {item.warnings.map((warning) => <li key={warning}>- {warning}</li>)}
                                        {index >= MAX_FILES_PER_MESSAGE && <li>- Only the first {MAX_FILES_PER_MESSAGE} valid files will be attached.</li>}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>

                    {blocked.length > 0 && <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-100">
                        {blocked.length} unsupported file{blocked.length > 1 ? 's' : ''} will not be uploaded.
                    </div>}
                </div>

                <div className="shrink-0 space-y-3 border-t border-white/10 bg-white/[.03] px-4 py-3 sm:flex sm:items-center sm:justify-between sm:gap-3 sm:space-y-0 sm:px-5 sm:py-4">
                    <div className="text-[11px] leading-5 text-slate-500 sm:text-xs">Upload first, then ask in the prompt box · Max {MAX_FILES_PER_MESSAGE} files · PDF max 10 pages · Excel max 5 sheets / 80 rows.</div>
                    <div className="flex gap-2">
                        <button type="button" onClick={onClose} className="flex-1 rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/[.06] hover:text-white sm:flex-none">Cancel</button>
                        <button type="button" disabled={!canUpload} onClick={() => onConfirm(accepted.map((item) => item.file))} className="flex-1 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none">Upload</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MessageImages({ images = [], compact = false }) {
    const [broken, setBroken] = useState({});
    if (!images.length) return null;

    return (
        <div className={`mb-2 grid gap-2 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} ${compact ? 'max-w-xs' : 'max-w-sm'}`}>
            {images.map((image, index) => {
                const failed = broken[image.id ?? image.path ?? index];
                return (
                    <div key={image.id ?? image.path ?? index} className={`relative overflow-hidden rounded-2xl border ${failed ? 'border-red-300/25 bg-red-950/30' : 'border-white/20 bg-black/15'} ${images.length === 1 ? 'max-h-72' : 'aspect-square'}`}>
                        {!failed && image.url ? <img src={image.url} alt={image.name ?? 'Attached image'} onError={() => setBroken((items) => ({ ...items, [image.id ?? image.path ?? index]: true }))} className={`h-full w-full object-cover ${images.length === 1 ? 'max-h-72' : ''}`} /> : (
                            <div className="grid min-h-28 place-items-center p-4 text-center text-xs leading-5">
                                <div>
                                    <div className="mx-auto mb-2 grid size-9 place-items-center rounded-xl bg-red-300/10 text-red-100">!</div>
                                    <div className="font-black text-red-100">Image unavailable</div>
                                    <div className="mt-1 text-red-100/65">File was deleted, expired, or failed to load.</div>
                                </div>
                            </div>
                        )}
                        {!failed && image.name && <div className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-2 py-1 text-[10px] text-white/80 backdrop-blur-sm">{image.name}</div>}
                    </div>
                );
            })}
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


function MessageFiles({ files = [] }) {
    if (!files.length) return null;

    return (
        <div className="mb-2 grid max-w-sm gap-2">
            {files.map((file, index) => (
                <div key={file.id ?? file.name ?? index} className="flex items-center gap-2 rounded-2xl border border-violet-300/25 bg-violet-400/10 px-3 py-2 text-left text-violet-50">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-violet-200/20 bg-violet-300/10">
                        <svg className="size-5" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="3.5" y="5" width="13" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M6.25 8h7.5M6.25 10.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                    </span>
                    <span className="min-w-0">
                        <span className="block truncate text-xs font-black">{file.name ?? 'Attached file'}</span>
                        <span className="block text-[10px] text-violet-100/60">File {index + 1}</span>
                    </span>
                </div>
            ))}
        </div>
    );
}

function Message({ message, onEdit, onContinue, canContinue = false, isTyping = false, onTypingDone }) {
    const isUser = message.role === 'user';
    return (
        <div className={`group flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && <div className="mt-1 hidden size-8 shrink-0 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 sm:grid"><ModelIcon model={message.model} /></div>}
            <div className={`${isUser ? 'max-w-[88%] rounded-[1.35rem] bg-cyan-300 px-3 py-2.5 text-slate-950 sm:max-w-[76%] sm:px-4 sm:py-3' : 'max-w-[96%] rounded-[1.35rem] border border-white/10 bg-white/[.055] px-3 py-2.5 text-slate-100 shadow-xl sm:max-w-[82%] sm:px-4 sm:py-3'} text-sm leading-6`}>
                {isUser ? <><MessageImages images={message.images ?? []} /><MessageFiles files={message.files ?? []} /><div className="whitespace-pre-wrap">{message.content}</div>{((message.images?.length ?? 0) > 0 || (message.files?.length ?? 0) > 0) && <div className="mt-2 text-right text-[10px] font-bold uppercase tracking-[.12em] text-slate-800/55">{[message.images?.length ? `${message.images.length} image${message.images.length > 1 ? 's' : ''}` : null, message.files?.length ? `${message.files.length} file${message.files.length > 1 ? 's' : ''}` : null].filter(Boolean).join(' · ')} attached</div>}</> : <>{isTyping ? <TypewriterText text={message.content} onDone={onTypingDone} /> : <Markdown>{message.content}</Markdown>}{canContinue && <button type="button" onClick={() => onContinue?.()} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-black text-cyan-100 transition hover:border-cyan-200/40 hover:bg-cyan-300/15">Continue</button>}<div className="mt-3 border-t border-white/10 pt-2 text-right text-[11px] italic text-slate-500">{message.model_name ? `${message.model_name} · ` : ''}{formatTime(message.created_at ?? message.createdAt)}</div></>}
            </div>
        </div>
    );
}

const loadingPhases = [
    { after: 0, messages: ['Thinking', 'Reading your prompt', 'Getting started', 'Looking at the context'] },
    { after: 3000, messages: ['Understanding the request', 'Checking the best angle', 'Mapping out the answer', 'Reviewing the conversation'] },
    { after: 8000, messages: ['Drafting the response', 'Organizing the answer', 'Putting the details together', 'Writing it cleanly'] },
    { after: 15000, messages: ['The model is taking a little longer', 'Still working on it', 'This response needs a bit more time', 'The provider is processing the request'] },
    { after: 25000, messages: ['Still waiting for the provider', 'Almost there', 'Preparing the final response', 'Thanks for waiting — still working'] },
    { after: 36000, messages: ['This model is slower than usual', 'Keeping the request alive', 'Waiting on the model to finish', 'You can wait or switch models if this takes too long'] },
];

const pickLoadingMessage = (messages, previous) => {
    if (messages.length <= 1) return messages[0] ?? 'Thinking';
    const options = messages.filter((message) => message !== previous);
    return options[Math.floor(Math.random() * options.length)] ?? messages[0];
};

function Typing() {
    const [phaseIndex, setPhaseIndex] = useState(0);
    const [message, setMessage] = useState(() => pickLoadingMessage(loadingPhases[0].messages));

    useEffect(() => {
        const timers = loadingPhases.slice(1).map((phase, index) => setTimeout(() => {
            setPhaseIndex(index + 1);
            setMessage((previous) => pickLoadingMessage(phase.messages, previous));
        }, phase.after));

        return () => timers.forEach(clearTimeout);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const phase = loadingPhases[phaseIndex] ?? loadingPhases[loadingPhases.length - 1];
            setMessage((previous) => pickLoadingMessage(phase.messages, previous));
        }, phaseIndex >= 3 ? 5200 : 4200);

        return () => clearInterval(interval);
    }, [phaseIndex]);

    return <div className="flex gap-2 sm:gap-3"><div className="hidden size-8 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 sm:grid"><ModelIcon model={null} /></div><div className="rounded-[1.35rem] border border-white/10 bg-white/[.055] px-3 py-2.5 text-sm text-slate-300 sm:px-4 sm:py-3"><span className="transition-all duration-300">{message}</span><span className="inline-flex gap-1 pl-2"><i className="size-1.5 animate-bounce rounded-full bg-cyan-200 [animation-delay:-.2s]"/><i className="size-1.5 animate-bounce rounded-full bg-cyan-200 [animation-delay:-.1s]"/><i className="size-1.5 animate-bounce rounded-full bg-cyan-200"/></span></div></div>;
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
    const [changelogOpen, setChangelogOpen] = useState(false);
    const [fileGuideOpen, setFileGuideOpen] = useState(false);
    const [pendingFiles, setPendingFiles] = useState([]);
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
    const supportsFiles = Boolean(activeModel?.supports_files);

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

    const readFiles = async (files) => {
        if (!supportsFiles) return;
        const selected = Array.from(files || []).slice(0, Math.max(0, MAX_FILES_PER_MESSAGE - attachments.filter((item) => item.kind === 'file').length));
        if (!selected.length) return;
        setUploading(true);
        try {
            const uploaded = [];
            for (const file of selected) {
                const form = new FormData();
                form.append('file', file);
                const res = await fetch('/chat/files', { method: 'POST', credentials: 'same-origin', headers: { 'X-CSRF-TOKEN': csrf(), 'X-XSRF-TOKEN': xsrfCookie(), Accept: 'application/json' }, body: form });
                const data = await readJsonResponse(res);
                if (!res.ok) throw new Error(data.message || 'File upload failed.');
                uploaded.push(data);
            }
            setAttachments((items) => [...items, ...uploaded].filter((item) => item.kind !== 'file').concat([...items.filter((item) => item.kind === 'file'), ...uploaded].slice(0, MAX_FILES_PER_MESSAGE)));
        } catch (e) {
            setSessions((items) => items.map((s) => s.id === active?.id ? { ...s, messages: [...s.messages, { id: uid(), role: 'assistant', content: `File upload error: ${e.message}`, createdAt: new Date().toISOString() }], updatedAt: new Date().toISOString() } : s));
        } finally {
            setUploading(false);
        }
    };

    const uploadImages = async (files) => {
        if (!supportsImages) return;
        const selected = Array.from(files || []).filter((file) => ALLOWED_IMAGE_TYPES.includes(file.type)).slice(0, Math.max(0, MAX_IMAGES_PER_MESSAGE - attachments.length));
        if (!selected.length) return;
        setUploading(true);
        try {
            const uploaded = [];
            for (const file of selected) {
                const form = new FormData();
                form.append('image', file);
                const res = await fetch('/chat/images', { method: 'POST', credentials: 'same-origin', headers: { 'X-CSRF-TOKEN': csrf(), 'X-XSRF-TOKEN': xsrfCookie(), Accept: 'application/json' }, body: form });
                const data = await readJsonResponse(res);
                if (!res.ok) throw new Error(data.message || 'Image upload failed.');
                uploaded.push(data);
            }
            setAttachments((items) => [...items, ...uploaded].slice(0, MAX_IMAGES_PER_MESSAGE));
        } catch (e) {
            setSessions((items) => items.map((s) => s.id === active?.id ? { ...s, messages: [...s.messages, { id: uid(), role: 'assistant', content: `Image upload error: ${e.message}`, createdAt: new Date().toISOString() }], updatedAt: new Date().toISOString() } : s));
        } finally {
            setUploading(false);
        }
    };

    const buildContextMessages = (session, nextMessages) => {
        const recent = nextMessages.slice(-RECENT_CONTEXT_LIMIT).map(({ role, content, images, files }) => ({ role, content, images: images ?? [], files: files ?? [] }));
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
        const chunk = messages.slice(summarizedUntil, cutoff).filter((message) => !message.images?.length && !message.files?.length);
        if (chunk.length < 6) return;
        try {
            const res = await fetch('/chat/summarize', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf(), 'X-XSRF-TOKEN': xsrfCookie(), Accept: 'application/json' },
                body: JSON.stringify({ model_id: modelId, existing_summary: session.summary ?? '', messages: chunk.map(({ role, content }) => ({ role, content })), website: '' }),
            });
            const data = await readJsonResponse(res);
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
            const data = await readJsonResponse(res);
            const assistant = res.ok ? data.message : { id: uid(), role: 'assistant', content: data.message || friendlyHttpError(res.status), createdAt: new Date().toISOString() };
            const fullMessages = [...nextMessages, assistant];
            patchActive((s) => ({ ...s, messages: fullMessages }));
            if (assistant.role === 'assistant') setTypingMessageId(assistant.id);
            await maybeSummarize(active, fullMessages);
        } catch (e) {
            patchActive((s) => ({ ...s, messages: [...s.messages, { id: uid(), role: 'assistant', content: e.message?.startsWith('Too many') ? e.message : `Network error: ${e.message}`, createdAt: new Date().toISOString() }] }));
        } finally { setLoading(false); }
    };

    const send = async (text = input) => {
        const imageAttachments = attachments.filter((item) => item.kind !== 'file');
        const fileAttachments = attachments.filter((item) => item.kind === 'file');
        const content = text.trim() || (imageAttachments.length ? 'Please analyze the attached image.' : fileAttachments.length ? 'Please analyze the attached file.' : '');
        if ((!content && attachments.length === 0) || !active || loading || uploading) return;
        const userMessage = { id: uid(), role: 'user', content, images: imageAttachments, files: fileAttachments, createdAt: new Date().toISOString() };
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
        if ((original.images?.length ?? 0) > 0 || (original.files?.length ?? 0) > 0) return;
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
            <VersionChangelog open={changelogOpen} onClose={() => setChangelogOpen(false)} />
            <FileGuideModal open={fileGuideOpen} files={pendingFiles} onClose={() => { setFileGuideOpen(false); setPendingFiles([]); }} onConfirm={(files) => { setFileGuideOpen(false); setPendingFiles([]); readFiles(files); }} />
            <div className="relative grid h-[100dvh] overflow-hidden grid-cols-1 md:grid-cols-[280px_1fr]">
                {mobileSidebarOpen && <div className="fixed inset-0 z-50 md:hidden">
                    <button aria-label="Close sidebar" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
                    <aside className="absolute inset-y-0 left-0 flex w-[84vw] max-w-[320px] flex-col border-r border-white/10 bg-slate-950/95 p-3 shadow-2xl">
                        <div className="mb-3 flex items-center justify-between px-1">
                            <div><div className="text-sm font-black">History</div><div className="text-[11px] leading-5 text-slate-500 sm:text-xs">Local sessions</div></div>
                            <button onClick={() => setMobileSidebarOpen(false)} className="grid size-9 place-items-center rounded-xl border border-white/10 text-slate-300">✕</button>
                        </div>
                        <button onClick={newChat} className="mb-3 rounded-2xl border border-white/10 bg-white/[.055] px-4 py-3 text-left text-sm font-black hover:border-cyan-300/30 hover:bg-cyan-300/10">+ New chat</button>
                        <div className="scrollbar-none min-h-0 flex-1 space-y-1 overflow-y-auto">
                            {sessions.map((s) => <div key={s.id} className={`group flex items-center rounded-xl ${s.id === active?.id ? 'bg-white/[.09]' : 'hover:bg-white/[.045]'}`}><button onClick={() => { setActiveId(s.id); setMobileSidebarOpen(false); }} className={`min-w-0 flex-1 truncate px-3 py-2 text-left text-sm ${s.id === active?.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{s.title}{s.summary && <span className="ml-2 text-[10px] text-cyan-300/70">memory</span>}</button><button onClick={() => deleteSession(s.id)} className="mr-1 grid size-8 place-items-center rounded-lg text-slate-500 opacity-70 hover:bg-red-400/10 hover:text-red-200">×</button></div>)}
                        </div>
                        <SidebarFooter onOpenChangelog={() => setChangelogOpen(true)} />
                    </aside>
                </div>}
                <aside className="hidden h-screen border-r border-white/10 bg-black/30 p-3 backdrop-blur-xl md:flex md:flex-col">
                    <button onClick={newChat} className="mb-3 rounded-2xl border border-white/10 bg-white/[.055] px-4 py-3 text-left text-sm font-black hover:border-cyan-300/30 hover:bg-cyan-300/10">+ New chat</button>
                    <div className="scrollbar-none min-h-0 flex-1 space-y-1 overflow-y-auto">
                        {sessions.map((s) => <div key={s.id} className={`group flex items-center rounded-xl ${s.id === active?.id ? 'bg-white/[.09]' : 'hover:bg-white/[.045]'}`}><button onClick={() => setActiveId(s.id)} className={`min-w-0 flex-1 truncate px-3 py-2 text-left text-sm ${s.id === active?.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{s.title}{s.summary && <span className="ml-2 text-[10px] text-cyan-300/70">memory</span>}</button><button onClick={() => deleteSession(s.id)} className="mr-1 grid size-8 place-items-center rounded-lg text-slate-500 opacity-0 transition group-hover:opacity-100 hover:bg-red-400/10 hover:text-red-200">×</button></div>)}
                    </div>
                    <SidebarFooter onOpenChangelog={() => setChangelogOpen(true)} />
                </aside>
                <main className="flex h-[100dvh] min-h-0 min-w-0 flex-col overflow-hidden">
                    <nav className="relative z-40 flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-[#07080d]/95 px-4 shadow-lg shadow-black/20 backdrop-blur-xl">
                        <div className="flex items-center gap-3"><button onClick={() => setMobileSidebarOpen(true)} className="grid size-10 place-items-center rounded-xl border border-white/10 text-slate-200 md:hidden" aria-label="Open history"><span className="space-y-1.5"><i className="block h-0.5 w-5 rounded-full bg-current"/><i className="block h-0.5 w-5 rounded-full bg-current"/><i className="block h-0.5 w-5 rounded-full bg-current"/></span></button><div className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-white">Devora Studio</div></div>
                        <ModelPicker models={models} value={modelId} onChange={(id) => { setModelId(id); const next = models.find((m) => Number(m.id) === Number(id)); if (!next?.supports_vision && !next?.supports_files) setAttachments([]); else setAttachments((items) => items.filter((item) => item.kind === 'file' ? next?.supports_files : next?.supports_vision)); }} />
                    </nav>
                    <section ref={viewport} className="scrollbar-none min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                        <div className="mx-auto flex min-h-full max-w-4xl flex-col gap-4 px-1 pb-6 sm:gap-5 sm:px-0">
                            {(active?.messages?.length ?? 0) === 0 && <div className="flex flex-1 items-center justify-center text-center"><div className="w-full py-6"><div className="mx-auto mb-4 grid size-16 place-items-center overflow-hidden rounded-[1.35rem] border border-cyan-300/20 bg-white shadow-2xl shadow-cyan-950/20"><img src="/assets/devora-welcome-logo.jpg" alt="Devora Studio" className="size-full object-cover" /></div><h1 className="text-3xl font-black tracking-[-.06em] sm:text-4xl">What can I help with?</h1><p className="mt-2 text-sm text-slate-400">Devora Studio keeps your sessions in this browser · {active?.summary ? 'summary memory on' : 'local memory'}</p><div className="mx-auto mt-6 grid max-w-2xl gap-2 sm:grid-cols-2">{prompts.map((p) => <button key={p} onClick={() => send(p)} className="rounded-2xl border border-white/10 bg-white/[.04] p-3 text-left text-sm text-slate-300 hover:border-cyan-300/30 hover:bg-cyan-300/10">{p}</button>)}</div></div></div>}
                            {active?.messages?.map((m, index) => <Message key={m.id} message={m} onEdit={startEdit} onContinue={continueAssistant} canContinue={!loading && !uploading && m.role === 'assistant' && index === active.messages.length - 1 && needsContinuation(m.content)} isTyping={m.id === typingMessageId} onTypingDone={() => setTypingMessageId((id) => id === m.id ? null : id)} />)}
                            {loading && <Typing />}
                        </div>
                    </section>
                    <div className="z-30 shrink-0 border-t border-white/10 bg-[#07080d]/90 p-3 backdrop-blur-xl">
                        <form onSubmit={(e) => { e.preventDefault(); editingMessageId ? submitEdit() : send(); }} className="mx-auto max-w-4xl rounded-[1.5rem] border border-white/10 bg-white/[.055] p-3 shadow-2xl">
                            {editingMessageId && <div className="mb-2 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-black uppercase tracking-[.18em] text-amber-100">Editing prompt</span><button type="button" onClick={cancelEdit} className="text-xs font-bold text-slate-300 hover:text-white">Cancel</button></div><textarea value={editingText} onChange={(e) => setEditingText(e.target.value)} className="min-h-20 w-full resize-none rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-200/50 focus:ring-0" /><div className="mt-2 text-xs text-slate-400">Submitting will delete newer messages and regenerate the assistant response.</div></div>}
                            {!editingMessageId && <>{attachments.length > 0 && <div className="mb-2 flex gap-2 overflow-x-auto px-2 pt-1">{attachments.map((item) => <div key={item.id} className="relative shrink-0">{item.kind === 'file' ? <div className="grid size-16 place-items-center rounded-2xl border border-violet-300/25 bg-violet-400/10 px-2 text-center text-[9px] font-bold text-violet-100"><span className="line-clamp-2 break-all">{item.name}</span></div> : <img src={item.url} alt={item.name} className="size-16 rounded-2xl border border-white/10 object-cover" />}<button type="button" onClick={() => setAttachments((items) => items.filter((entry) => entry.id !== item.id))} className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-black text-xs text-white">×</button></div>)}</div>}
                            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={attachments.length ? 'Ask about the attachment…' : 'Message Devora Studio…'} className="max-h-36 min-h-10 w-full resize-none border-0 bg-transparent px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:ring-0" /></>}
                            <div className="flex items-center justify-between px-2 pb-1"><div className="flex items-center gap-2">{!editingMessageId && supportsImages && <label title="Attach image" className="inline-grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border border-white/10 text-slate-300 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-cyan-100"><input type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" multiple className="hidden" onChange={(e) => { uploadImages(e.target.files); e.target.value = ''; }} />{uploading ? <span className="block -translate-y-px text-base font-black leading-none">…</span> : <svg className="size-5" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 4.25v11.5M4.25 10h11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>}</label>}{!editingMessageId && supportsFiles && <label title="Attach file" className="inline-grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border border-white/10 text-slate-300 transition hover:border-violet-300/30 hover:bg-violet-300/10 hover:text-violet-100"><input type="file" accept=".txt,.md,.markdown,.json,.csv,.xml,.js,.jsx,.ts,.tsx,.py,.php,.css,.html,.yml,.yaml,.toml,.env,.log,.xlsx,.xlsm,.xls,text/*,application/json,application/xml,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" multiple className="hidden" onChange={(e) => { const selected = Array.from(e.target.files || []); setPendingFiles(selected); setFileGuideOpen(true); e.target.value = ''; }} /><svg className="size-5" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="3.5" y="5" width="13" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M6.25 8h7.5M6.25 10.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg></label>}<span className="hidden text-xs text-slate-500 sm:inline">{editingMessageId ? 'Edit prompt · regenerate from here' : supportsImages && supportsFiles ? 'Images/files supported · Enter to send' : supportsImages ? 'Images supported · Enter to send' : supportsFiles ? 'Files supported · Enter to send' : 'Text-only model · Enter to send'}</span></div><button disabled={loading || uploading || (editingMessageId ? !editingText.trim() : (!input.trim() && attachments.length === 0))} className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950 disabled:opacity-40">{editingMessageId ? 'Update' : 'Send'}</button></div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}
