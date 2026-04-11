import { Link } from "react-router-dom";
import DeveloperFooter from "@/components/DeveloperFooter";

export default function AppFooter({ showDeveloper = true }) {
  return (
    <div className="border-t border-[#232824]">
      {showDeveloper && <DeveloperFooter />}
      <footer className="border-t border-[#232824] py-8 px-6 md:px-12" data-testid="app-footer">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link to="/" className="text-sm">
            <span className="font-bold text-white" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Next</span>
            <span className="font-bold text-[#7c9082]" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Heir</span>
            <span className="ml-3 text-[#6b726d]">AI-Powered Inheritance Planning</span>
          </Link>
          <p className="text-xs text-[#6b726d]">For informational purposes only. Not financial or legal advice.</p>
        </div>
      </footer>
    </div>
  );
}
