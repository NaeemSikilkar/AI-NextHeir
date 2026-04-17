import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api, { formatApiErrorDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Phone, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const COUNTRY_CODES = ["+91", "+1", "+44", "+971", "+65", "+61", "+86", "+81", "+49", "+33", "+966"];

export default function RegisterPage() {
  const [mode, setMode] = useState("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, checkAuth, user } = useAuth();
  const navigate = useNavigate();

  if (user) { navigate("/dashboard", { replace: true }); return null; }

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally { setLoading(false); }
  };

  const handleSendOtp = async () => {
    if (!phone.trim()) { setError("Enter your mobile number"); return; }
    if (!name.trim()) { setError("Enter your full name"); return; }
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/otp/send", { phone, country_code: countryCode });
      setOtpSent(true);
      setSimulatedOtp(data.simulated_otp);
      toast.success("OTP sent to your mobile number");
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) { setError("Enter the OTP"); return; }
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/otp/verify", { phone, country_code: countryCode, otp, name });
      await checkAuth();
      navigate("/dashboard");
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally { setLoading(false); }
  };

  const inputClass = "bg-[#0a0c0a] border-[#232824] text-white focus:ring-1 focus:ring-[#7c9082] focus:border-[#7c9082] rounded-lg placeholder-[#4a554e] h-12";

  return (
    <div className="min-h-screen bg-[#0a0c0a] flex">
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img src="https://images.unsplash.com/photo-1505843513577-22bb7d21e455?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzl8MHwxfHNlYXJjaHwyfHxoaWdoJTIwbmV0JTIwd29ydGglMjBmYW1pbHklMjBsdXh1cnklMjBlc3RhdGV8ZW58MHx8fHwxNzc1MzY4NzkxfDA&ixlib=rb-4.1.0&q=85" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0c0a] via-[#0a0c0a]/60 to-transparent" />
        <div className="absolute bottom-12 left-12 max-w-md">
          <h2 className="text-3xl font-medium tracking-tight mb-3 text-[#f5f0e8]" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Plan with <span className="text-[#7c9082]">confidence</span></h2>
          <p className="text-sm text-[#a3a8a4] leading-relaxed">Simulate outcomes. Prevent conflicts. Preserve harmony.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <Link to="/" className="inline-block mb-10">
            <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              <span className="text-white">Next</span><span className="text-[#7c9082]">Heir</span>
            </span>
          </Link>

          <h1 className="text-3xl font-medium tracking-tight mb-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Create your account</h1>
          <p className="text-sm text-[#a3a8a4] mb-6">Start planning your family's future</p>

          {/* Toggle */}
          <div className="flex bg-[#121513] rounded-full p-1 mb-6" data-testid="register-mode-toggle">
            <button onClick={() => { setMode("email"); setError(""); }} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm transition-all ${mode === "email" ? "bg-[#7c9082] text-[#0a0c0a] font-medium" : "text-[#6b726d]"}`} data-testid="register-mode-email">
              <Mail className="w-4 h-4" /> Email
            </button>
            <button onClick={() => { setMode("phone"); setError(""); setOtpSent(false); }} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm transition-all ${mode === "phone" ? "bg-[#7c9082] text-[#0a0c0a] font-medium" : "text-[#6b726d]"}`} data-testid="register-mode-phone">
              <Phone className="w-4 h-4" /> Mobile
            </button>
          </div>

          {error && (
            <div className="bg-[#b35959]/10 border border-[#b35959]/30 text-[#b35959] text-sm rounded-lg px-4 py-3 mb-4" data-testid="register-error">{error}</div>
          )}

          {mode === "email" ? (
            <form onSubmit={handleEmailRegister} className="space-y-5" data-testid="register-form">
              <div className="space-y-2">
                <Label className="text-sm text-[#a3a8a4]">Full Name</Label>
                <Input data-testid="register-name-input" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required className={inputClass} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-[#a3a8a4]">Email</Label>
                <Input data-testid="register-email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className={inputClass} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-[#a3a8a4]">Password</Label>
                <Input data-testid="register-password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters" required className={inputClass} />
              </div>
              <Button data-testid="register-submit-btn" type="submit" disabled={loading} className="w-full bg-[#7c9082] text-[#0a0c0a] hover:bg-[#98ab9e] rounded-full h-12 font-medium glow-sage">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
              </Button>
            </form>
          ) : (
            <div className="space-y-5" data-testid="otp-register-form">
              <div className="space-y-2">
                <Label className="text-sm text-[#a3a8a4]">Full Name</Label>
                <Input data-testid="register-phone-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className={inputClass} disabled={otpSent} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-[#a3a8a4]">Mobile Number</Label>
                <div className="flex gap-2">
                  <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="bg-[#0a0c0a] border border-[#232824] text-white rounded-lg px-3 h-12 text-sm focus:ring-1 focus:ring-[#7c9082]" data-testid="register-country-code">
                    {COUNTRY_CODES.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                  <Input data-testid="register-phone-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" className={`${inputClass} flex-1`} disabled={otpSent} />
                </div>
              </div>

              {otpSent && (
                <>
                  {simulatedOtp && (
                    <div className="bg-[#7c9082]/10 border border-[#7c9082]/30 rounded-lg px-4 py-3" data-testid="simulated-otp-display">
                      <p className="text-xs text-[#6b726d] mb-1">Demo Mode - Your OTP:</p>
                      <p className="text-2xl font-mono font-bold text-[#7c9082] tracking-widest">{simulatedOtp}</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-sm text-[#a3a8a4]">Enter OTP</Label>
                    <Input data-testid="register-otp-input" type="text" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit OTP" className={`${inputClass} text-center tracking-[0.5em] font-mono text-lg`} />
                  </div>
                </>
              )}

              {!otpSent ? (
                <Button data-testid="register-send-otp-btn" onClick={handleSendOtp} disabled={loading} className="w-full bg-[#7c9082] text-[#0a0c0a] hover:bg-[#98ab9e] rounded-full h-12 font-medium glow-sage">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send OTP"}
                </Button>
              ) : (
                <div className="space-y-3">
                  <Button data-testid="register-verify-otp-btn" onClick={handleVerifyOtp} disabled={loading} className="w-full bg-[#7c9082] text-[#0a0c0a] hover:bg-[#98ab9e] rounded-full h-12 font-medium glow-sage">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Create Account"}
                  </Button>
                  <button onClick={() => { setOtpSent(false); setOtp(""); setSimulatedOtp(""); }} className="w-full text-sm text-[#6b726d] hover:text-[#a3a8a4] transition-colors">Resend OTP</button>
                </div>
              )}
            </div>
          )}

          <p className="text-sm text-[#6b726d] mt-6 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-[#7c9082] hover:text-[#98ab9e] transition-colors" data-testid="go-to-login">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
