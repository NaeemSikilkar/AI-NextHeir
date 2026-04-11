import { ExternalLink } from "lucide-react";

const NAEEM_PHOTO = "https://customer-assets.emergentagent.com/job_heir-planner/artifacts/v2812gec_Untitled%20design%20%282%29.jpg";

export default function DeveloperFooter() {
  return (
    <section id="developed-by" className="py-24 md:py-32 px-6 md:px-12 border-t border-[#232824]" data-testid="developed-by-section">
      <div className="max-w-4xl mx-auto">
        <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#6b726d] mb-8 text-center">
          Developed By
        </p>
        <div className="flat-card rounded-2xl p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="shrink-0">
              <img
                src={NAEEM_PHOTO}
                alt="Naeem Sikilkar"
                className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover border-2 border-[#232824]"
              />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3
                className="text-2xl md:text-3xl font-medium tracking-tight mb-2 text-[#f5f0e8]"
                style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
              >
                Naeem Sikilkar
              </h3>
              <a
                href="https://www.linkedin.com/in/naeem-sikilkar-64238395/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-[#7c9082] hover:text-[#98ab9e] transition-colors mb-6"
                data-testid="linkedin-link"
              >
                LinkedIn Profile <ExternalLink className="w-3 h-3" />
              </a>
              <div className="space-y-4 text-sm leading-relaxed text-[#b8c9bc]">
                <p>
                  NextHeir was built by Naeem Sikilkar, an aspiring AI Product Manager, using structured product thinking
                  frameworks like CIRCLES combined with modern vibe-coding platforms to rapidly prototype and validate ideas.
                </p>
                <p>
                  The inspiration behind NextHeir comes from a deeply personal experience—observing challenges within his
                  own family around wealth distribution due to the absence of a formal will. This highlighted a common yet
                  unspoken problem: decisions involving inheritance are often driven by emotions, assumptions, and lack of
                  clarity, which can unintentionally strain relationships.
                </p>
                <p>
                  NextHeir was envisioned as a solution to bring clarity, structure, and foresight into such sensitive
                  decisions. While not a replacement for human judgment or legal advice, the platform aims to provide
                  scenario-based insights, helping families explore different allocation possibilities, anticipate potential
                  conflicts, and make more informed, balanced decisions—without compromising the bonds that matter most.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
