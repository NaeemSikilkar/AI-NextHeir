import { Lightbulb, AlertTriangle } from "lucide-react";

const tips = [
  {
    title: "Start simple",
    text: "Begin by adding your major assets and family members. You don't need perfect data—just enough to create a basic structure.",
  },
  {
    title: "Use approximate values",
    text: "It is not necessary to enter actual property or asset values. You can use rough or hypothetical numbers to explore different scenarios safely.",
  },
  {
    title: "Create multiple scenarios",
    text: "Don't rely on just one distribution. Try different combinations to compare outcomes and understand trade-offs.",
  },
  {
    title: "Think beyond equality",
    text: "Equal distribution may not always be practical. Use the tool to explore what is fair based on contribution, needs, and future stability.",
  },
  {
    title: "Leverage AI insights",
    text: "Use the AI chat to ask questions around emotional balance, conflict risks, and fairness. This is where deeper insights emerge.",
  },
  {
    title: "Focus on risk signals",
    text: "Pay attention to fairness scores and risk alerts. These highlight potential issues that may not be obvious in discussions.",
  },
  {
    title: "Iterate and refine",
    text: "Adjust allocations based on insights and re-run simulations to gradually move toward a more balanced outcome.",
  },
];

export default function TipsSection() {
  return (
    <section className="py-24 md:py-32 px-6 md:px-12 border-t border-[#232824]" data-testid="tips-section">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#6b726d] mb-4">
            Getting Started
          </p>
          <h2
            className="text-2xl md:text-3xl lg:text-4xl tracking-tight font-medium text-[#f5f0e8]"
            style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
          >
            Tips on How to Use <span className="text-[#7c9082]">NextHeir</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
          {tips.map((tip, i) => (
            <div
              key={tip.title}
              className="flat-card rounded-2xl p-6 flex gap-4 hover:-translate-y-0.5 transition-transform duration-300"
              data-testid={`tip-card-${i}`}
            >
              <div className="shrink-0 mt-0.5">
                <div className="w-8 h-8 rounded-lg bg-[#7c9082]/10 flex items-center justify-center text-sm font-mono font-medium text-[#7c9082]">
                  {i + 1}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-[#f5f0e8] mb-1.5" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                  {tip.title}
                </h4>
                <p className="text-sm leading-relaxed text-[#b8c9bc]">{tip.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="flat-card rounded-2xl p-6 md:p-8 border-l-4 border-l-[#c28e5c]" data-testid="disclaimer-section">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#c28e5c] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-[#f5f0e8] mb-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                Disclaimer
              </h4>
              <p className="text-sm leading-relaxed text-[#b8c9bc]">
                <strong className="text-[#f5f0e8]">
                  The outputs provided by NextHeir are AI-generated and based solely on the limited inputs you provide.
                  They are indicative in nature and should not be considered as financial or legal advice. Please consult
                  your Chartered Accountant (CA), lawyer, or wealth manager before making any final decisions.
                </strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
