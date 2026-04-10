export default function InfoTile({ title, body }) {
    return (
        <div className="rounded-[1.3rem] border border-white/60 bg-white/70 px-4 py-4 shadow-[0_10px_25px_rgba(13,23,38,0.06)]">
            <p
                className="text-xs uppercase tracking-[0.22em] text-slate-400"
                style={{ fontFamily: "var(--font-mono)" }}
            >
                {title}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{body}</p>
        </div>
    );
}