"use client";

export default function StatusBadge({ status }) {
    const copy = {
        idle: "Waiting",
        extracting: "Parsing",
        analyzing: "Analyzing",
        ready: "Ready",
        done: "Analyzed",
    };

    return (
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-600">
            {copy[status] ?? "Waiting"}
        </span>
    );
}
