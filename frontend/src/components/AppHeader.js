import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppHeader({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isLanding = location.pathname === "/";

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const scrollToDeveloper = (e) => {
    if (isLanding) {
      e.preventDefault();
      const el = document.getElementById("developed-by");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
    // On other pages, the link navigates to /#developed-by
  };

  const aboutHref = isLanding ? "#about" : "/#about";
  const howHref = isLanding ? "#how-it-works" : "/#how-it-works";
  const devHref = isLanding ? "#developed-by" : "/#developed-by";

  return (
    <header className="glass-surface border-b border-[#232824] fixed top-0 w-full z-50" data-testid="app-header">
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
        {/* Left: Logo */}
        <Link to={user ? "/dashboard" : "/"} className="text-xl font-bold tracking-tight shrink-0" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
          <span className="text-white">Next</span><span className="text-[#7c9082]">Heir</span>
        </Link>

        {/* Center: Page-specific controls (optional) */}
        {children && <div className="hidden md:flex items-center gap-2 mx-4">{children}</div>}

        {/* Right: Nav */}
        <nav className="flex items-center gap-6 text-sm text-[#a3a8a4]">
          <a href={aboutHref} className="hidden md:inline hover:text-white transition-colors" data-testid="nav-about">About</a>
          <a href={howHref} className="hidden md:inline hover:text-white transition-colors" data-testid="nav-how-it-works">How it Works</a>
          <a href={devHref} onClick={scrollToDeveloper} className="hidden md:inline hover:text-white transition-colors" data-testid="nav-developed-by">Developed By</a>
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="text-[#f5f0e8] hover:text-white transition-colors font-medium" data-testid="nav-user-name">
                {user.name || user.email}
              </Link>
              <button
                onClick={handleLogout}
                className="text-[#6b726d] hover:text-white transition-colors"
                data-testid="nav-logout-btn"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="hover:text-white transition-colors" data-testid="nav-login">Login</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
