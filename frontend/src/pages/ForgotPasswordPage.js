import { useState } from "react";
import { Link } from "react-router-dom";
import api, { formatApiErrorDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetLink, setResetLink] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setSent(true);
      setResetLink(data.simulated_reset_link || "");
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c0a] flex items-center justify-center px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <Link to="/" className="inline-block mb-10">
          <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            <span className="text-white">Next</span><span className="text-[#7c9082]">Heir</span>
          </span>
        </Link>

        <h1 className="text-3xl font-medium tracking-tight mb-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
          Reset your password
        </h1>
        <p className="text-sm text-[#a3a8a4] mb-8">Enter your email and we'll send you a reset link</p>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-5" data-testid="forgot-password-form">
            {error && (
              <div className="bg-[#b35959]/10 border border-[#b35959]/30 text-[#b35959] text-sm rounded-lg px-4 py-3" data-testid="forgot-error">{error}</div>
            )}
            <div className="space-y-2">
              <Label className="text-sm text-[#a3a8a4]">Email</Label>
              <Input
                data-testid="forgot-email-input"
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required
                className="bg-[#0a0c0a] border-[#232824] text-white focus:ring-1 focus:ring-[#7c9082] focus:border-[#7c9082] rounded-lg placeholder-[#4a554e] h-12"
              />
            </div>
            <Button data-testid="forgot-submit-btn" type="submit" disabled={loading} className="w-full bg-[#7c9082] text-[#0a0c0a] hover:bg-[#98ab9e] rounded-full h-12 font-medium glow-sage">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
            </Button>
          </form>
        ) : (
          <div className="space-y-6" data-testid="forgot-success">
            <div className="bg-[#7c9082]/10 border border-[#7c9082]/30 rounded-lg px-4 py-4">
              <p className="text-sm text-[#b8c9bc] mb-3">A password reset link has been generated. In a production environment, this would be sent to your email.</p>
              <p className="text-xs text-[#6b726d] mb-2">Demo Mode - Click the link below to reset:</p>
              {resetLink && (
                <a href={resetLink.replace('https://heir-planner.preview.emergentagent.com', '')} className="text-sm text-[#7c9082] hover:text-[#98ab9e] underline break-all" data-testid="reset-link">
                  Click here to reset your password
                </a>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-[#6b726d] hover:text-[#a3a8a4] transition-colors" data-testid="back-to-login">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
