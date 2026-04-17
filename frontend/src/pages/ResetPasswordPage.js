import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import api, { formatApiErrorDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: password });
      setSuccess(true);
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0a0c0a] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-[#b35959] mb-4">Invalid reset link. No token provided.</p>
          <Link to="/forgot-password" className="text-[#7c9082] hover:text-[#98ab9e] text-sm">Request a new reset link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0c0a] flex items-center justify-center px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <Link to="/" className="inline-block mb-10">
          <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            <span className="text-white">Next</span><span className="text-[#7c9082]">Heir</span>
          </span>
        </Link>

        {!success ? (
          <>
            <h1 className="text-3xl font-medium tracking-tight mb-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Set new password</h1>
            <p className="text-sm text-[#a3a8a4] mb-8">Enter your new password below</p>

            <form onSubmit={handleSubmit} className="space-y-5" data-testid="reset-password-form">
              {error && (
                <div className="bg-[#b35959]/10 border border-[#b35959]/30 text-[#b35959] text-sm rounded-lg px-4 py-3" data-testid="reset-error">{error}</div>
              )}
              <div className="space-y-2">
                <Label className="text-sm text-[#a3a8a4]">New Password</Label>
                <Input data-testid="new-password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters" required
                  className="bg-[#0a0c0a] border-[#232824] text-white focus:ring-1 focus:ring-[#7c9082] focus:border-[#7c9082] rounded-lg placeholder-[#4a554e] h-12" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-[#a3a8a4]">Confirm Password</Label>
                <Input data-testid="confirm-password-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" required
                  className="bg-[#0a0c0a] border-[#232824] text-white focus:ring-1 focus:ring-[#7c9082] focus:border-[#7c9082] rounded-lg placeholder-[#4a554e] h-12" />
              </div>
              <Button data-testid="reset-submit-btn" type="submit" disabled={loading} className="w-full bg-[#7c9082] text-[#0a0c0a] hover:bg-[#98ab9e] rounded-full h-12 font-medium glow-sage">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset Password"}
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center" data-testid="reset-success">
            <CheckCircle className="w-16 h-16 text-[#7c9082] mx-auto mb-6" />
            <h2 className="text-2xl font-medium tracking-tight mb-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Password Reset!</h2>
            <p className="text-sm text-[#a3a8a4] mb-8">Your password has been updated. You can now login with your new password.</p>
            <Button onClick={() => navigate("/login")} className="bg-[#7c9082] text-[#0a0c0a] hover:bg-[#98ab9e] rounded-full px-8 h-12 font-medium glow-sage" data-testid="go-to-login-btn">
              Go to Login
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
