import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, Calendar, LogOut, Trash2, Loader2, PlayCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    try {
      const { data } = await api.get("/scenarios");
      setScenarios(data);
    } catch {
      toast.error("Failed to load scenarios");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/scenarios/${id}`);
      setScenarios(scenarios.filter((s) => s.id !== id));
      toast.success("Scenario deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#0a0c0a]">
      {/* Top bar */}
      <header className="glass-surface border-b border-[#232824] sticky top-0 z-40" data-testid="dashboard-header">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            <span className="text-white">Next</span><span className="text-[#7c9082]">Heir</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#a3a8a4] hidden md:inline">{user?.name || user?.email}</span>
            <Button
              data-testid="logout-btn"
              variant="ghost" onClick={handleLogout}
              className="text-[#a3a8a4] hover:text-white hover:bg-[#121513]"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        {/* Welcome */}
        <motion.div initial="hidden" animate="visible" className="mb-12">
          <motion.p variants={fadeUp} custom={0} className="text-xs font-bold tracking-[0.2em] uppercase text-[#6b726d] mb-2">
            Dashboard
          </motion.p>
          <motion.h1 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-medium tracking-tight mb-4" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Welcome, <span className="text-[#7c9082]">{user?.name || "there"}</span>
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-sm text-[#a3a8a4] mb-8">
            Create and manage your inheritance scenarios
          </motion.p>
          <motion.div variants={fadeUp} custom={3} className="flex gap-4 flex-wrap">
            <Link to="/scenario/new">
              <Button data-testid="create-scenario-btn" className="bg-[#7c9082] text-[#0a0c0a] hover:bg-[#98ab9e] rounded-full px-6 font-medium glow-sage">
                <Plus className="w-4 h-4 mr-2" /> Create New Scenario
              </Button>
            </Link>
            {scenarios.length >= 2 && (
              <Link to="/compare">
                <Button data-testid="compare-scenarios-btn" variant="outline" className="border-[#3a423d] text-white hover:border-[#7c9082] hover:bg-[#121513] rounded-full px-6">
                  <BarChart3 className="w-4 h-4 mr-2" /> Compare Scenarios
                </Button>
              </Link>
            )}
          </motion.div>
        </motion.div>

        {/* Scenarios Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#7c9082]" />
          </div>
        ) : scenarios.length === 0 ? (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}
            className="flat-card rounded-2xl p-12 text-center"
          >
            <BarChart3 className="w-12 h-12 text-[#3a423d] mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>No scenarios yet</h3>
            <p className="text-sm text-[#6b726d] mb-6">Create your first scenario to start simulating wealth distribution</p>
            <Link to="/scenario/new">
              <Button className="bg-[#7c9082] text-[#0a0c0a] hover:bg-[#98ab9e] rounded-full px-6 font-medium">
                <Plus className="w-4 h-4 mr-2" /> Create Scenario
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scenarios.map((s, i) => (
              <motion.div
                key={s.id} initial="hidden" animate="visible" variants={fadeUp} custom={i + 4}
                className="flat-card rounded-2xl p-6 hover:-translate-y-1 transition-all duration-300 group"
                data-testid={`scenario-card-${i}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-base font-medium truncate pr-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                    {s.name}
                  </h3>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="text-[#6b726d] hover:text-[#b35959] transition-colors opacity-0 group-hover:opacity-100"
                    data-testid={`delete-scenario-${i}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#6b726d] mb-6">
                  <Calendar className="w-3 h-3" />
                  {s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}
                </div>
                <div className="flex items-center gap-2">
                  {s.has_simulation ? (
                    <Link to={`/scenario/${s.id}/results`} className="flex-1">
                      <Button data-testid={`view-results-${i}`} className="w-full bg-[#7c9082]/10 text-[#7c9082] hover:bg-[#7c9082]/20 rounded-full text-sm">
                        View Results
                      </Button>
                    </Link>
                  ) : (
                    <Link to={`/scenario/${s.id}/edit`} className="flex-1">
                      <Button data-testid={`edit-scenario-${i}`} className="w-full bg-[#121513] text-[#a3a8a4] hover:bg-[#1a1d1a] border border-[#232824] rounded-full text-sm">
                        <PlayCircle className="w-3 h-3 mr-2" /> Continue
                      </Button>
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
