const Results = ({ analysis, survey, setSurvey }) => {
    if (!analysis) {
        return (
            <section className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center text-slate-500">
                Extract the resume text, confirm it, and the LLM analysis will appear here.
            </section>
        );
    }

    return (
        <section className="grid gap-6">
            <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_18px_50px_rgba(13,23,38,0.28)]">
                    <p
                        className="text-xs uppercase tracking-[0.24em] text-[var(--sand)]"
                        style={{ fontFamily: "var(--font-mono)" }}
                    >
                        Summary
                    </p>
                    <p className="mt-4 text-base leading-7 text-slate-200">{analysis.summary}</p>

                    <div className="mt-5 rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                        <p className="text-sm font-medium text-white">Fit assessment</p>
                        <p className="mt-3 text-sm leading-6 text-slate-300">{analysis.fitAssessment}</p>
                        <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-400">
                            Model: {analysis.model || "gpt-4o-mini"}
                        </p>
                    </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-white/85 p-6 shadow-[0_14px_36px_rgba(13,23,38,0.08)]">
                    <p
                        className="text-xs uppercase tracking-[0.22em] text-slate-400"
                        style={{ fontFamily: "var(--font-mono)" }}
                    >
                        Strengths
                    </p>
                    <h2
                        className="mt-2 text-3xl font-medium text-slate-950"
                        style={{ fontFamily: "var(--font-display)" }}
                    >
                        What is already working
                    </h2>
                    <div className="mt-5 space-y-3">
                        {analysis.strengths?.length > 0 ? (
                            analysis.strengths.map((strength) => (
                                <article
                                    key={strength}
                                    className="rounded-[1.3rem] border border-emerald-200 bg-emerald-50 px-4 py-4"
                                >
                                    <p className="text-sm leading-6 text-emerald-900">{strength}</p>
                                </article>
                            ))
                        ) : (
                            <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                                No clear strengths were returned for this comparison.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
                <div className="rounded-[1.75rem] border border-slate-200 bg-white/85 p-6 shadow-[0_14px_36px_rgba(13,23,38,0.08)]">
                    <p
                        className="text-xs uppercase tracking-[0.22em] text-slate-400"
                        style={{ fontFamily: "var(--font-mono)" }}
                    >
                        Weaknesses
                    </p>
                    <h2
                        className="mt-2 text-3xl font-medium text-slate-950"
                        style={{ fontFamily: "var(--font-display)" }}
                    >
                        What could hold this resume back
                    </h2>
                    <div className="mt-5 space-y-3">
                        {analysis.weaknesses?.length > 0 ? (
                            analysis.weaknesses.map((weakness) => (
                                <article
                                    key={weakness}
                                    className="rounded-[1.3rem] border border-[var(--sand)]/70 bg-[#fff8ed] px-4 py-4"
                                >
                                    <p className="text-sm leading-6 text-slate-700">{weakness}</p>
                                </article>
                            ))
                        ) : (
                            <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                                No specific weaknesses were returned for this comparison.
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid gap-6">
                    <div className="rounded-[1.75rem] border border-slate-200 bg-white/85 p-6 shadow-[0_14px_36px_rgba(13,23,38,0.08)]">
                        <p
                            className="text-xs uppercase tracking-[0.22em] text-slate-400"
                            style={{ fontFamily: "var(--font-mono)" }}
                        >
                            Improvements
                        </p>
                        <h2
                            className="mt-2 text-3xl font-medium text-slate-950"
                            style={{ fontFamily: "var(--font-display)" }}
                        >
                            How to tighten the resume
                        </h2>
                        <div className="mt-5 space-y-3">
                            {analysis.improvements?.length > 0 ? (
                                analysis.improvements.map((improvement) => (
                                    <article
                                        key={improvement}
                                        className="rounded-[1.3rem] border border-sky-200 bg-sky-50 px-4 py-4"
                                    >
                                        <p className="text-sm leading-6 text-sky-900">{improvement}</p>
                                    </article>
                                ))
                            ) : (
                                <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                                    No improvement suggestions were returned for this comparison.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-[1.75rem] border border-slate-200 bg-white/85 p-6 shadow-[0_14px_36px_rgba(13,23,38,0.08)]">
                        <p
                            className="text-xs uppercase tracking-[0.22em] text-slate-400"
                            style={{ fontFamily: "var(--font-mono)" }}
                        >
                            Caveats
                        </p>
                        <div className="mt-4 space-y-3">
                            {analysis.caveats?.length > 0 ? (
                                analysis.caveats.map((item) => (
                                    <div
                                        key={item}
                                        className="rounded-[1.15rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600"
                                    >
                                        {item}
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-[1.15rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
                                    No extra caveats were returned by the model.
                                </div>
                            )}
                        </div>

                        <div className="mt-6 rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-4">
                            <p className="text-sm font-medium text-slate-900">
                                Was this feedback specific enough that you would change your resume before applying?
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {["Yes", "Somewhat", "No"].map((option) => (
                                    <button
                                        key={option}
                                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${survey.answer === option
                                            ? "bg-slate-950 text-white"
                                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                                            }`}
                                        type="button"
                                        onClick={() => setSurvey((current) => ({ ...current, answer: option }))}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                            <textarea
                                className="mt-3 min-h-24 w-full rounded-[1rem] border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-700 outline-none ring-0 placeholder:text-slate-400 focus:border-[var(--teal)]"
                                value={survey.note}
                                onChange={(event) => setSurvey((current) => ({ ...current, note: event.target.value }))}
                                placeholder="Optional note on what felt useful or too generic."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Results