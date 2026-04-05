import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { formatApiErrorDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c0a] flex">
      {/* Left - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1683395715087-931a7eed3f78?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzl8MHwxfHNlYXJjaHwzfHx3ZWFsdGglMjBmaW5hbmNlJTIwYWJzdHJhY3QlMjBkYXJrfGVufDB8fHx8MTc3NTM2ODgxMXww&ixlib=rb-4.1.0&q=85"
          alt="" className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0c0a] via-[#0a0c0a]/60 to-transparent" />
        <div className="absolute bottom-12 left-12 max-w-md">
          <h2 className="text-3xl font-medium tracking-tight mb-3" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Protect your <span className="text-[#7c9082]">legacy</span>
          </h2>
          <p className="text-sm text-[#a3a8a4] leading-relaxed">AI-powered inheritance simulation for high-net-worth families.</p>
        </div>
      </div>

      {/* Right - Form */}
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
            Welcome back
          </h1>
          <p className="text-sm text-[#a3a8a4] mb-8">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-5" data-testid="login-form">
            {error && (
              <div className="bg-[#b35959]/10 border border-[#b35959]/30 text-[#b35959] text-sm rounded-lg px-4 py-3" data-testid="login-error">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-sm text-[#a3a8a4]">Email</Label>
              <Input
                data-testid="login-email-input"
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required
                className="bg-[#0a0c0a] border-[#232824] text-white focus:ring-1 focus:ring-[#7c9082] focus:border-[#7c9082] rounded-lg placeholder-[#4a554e] h-12"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-[#a3a8a4]">Password</Label>
              <Input
                data-testid="login-password-input"
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password" required
                className="bg-[#0a0c0a] border-[#232824] text-white focus:ring-1 focus:ring-[#7c9082] focus:border-[#7c9082] rounded-lg placeholder-[#4a554e] h-12"
              />
            </div>
            <Button
              data-testid="login-submit-btn"
              type="submit" disabled={loading}
              className="w-full bg-[#7c9082] text-[#0a0c0a] hover:bg-[#98ab9e] rounded-full h-12 font-medium glow-sage"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
            </Button>
          </form>

          <p className="text-sm text-[#6b726d] mt-6 text-center">
            Don't have an account?{" "}
            <Link to="/register" className="text-[#7c9082] hover:text-[#98ab9e] transition-colors" data-testid="go-to-register">
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
