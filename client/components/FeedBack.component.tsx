export default function MeetingFeedback() {
  const feedbackCards = [
    {
      title: "Overall Meeting Experience",
      description:
        "Participants can rate the meeting quality, communication clarity, and collaboration experience.",
      fields: [
        "Meeting quality",
        "Audio/video quality",
        "Ease of communication",
      ],
    },
    {
      title: "Presenter Feedback",
      description:
        "Collect insights about presenter clarity, engagement, and pacing.",
      fields: ["Presentation clarity", "Speaker engagement", "Session pacing"],
    },
    {
      title: "Technical Experience",
      description: "Understand connection stability and platform performance.",
      fields: ["Network stability", "Video smoothness", "Screen share quality"],
    },
    {
      title: "Feature Suggestions",
      description: "Allow users to suggest new features and improvements.",
      fields: ["New feature ideas", "Missing functionality", "UI improvements"],
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            Meeting Feedback System
          </h1>

          <p className="text-neutral-400 text-lg max-w-3xl">
            A modern feedback collection flow for your Janus SFU video
            conferencing platform.
          </p>
        </div>

        {/* PAGE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {feedbackCards.map((card, index) => (
            <div
              key={index}
              className="rounded-3xl border border-white/10 bg-neutral-900 p-6 shadow-2xl hover:border-blue-500/50 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">{card.title}</h2>

                  <p className="text-neutral-400 text-sm leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-xl font-bold text-blue-400">
                  {index + 1}
                </div>
              </div>

              <div className="space-y-4">
                {card.fields.map((field, fieldIndex) => (
                  <div
                    key={fieldIndex}
                    className="rounded-2xl bg-black/40 border border-white/5 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">{field}</span>

                      <span className="text-xs text-neutral-500">Rating</span>
                    </div>

                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          className="w-10 h-10 rounded-xl bg-neutral-800 hover:bg-blue-500 transition-all duration-200"
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <textarea
                placeholder="Additional feedback..."
                className="w-full mt-6 h-32 rounded-2xl bg-black/50 border border-white/10 p-4 outline-none resize-none focus:border-blue-500"
              />

              <button className="w-full mt-5 py-4 rounded-2xl bg-blue-500 hover:bg-blue-600 font-semibold text-lg transition-all duration-300">
                Submit Feedback
              </button>
            </div>
          ))}
        </div>

        {/* SUMMARY SECTION */}
        <div className="mt-12 rounded-3xl border border-white/10 bg-neutral-900 p-8">
          <h2 className="text-3xl font-bold mb-6">Suggested Flow</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[
              "Meeting Ends",
              "Feedback Modal Opens",
              "User Rates Experience",
              "Analytics Dashboard Updates",
            ].map((step, index) => (
              <div
                key={index}
                className="rounded-2xl bg-black/40 border border-white/10 p-5"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 text-blue-400 font-bold">
                  {index + 1}
                </div>

                <p className="text-sm text-neutral-300 leading-relaxed">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
