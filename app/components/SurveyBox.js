"use client";

export default function SurveyBox({ survey, setSurvey }) {
    return (
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
                        onClick={() =>
                            setSurvey((current) => ({ ...current, answer: option }))
                        }
                    >
                        {option}
                    </button>
                ))}
            </div>

            <textarea
                className="mt-3 min-h-24 w-full rounded-[1rem] border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-700 outline-none focus:border-[var(--teal)]"
                value={survey.note}
                onChange={(e) =>
                    setSurvey((current) => ({ ...current, note: e.target.value }))
                }
                placeholder="Optional note on what felt useful or too generic."
            />
        </div>
    );
}