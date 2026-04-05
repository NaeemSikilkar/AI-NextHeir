import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { formatApiErrorDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c0a] flex">
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1505843513577-22bb7d21e455?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzl8MHwxfHNlYXJjaHwyfHxoaWdoJTIwbmV0JTIwd29ydGglMjBmYW1pbHklMjBsdXh1cnklMjBlc3RhdGV8ZW58MHx8fHwxNzc1MzY4NzkxfDA&ixlib=rb-4.1.0&q=85"
          alt="" className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0c0a] via-[#0a0c0a]/60 to-transparent" />
        <div className="absolute bottom-12 left-12 max-w-md">
          <h2 className="text-3xl font-medium tracking-tight mb-3" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Plan with <span className="text-[#7c9082]">confidence</span>
          </h2>
          <p className="text-sm text-[#a3a8a4] leading-relaxed">Simulate outcomes. Prevent conflicts. Preserve harmony.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="inline-block mb-12">
            <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              <span className="text-white">Next</span><span className="text-[#7c9082]">Heir</span>
            </span>
          </Link>

          <h1 className="text-3xl font-medium tracking-tight mb-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Create your account
          </h1>
          <p className="text-sm text-[#a3a8a4] mb-8">Start planning your family's future</p>

          <form onSubmit={handleSubmit} className="space-y-5" data-testid="register-form">
            {error && (
              <div className="bg-[#b35959]/10 border border-[#b35959]/30 text-[#b35959] text-sm rounded-lg px-4 py-3" data-testid="register-error">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-sm text-[#a3a8a4]">Full Name</Label>
              <Input
                data-testid="register-name-input"
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Your full name" required
                className="bg-[#0a0c0a] border-[#232824] text-white focus:ring-1 focus:ring-[#7c9082] focus:border-[#7c9082] rounded-lg placeholder-[#4a554e] h-12"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-[#a3a8a4]">Email</Label>
              <Input
                data-testid="register-email-input"
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required
                className="bg-[#0a0c0a] border-[#232824] text-white focus:ring-1 focus:ring-[#7c9082] focus:border-[#7c9082] rounded-lg placeholder-[#4a554e] h-12"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-[#a3a8a4]">Password</Label>
              <Input
                data-testid="register-password-input"
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters" required
                className="bg-[#0a0c0a] border-[#232824] text-white focus:ring-1 focus:ring-[#7c9082] focus:border-[#7c9082] rounded-lg placeholder-[#4a554e] h-12"
              />
            </div>
            <Button
              data-testid="register-submit-btn"
              type="submit" disabled={loading}
              className="w-full bg-[#7c9082] text-[#0a0c0a] hover:bg-[#98ab9e] rounded-full h-12 font-medium glow-sage"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
            </Button>
          </form>

          <p className="text-sm text-[#6b726d] mt-6 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-[#7c9082] hover:text-[#98ab9e] transition-colors" data-testid="go-to-login">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
