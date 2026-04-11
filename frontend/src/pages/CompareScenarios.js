import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Loader2, MessageCircle, AlertTriangle, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";

const CHART_COLORS = ["#7c9082", "#c28e5c", "#6b8e99", "#a67c52", "#8b6b99"];

const quickQuestions = [
  "Which is better?",
  "Reduce conflict risk",
  "Improve fairness",
];

export default function CompareScenarios() {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scenarioA, setScenarioA] = useState(null);
  const [scenarioB, setScenarioB] = useState(null);
  const [dataA, setDataA] = useState(null);
  const [dataB, setDataB] = useState(null);
  const [selectedA, setSelectedA] = useState("");
  const [selectedB, setSelectedB] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    try {
      const { data } = await api.get("/scenarios");
      const withSim = data.filter((s) => s.has_simulation);
      setScenarios(withSim);
    } catch {
      toast.error("Failed to load scenarios");
    } finally {
      setLoading(false);
    }
  };

  const loadScenarioData = useCallback(async (id, setter) => {
    try {
      const { data } = await api.get(`/scenarios/${id}`);
      setter(data);
    } catch {
      toast.error("Failed to load scenario data");
    }
  }, []);

  useEffect(() => {
    if (selectedA) loadScenarioData(selectedA, setDataA);
    else setDataA(null);
  }, [selectedA, loadScenarioData]);

  useEffect(() => {
    if (selectedB) loadScenarioData(selectedB, setDataB);
    else setDataB(null);
  }, [selectedB, loadScenarioData]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendMessage = async (message) => {
    if (!message.trim() || !selectedA || !selectedB) return;
    setChatMessages((prev) => [...prev, { role: "user", content: message }]);
    setChatInput("");
    setChatLoading(true);
    try {
      const { data } = await api.post("/chat/compare", {
        message,
        scenario_a_id: selectedA,
        scenario_b_id: selectedB,
        session_id: sessionId,
      });
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      if (!sessionId) setSessionId(data.session_id);
    } catch {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I'm unable to respond right now. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const renderScenarioCard = (data, label) => {
    if (!data) return (
      <div className="flat-card rounded-2xl p-8 flex items-center justify-center min-h-[300px]">
        <p className="text-sm text-[#6b726d]">Select {label}</p>
      </div>
    );

    const sim = data.simulation_result;
    if (!sim) return (
      <div className="flat-card rounded-2xl p-8 flex items-center justify-center min-h-[300px]">
        <p className="text-sm text-[#6b726d]">No simulation results</p>
      </div>
    );

    const pieData = sim.distribution?.map((d) => ({ name: d.name, value: d.percentage_of_total })) || [];
    const fairnessColor = sim.fairness_score >= 70 ? "#7c9082" : sim.fairness_score >= 40 ? "#c28e5c" : "#b35959";

    return (
      <div className="flat-card rounded-2xl p-6" data-testid={`compare-card-${label.toLowerCase()}`}>
        <h3 className="text-base font-medium mb-4 text-[#f5f0e8]" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
          {data.name}
        </h3>

        {/* Fairness Score */}
        <div className="mb-4">
          <p className="text-xs text-[#b8c9bc] mb-1">Fairness Score</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-mono font-medium" style={{ color: fairnessColor }}>{sim.fairness_score}</span>
            <span className="text-xs text-[#b8c9bc] mb-1">/ 100</span>
          </div>
          <div className="mt-2 h-1.5 bg-[#1a1d1a] rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${sim.fairness_score}%`, backgroundColor: fairnessColor }} />
          </div>
        </div>

        {/* Mini Pie */}
        <div className="mb-4">
          <p className="text-xs text-[#b8c9bc] mb-2">Distribution</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                {pieData.map((_, idx) => (
                  <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#121513", border: "1px solid #232824", borderRadius: "8px", color: "#f5f0e8" }} formatter={(v) => [`${v}%`]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2">
            {pieData.map((d, i) => (
              <span key={d.name} className="text-xs text-[#f5f0e8] flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                {d.name}: {d.value}%
              </span>
            ))}
          </div>
        </div>

        {/* Risk Alerts */}
        <div>
          <p className="text-xs text-[#b8c9bc] mb-2">Alerts</p>
          {sim.risk_alerts?.length > 0 ? (
            <div className="space-y-1">
              {sim.risk_alerts.map((a, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-[#f5f0e8]">
                  <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" style={{ color: a.type === "error" ? "#b35959" : "#c28e5c" }} />
                  {a.message}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-[#7c9082]">
              <Shield className="w-3 h-3" /> No alerts
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0c0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7c9082]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0c0a]">
      <AppHeader>
        <span className="text-sm font-medium text-[#f5f0e8]" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Compare Scenarios</span>
      </AppHeader>

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-8 pt-24">
        {/* Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <label className="text-xs font-bold tracking-[0.2em] uppercase text-[#6b726d]">Scenario A</label>
            <Select value={selectedA} onValueChange={(v) => { setSelectedA(v); setChatMessages([]); setSessionId(null); }}>
              <SelectTrigger data-testid="select-scenario-a" className="bg-[#0a0c0a] border-[#232824] text-white h-12">
                <SelectValue placeholder="Select scenario" />
              </SelectTrigger>
              <SelectContent className="bg-[#121513] border-[#232824]">
                {scenarios.map((s) => (
                  <SelectItem key={s.id} value={s.id} disabled={s.id === selectedB} className="text-white hover:bg-[#1a1d1a]">
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold tracking-[0.2em] uppercase text-[#6b726d]">Scenario B</label>
            <Select value={selectedB} onValueChange={(v) => { setSelectedB(v); setChatMessages([]); setSessionId(null); }}>
              <SelectTrigger data-testid="select-scenario-b" className="bg-[#0a0c0a] border-[#232824] text-white h-12">
                <SelectValue placeholder="Select scenario" />
              </SelectTrigger>
              <SelectContent className="bg-[#121513] border-[#232824]">
                {scenarios.map((s) => (
                  <SelectItem key={s.id} value={s.id} disabled={s.id === selectedA} className="text-white hover:bg-[#1a1d1a]">
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {renderScenarioCard(dataA, "A")}
          {renderScenarioCard(dataB, "B")}
        </div>

        {/* AI Chat */}
        {selectedA && selectedB && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flat-card rounded-2xl overflow-hidden" data-testid="compare-chat-section">
            <div className="p-4 border-b border-[#232824] flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#7c9082]/10 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-[#7c9082]" />
              </div>
              <div>
                <h3 className="text-sm font-medium" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>AI Comparison Advisor</h3>
                <p className="text-xs text-[#6b726d]">Ask about these scenarios</p>
              </div>
            </div>

            <div className="h-80 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-sm text-[#6b726d] mb-4">Ask NextHeir AI about this comparison...</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {quickQuestions.map((q) => (
                      <button
                        key={q} onClick={() => sendMessage(q)}
                        className="text-xs bg-[#121513] border border-[#232824] rounded-full px-4 py-2 text-[#a3a8a4] hover:border-[#7c9082] hover:text-white transition-colors"
                        data-testid={`compare-quick-q-${q.replace(/\s/g, "-")}`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#7c9082]/10 border border-[#7c9082]/20 text-white"
                      : "bg-[#1a1d1a] border-l-2 border-l-[#7c9082] text-[#a3a8a4]"
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#1a1d1a] border-l-2 border-l-[#7c9082] rounded-2xl px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-[#7c9082]" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-[#232824]">
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(chatInput); }} className="flex gap-2">
                <Input
                  data-testid="compare-chat-input"
                  value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask NextHeir AI about this comparison..."
                  className="bg-[#0a0c0a] border-[#232824] text-white placeholder-[#4a554e] rounded-full h-10 flex-1"
                  disabled={chatLoading}
                />
                <Button
                  data-testid="compare-send-chat-btn"
                  type="submit" disabled={chatLoading || !chatInput.trim()}
                  className="bg-[#7c9082] text-[#0a0c0a] hover:bg-[#98ab9e] rounded-full w-10 h-10 p-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}

        {scenarios.length < 2 && (
          <div className="flat-card rounded-2xl p-12 text-center">
            <p className="text-sm text-[#6b726d]">You need at least 2 simulated scenarios to compare. Go back and create more scenarios.</p>
          </div>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
