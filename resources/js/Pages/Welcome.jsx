import { Head, Link } from '@inertiajs/react';

const stats = [
    ['Multi-provider', 'one clean chat interface'],
    ['Flagship + OSS', 'try different model families'],
    ['No setup needed', 'open /chat and start testing'],
];

const modelCards = [
    ['GPT', 'OpenAI-style flagship reasoning', '/assets/models/openai.svg', 'dark'],
    ['Claude', 'long-form writing and analysis', '/assets/models/claude.png', 'dark'],
    ['Gemini', 'general multimodal assistant', '/assets/models/gemini.png', 'dark'],
    ['Qwen', 'open model family for coding/reasoning', '/assets/models/qwen.png', 'dark'],
    ['Kimi', 'long context and research drafts', '/assets/models/kimi.png', 'dark'],
    ['DeepSeek', 'efficient reasoning and technical work', '/assets/models/deepseek.png', 'dark'],
    ['Grok', 'fast conversational style', '/assets/models/grok.png', 'light'],
    ['Mistral', 'open-weight European model family', '/assets/models/mistral.png', 'dark'],
    ['Z.ai', 'GLM/Z.ai model family', '/assets/models/zai.png', 'dark'],
];

const useCases = [
    ['Compare answers', 'Send the same prompt to different models and see which response style fits best.'],
    ['Daily assistant', 'Draft messages, summarize topics, plan tasks, brainstorm ideas, and refine text.'],
    ['Vision testing', 'Use image-capable models when enabled and keep text-only models clean.'],
    ['Admin control', 'Manage providers, active models, default model, categories, and encrypted API keys.'],
];

export default function Welcome({ auth }) {
    const chatHref = route('public.chat');

    return (
        <>
            <Head title="Devora Studio" />
            <main className="min-h-screen overflow-hidden bg-[#07080d] text-white selection:bg-cyan-300 selection:text-slate-950">
                <div className="fixed inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(34,211,238,.22),transparent_30%),radial-gradient(circle_at_82%_0%,rgba(168,85,247,.20),transparent_30%),linear-gradient(135deg,rgba(255,255,255,.055),transparent_35%)]" />
                <div className="fixed left-1/2 top-0 h-[620px] w-[620px] -translate-x-1/2 rounded-full border border-white/10 bg-white/[.02] blur-3xl sm:h-[760px] sm:w-[760px]" />

                <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                    <nav className="flex items-center justify-center sm:justify-start">
                        <div className="flex items-center gap-3">
                            <div className="grid size-10 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 shadow-[0_0_40px_rgba(34,211,238,.18)]">
                                <span className="text-lg font-black text-cyan-200">D</span>
                            </div>
                            <div>
                                <div className="text-sm font-black tracking-[.3em] text-white/85">DEVORA STUDIO</div>
                                <div className="text-xs text-white/40">Multi-model AI playground</div>
                            </div>
                        </div>
                    </nav>

                    <section className="grid flex-1 items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.04fr_.96fr] lg:gap-12">
                        <div className="text-center lg:text-left">
                            <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold text-cyan-100 backdrop-blur sm:text-xs">
                                Open-source model playground
                            </div>
                            <h1 className="mx-auto max-w-5xl text-4xl font-black leading-[.98] tracking-[-.06em] text-white sm:text-6xl lg:mx-0 lg:text-8xl">
                                Try leading AI models in one studio.
                            </h1>
                            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8 lg:mx-0">
                                Devora Studio brings together flagship and open-source model families from multiple providers, so you can compare responses, switch models, and test ideas directly from a single clean chat interface.
                            </p>
                            <div className="mt-8 flex justify-center lg:justify-center">
                                <Link href={chatHref} className="rounded-full bg-cyan-300 px-8 py-3 font-black text-slate-950 shadow-[0_0_60px_rgba(34,211,238,.28)] transition hover:scale-[1.02] hover:bg-cyan-200">Start chatting</Link>
                            </div>
                            <div className="mt-10 grid gap-3 sm:grid-cols-3">
                                {stats.map(([title, desc]) => (
                                    <div key={title} className="rounded-3xl border border-white/10 bg-white/[.04] p-5 text-left backdrop-blur">
                                        <div className="text-sm font-black text-white">{title}</div>
                                        <div className="mt-1 text-xs leading-5 text-slate-400">{desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
                            <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-cyan-300/20 via-fuchsia-500/10 to-transparent blur-2xl sm:-inset-6" />
                            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/80 shadow-2xl backdrop-blur sm:rounded-[2rem]">
                                <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-5">
                                    <div className="flex gap-2"><span className="size-3 rounded-full bg-red-400"/><span className="size-3 rounded-full bg-yellow-300"/><span className="size-3 rounded-full bg-green-300"/></div>
                                    <div className="text-[11px] text-white/35 sm:text-xs">/chat · model switcher</div>
                                </div>
                                <div className="space-y-5 p-4 sm:p-5">
                                    <div className="rounded-3xl bg-white/[.06] p-4 text-sm text-slate-200">Which model is better for summarizing product ideas?</div>
                                    <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5 sm:ml-8">
                                        <div className="mb-3 text-xs font-black uppercase tracking-[.2em] text-cyan-200">Devora Studio</div>
                                        <div className="space-y-3 text-sm leading-6 text-slate-200">
                                            <p>Pick a model family, send the same prompt, then compare tone, reasoning, speed, and output style.</p>
                                            <p>Use it for writing, research drafts, image-capable models, planning, and everyday AI experiments.</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                        {modelCards.slice(0, 6).map(([name, , icon, tone]) => <div key={name} className="rounded-2xl border border-white/10 bg-white/[.04] p-3 text-center"><span className={`mx-auto grid size-8 place-items-center rounded-xl ${tone === 'light' ? 'bg-white' : 'bg-transparent'}`}><img src={icon} alt="" className="size-6 object-contain"/></span><div className="mt-2 truncate text-[11px] font-bold text-white/65">{name}</div></div>)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="pb-16" id="models">
                        <div className="mb-6 flex flex-col gap-2 text-center sm:mb-8 lg:text-left">
                            <p className="text-xs font-black uppercase tracking-[.28em] text-cyan-200/70">Model families</p>
                            <h2 className="text-3xl font-black tracking-[-.05em] text-white sm:text-4xl">A curated model shelf, not a random list.</h2>
                            <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-400 lg:mx-0">Devora Studio keeps different model families visible, including inactive models in admin as disabled options, so testing stays transparent.</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {modelCards.map(([name, desc, icon, tone]) => (
                                <div key={name} className="group rounded-[1.5rem] border border-white/10 bg-white/[.035] p-4 transition hover:border-cyan-200/25 hover:bg-white/[.055]">
                                    <div className="flex items-center gap-3">
                                        <div className={`grid size-11 place-items-center rounded-2xl border border-white/10 ${tone === 'light' ? 'bg-white' : 'bg-black/25'}`}><img src={icon} alt={`${name} icon`} className="size-7 object-contain" /></div>
                                        <div>
                                            <div className="font-black text-white">{name}</div>
                                            <div className="text-xs leading-5 text-slate-500">{desc}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="grid gap-4 pb-16 lg:grid-cols-4">
                        {useCases.map(([title, desc]) => (
                            <div key={title} className="rounded-[1.75rem] border border-white/10 bg-slate-950/65 p-5 shadow-xl backdrop-blur">
                                <div className="mb-4 size-2 rounded-full bg-cyan-200 shadow-[0_0_24px_rgba(34,211,238,.8)]" />
                                <h3 className="font-black text-white">{title}</h3>
                                <p className="mt-2 text-sm leading-6 text-slate-400">{desc}</p>
                            </div>
                        ))}
                    </section>

                    <section className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.04] p-6 text-center shadow-2xl backdrop-blur sm:p-8">
                        <p className="text-xs font-black uppercase tracking-[.28em] text-cyan-200/70">Ready to compare?</p>
                        <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-black tracking-[-.05em] text-white sm:text-5xl">Open the chat, pick a model, and test your prompt.</h2>
                        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-400">No provider keys in the browser. The public UI talks to the Laravel backend, while admin manages encrypted provider config safely.</p>
                        <div className="mt-7 flex justify-center">
                            <Link href={chatHref} className="rounded-full bg-white px-7 py-3 font-black text-slate-950 transition hover:bg-cyan-200">Start chatting</Link>
                        </div>
                    </section>

                    <footer className="pb-8 text-center text-xs leading-6 text-slate-500">
                        <div>Designed by <span className="font-bold text-slate-300">Deylnn Assistant</span></div>
                        <div>Built by <a href="https://dkzhen.org" target="_blank" rel="noreferrer" className="font-bold text-cyan-100 transition hover:text-cyan-200">Zhen</a></div>
                    </footer>
                </div>
            </main>
        </>
    );
}
