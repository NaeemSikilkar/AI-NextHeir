import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, ArrowRight, Briefcase, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import TipsSection from "@/components/TipsSection";
import DeveloperFooter from "@/components/DeveloperFooter";
import AppFooter from "@/components/AppFooter";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" } }),
};

const steps = [
  { icon: Briefcase, title: "Add Assets", desc: "Property, businesses, investments, precious metals" },
  { icon: Users, title: "Define Family", desc: "Map relationships, needs, and circumstances" },
  { icon: BarChart3, title: "Simulate Outcomes", desc: "AI-powered fairness analysis and conflict detection" },
];

const trustItems = [
  { icon: Shield, label: "Secure" },
  { icon: Lock, label: "Private" },
  { icon: Eye, label: "Built for HNIs" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0c0a]">
      {/* Header */}
      <header className="glass-surface fixed top-0 w-full z-50" data-testid="landing-header">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            <span className="text-white">Next</span><span className="text-[#7c9082]">Heir</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-[#a3a8a4]">
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <Link to="/login" className="hover:text-white transition-colors">Login</Link>
            <Link to="/register">
              <Button data-testid="header-get-started-btn" className="bg-[#7c9082] text-[#0a0c0a] hover:bg-[#98ab9e] rounded-full px-6 font-medium glow-sage">
                Get Started
              </Button>
            </Link>
          </nav>
          <Link to="/register" className="md:hidden">
            <Button data-testid="header-mobile-get-started-btn" className="bg-[#7c9082] text-[#0a0c0a] hover:bg-[#98ab9e] rounded-full px-4 text-sm font-medium">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-16" data-testid="hero-section">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1749765804007-a7e74a11f1d5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwyfHxwcmVtaXVtJTIwYmxhY2slMjBzYWdlJTIwZ3JlZW4lMjBhYnN0cmFjdCUyMHRleHR1cmV8ZW58MHx8fHwxNzc1MzY4NzkxfDA&ixlib=rb-4.1.0&q=85"
            alt="" className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#0a0c0a]/80" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full">
          <motion.div initial="hidden" animate="visible" className="max-w-3xl">
            <motion.p variants={fadeUp} custom={0} className="text-xs font-bold tracking-[0.2em] uppercase text-[#7c9082] mb-6">
              AI-Powered Wealth Distribution
            </motion.p>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl lg:text-6xl tracking-tight font-medium leading-tight mb-6" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              Simulate Your Inheritance.<br />
              <span className="text-[#7c9082]">Avoid Future Conflicts.</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-base md:text-lg text-[#a3a8a4] mb-10 max-w-xl leading-relaxed">
              AI-powered clarity for wealth distribution. Make informed decisions that protect both your legacy and family harmony.
            </motion.p>
            <motion.div variants={fadeUp} custom={3}>
              <Link to="/register">
                <Button data-testid="hero-get-started-btn" className="bg-[#7c9082] text-[#0a0c0a] hover:bg-[#98ab9e] rounded-full px-8 py-6 text-base font-medium glow-sage">
                  Get Started <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 md:py-32 px-6 md:px-12" data-testid="how-it-works-section">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.p variants={fadeUp} custom={0} className="text-xs font-bold tracking-[0.2em] uppercase text-[#6b726d] mb-4">
              The Process
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-2xl md:text-3xl lg:text-4xl tracking-tight font-medium mb-16" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              How it Works
            </motion.h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i + 2}
                className="flat-card rounded-2xl p-8 md:p-10 hover:-translate-y-1 transition-transform duration-300"
                data-testid={`step-card-${i}`}
              >
                <div className="w-12 h-12 rounded-xl bg-[#7c9082]/10 flex items-center justify-center mb-6">
                  <step.icon className="w-6 h-6 text-[#7c9082]" strokeWidth={1.5} />
                </div>
                <div className="text-xs font-bold tracking-[0.2em] uppercase text-[#6b726d] mb-3">Step {i + 1}</div>
                <h3 className="text-xl font-medium mb-3" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{step.title}</h3>
                <p className="text-sm text-[#a3a8a4] leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section id="about" className="py-24 md:py-32 px-6 md:px-12 border-t border-[#232824]" data-testid="trust-section">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h2
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
            className="text-2xl md:text-3xl lg:text-4xl tracking-tight font-medium mb-16"
            style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
          >
            Built for Those Who<br /><span className="text-[#7c9082]">Value Privacy</span>
          </motion.h2>
          <div className="flex flex-wrap justify-center gap-12 md:gap-20">
            {trustItems.map((item, i) => (
              <motion.div
                key={item.label}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i + 1}
                className="flex flex-col items-center gap-4"
                data-testid={`trust-item-${i}`}
              >
                <div className="w-16 h-16 rounded-2xl bg-[#121513] border border-[#232824] flex items-center justify-center">
                  <item.icon className="w-7 h-7 text-[#7c9082]" strokeWidth={1.5} />
                </div>
                <span className="text-sm font-medium text-[#a3a8a4]">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <TipsSection />

      {/* Developed By */}
      <DeveloperFooter />

      {/* Footer */}
      <footer className="border-t border-[#232824] py-12 px-6 md:px-12" data-testid="landing-footer">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-[#6b726d]">
            <span className="font-bold text-white" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Next</span>
            <span className="font-bold text-[#7c9082]" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Heir</span>
            <span className="ml-3">AI-Powered Inheritance Planning</span>
          </div>
          <p className="text-xs text-[#6b726d]">For informational purposes only. Not financial or legal advice.</p>
        </div>
      </footer>
    </div>
  );
}
