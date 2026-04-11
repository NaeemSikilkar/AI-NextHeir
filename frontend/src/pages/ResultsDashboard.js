import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ArrowLeft, Send, Loader2, AlertTriangle, Shield, Edit, BarChart3, MessageCircle, X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import AppFooter from "@/components/AppFooter";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const CHART_COLORS = ["#7c9082", "#c28e5c", "#6b8e99", "#a67c52", "#8b6b99", "#5c8e7c", "#c2785c"];

const quickQuestions = [
  "Is this distribution fair?",
  "What conflicts might arise?",
  "How can I improve fairness?",
];

export default function ResultsDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scenario, setScenario] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const chatEndRef = useRef(null);
  const resultsRef = useRef(null);

  const loadScenario = useCallback(async () => {
    try {
      const { data } = await api.get(`/scenarios/${id}`);
      setScenario(data);
      if (data.simulation_result) {
        setResult(data.simulation_result);
      } else {
        // Run simulation
        const { data: simResult } = await api.post(`/scenarios/${id}/simulate`);
        setResult(simResult);
      }
    } catch {
      toast.error("Failed to load scenario");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { loadScenario(); }, [loadScenario]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendMessage = async (message) => {
    if (!message.trim()) return;
    setChatMessages((prev) => [...prev, { role: "user", content: message }]);
    setChatInput("");
    setChatLoading(true);
    try {
      const { data } = await api.post("/chat", {
        message,
        scenario_id: id,
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

  const handleExportPDF = async () => {
    if (!resultsRef.current) return;
    setExporting(true);
    try {
      const element = resultsRef.current;
      const canvas = await html2canvas(element, {
        backgroundColor: "#0a0c0a",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;
      // Title
      pdf.setFillColor(10, 12, 10);
      pdf.rect(0, 0, pdfWidth, pdfHeight, "F");
      pdf.setTextColor(245, 240, 232);
      pdf.setFontSize(18);
      pdf.text(scenario?.name || "Simulation Results", 10, 15);
      pdf.setFontSize(10);
      pdf.setTextColor(163, 168, 164);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 10, 22);
      position = 28;
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - position);
      while (heightLeft > 0) {
        pdf.addPage();
        pdf.setFillColor(10, 12, 10);
        pdf.rect(0, 0, pdfWidth, pdfHeight, "F");
        position = -(pdfHeight - 28) + 10;
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      pdf.save(`${scenario?.name || "NextHeir-Results"}.pdf`);
      toast.success("PDF exported successfully!");
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0c0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7c9082]" />
      </div>
    );
  }

  if (!result) return null;

  const pieData = result.distribution?.map((d) => ({
    name: d.name, value: d.percentage_of_total, amount: d.total_value,
  })).filter((d) => d.value > 0) || [];

  const totalPieValue = pieData.reduce((s, d) => s + d.value, 0);

  // Debug log for distribution data
  console.log("[NextHeir] Distribution data:", JSON.stringify(pieData));
  console.log("[NextHeir] Total pie value:", totalPieValue);

  const barData = result.future_projections?.map((f) => ({
    name: f.asset_name.length > 15 ? f.asset_name.slice(0, 15) + "..." : f.asset_name,
    current: f.current_value, future: f.future_value_5yr,
  })) || [];

  const fairnessColor = result.fairness_score >= 70 ? "#7c9082" : result.fairness_score >= 40 ? "#c28e5c" : "#b35959";

  return (
    <div className="min-h-screen bg-[#0a0c0a]">
      {/* Header */}
      <header className="glass-surface border-b border-[#232824] sticky top-0 z-40" data-testid="results-header">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/dashboard")} className="text-[#a3a8a4] hover:text-white transition-colors" data-testid="back-to-dashboard">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm font-medium" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{scenario?.name || "Results"}</h1>
              <p className="text-xs text-[#6b726d]">Simulation Results</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              data-testid="export-pdf-btn"
              onClick={handleExportPDF}
              disabled={exporting}
              variant="outline" className="border-[#3a423d] text-[#b8c9bc] hover:border-[#7c9082] hover:bg-[#121513] rounded-full text-sm"
            >
              {exporting ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Download className="w-3 h-3 mr-2" />}
              {exporting ? "Exporting..." : "PDF"}
            </Button>
            <Link to={`/scenario/${id}/edit`}>
              <Button data-testid="edit-scenario-btn" variant="outline" className="border-[#3a423d] text-[#b8c9bc] hover:border-[#7c9082] hover:bg-[#121513] rounded-full text-sm">
                <Edit className="w-3 h-3 mr-2" /> Edit
              </Button>
            </Link>
            <Link to="/compare">
              <Button data-testid="compare-btn" variant="outline" className="border-[#3a423d] text-[#b8c9bc] hover:border-[#7c9082] hover:bg-[#121513] rounded-full text-sm">
                <BarChart3 className="w-3 h-3 mr-2" /> Compare
              </Button>
            </Link>
            <Button
              data-testid="ai-chat-toggle-btn"
              onClick={() => setChatOpen(!chatOpen)}
              className="bg-[#7c9082] text-[#0a0c0a] hover:bg-[#98ab9e] rounded-full text-sm glow-sage"
            >
              <MessageCircle className="w-3 h-3 mr-2" /> AI Advisor
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-8">
        <div ref={resultsRef}>
        {/* Top Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flat-card rounded-2xl p-6" data-testid="total-estate-card">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#6b726d] mb-2">Total Estate Value</p>
            <p className="text-3xl font-medium font-mono text-[#f5f0e8]">
              {result.total_estate_value?.toLocaleString()}
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flat-card rounded-2xl p-6" data-testid="fairness-score-card">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#6b726d] mb-2">Fairness Score</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-medium font-mono" style={{ color: fairnessColor }}>
                {result.fairness_score}
              </p>
              <span className="text-sm text-[#b8c9bc] mb-1">/ 100</span>
            </div>
            <div className="mt-3 h-2 bg-[#1a1d1a] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${result.fairness_score}%`, backgroundColor: fairnessColor }} />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flat-card rounded-2xl p-6" data-testid="risk-alerts-card">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#6b726d] mb-2">Risk Alerts</p>
            {result.risk_alerts?.length > 0 ? (
              <div className="space-y-2">
                {result.risk_alerts.map((alert, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: alert.type === "error" ? "#b35959" : "#c28e5c" }} />
                    <span className="text-[#f5f0e8]">{alert.message}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-[#7c9082]">
                <Shield className="w-4 h-4" /> No risk alerts
              </div>
            )}
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flat-card rounded-2xl p-6" data-testid="distribution-chart">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#6b726d] mb-6">Wealth Distribution</p>
            {totalPieValue > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                      {pieData.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#121513", border: "1px solid #232824", borderRadius: "8px", color: "#fff" }}
                      formatter={(value, name) => [`${value}%`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-4">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-[#f5f0e8]">{d.name}: {d.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-sm text-[#6b726d]" data-testid="no-distribution-msg">
                No valid distribution data available
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flat-card rounded-2xl p-6" data-testid="projection-chart">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#6b726d] mb-6">5-Year Asset Projection</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232824" />
                <XAxis dataKey="name" tick={{ fill: "#b8c9bc", fontSize: 11 }} />
                <YAxis tick={{ fill: "#b8c9bc", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#121513", border: "1px solid #232824", borderRadius: "8px", color: "#f5f0e8" }}
                />
                <Bar dataKey="current" fill="#6b8e99" name="Current" radius={[4, 4, 0, 0]} />
                <Bar dataKey="future" fill="#c28e5c" name="5-Year" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Distribution Details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flat-card rounded-2xl p-6" data-testid="distribution-details">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#6b726d] mb-6">Distribution Breakdown</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.distribution?.map((d, i) => (
              <div key={d.member_id} className="bg-[#0a0c0a] rounded-xl p-4 border border-[#232824]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] + "20", color: CHART_COLORS[i % CHART_COLORS.length] }}>
                    {d.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#f5f0e8]">{d.name}</p>
                    <p className="text-xs text-[#b8c9bc]">{d.relationship}</p>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-lg font-mono font-medium text-[#f5f0e8]">
                    {d.total_value?.toLocaleString()}
                  </p>
                  <p className="text-sm font-mono text-[#b8c9bc]">{d.percentage_of_total}%</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
        </div>{/* end resultsRef */}
      </main>

      <AppFooter />

      {/* AI Chat Panel */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed right-0 top-0 h-full w-full md:w-[420px] z-50 glass-surface border-l border-[#232824] flex flex-col"
            data-testid="ai-chat-panel"
          >
            <div className="flex items-center justify-between p-4 border-b border-[#232824]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#7c9082]/10 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-[#7c9082]" />
                </div>
                <div>
                  <h3 className="text-sm font-medium" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>NextHeir AI</h3>
                  <p className="text-xs text-[#6b726d]">Inheritance Advisor</p>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-[#6b726d] hover:text-white" data-testid="close-chat-btn">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center py-8">
                  <MessageCircle className="w-10 h-10 text-[#3a423d] mx-auto mb-4" />
                  <p className="text-sm text-[#6b726d] mb-4">Ask me about your inheritance scenario</p>
                  <div className="space-y-2">
                    {quickQuestions.map((q) => (
                      <button
                        key={q} onClick={() => sendMessage(q)}
                        className="block w-full text-left text-sm bg-[#121513] border border-[#232824] rounded-lg px-4 py-3 text-[#a3a8a4] hover:border-[#7c9082] hover:text-white transition-colors"
                        data-testid={`quick-q-${q.slice(0, 10).replace(/\s/g, "-")}`}
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
                  data-testid="chat-input"
                  value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask NextHeir AI..."
                  className="bg-[#0a0c0a] border-[#232824] text-white placeholder-[#4a554e] rounded-full h-10 flex-1"
                  disabled={chatLoading}
                />
                <Button
                  data-testid="send-chat-btn"
                  type="submit" disabled={chatLoading || !chatInput.trim()}
                  className="bg-[#7c9082] text-[#0a0c0a] hover:bg-[#98ab9e] rounded-full w-10 h-10 p-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
