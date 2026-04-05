import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Plus, Trash2, Loader2, Check, Briefcase, Users, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const ASSET_TYPES = ["Property", "Business", "Mutual Funds", "Bullions/Precious Metals"];
const RELATIONSHIPS = ["Son", "Daughter", "Spouse", "Sibling", "Parent", "Grandchild", "Other"];

const calcAppreciation = (purchase, current) => {
  if (!purchase || purchase === 0) return 0;
  return parseFloat((((current - purchase) / purchase) * 100).toFixed(2));
};

const emptyAsset = () => ({
  id: crypto.randomUUID(), asset_type: "", asset_name: "", purchased_year: new Date().getFullYear(),
  purchase_price: 0, current_value: 0, ownership_percent: 100,
});

const emptyMember = () => ({
  id: crypto.randomUUID(), name: "", relationship: "", age: 30, profession: "", description: "",
});

const stepConfig = [
  { label: "Assets", icon: Briefcase },
  { label: "Family", icon: Users },
  { label: "Distribution", icon: BarChart3 },
];

export default function ScenarioCreate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [scenarioName, setScenarioName] = useState("");
  const [assets, setAssets] = useState([emptyAsset()]);
  const [members, setMembers] = useState([emptyMember()]);
  const [allocations, setAllocations] = useState({});
  const [saving, setSaving] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(!!id);

  const loadExisting = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await api.get(`/scenarios/${id}`);
      setScenarioName(data.name || "");
      if (data.assets?.length) setAssets(data.assets);
      if (data.family_members?.length) setMembers(data.family_members);
      if (data.allocations?.length) {
        const allocMap = {};
        data.allocations.forEach((a) => {
          allocMap[a.asset_id] = a.distributions || {};
        });
        setAllocations(allocMap);
      }
    } catch {
      toast.error("Failed to load scenario");
      navigate("/dashboard");
    } finally {
      setLoadingExisting(false);
    }
  }, [id, navigate]);

  useEffect(() => { loadExisting(); }, [loadExisting]);

  // Initialize allocations when moving to step 3
  useEffect(() => {
    if (step === 2) {
      const newAlloc = { ...allocations };
      assets.forEach((a) => {
        if (!newAlloc[a.id]) {
          newAlloc[a.id] = {};
          members.forEach((m) => { newAlloc[a.id][m.id] = 0; });
        } else {
          members.forEach((m) => {
            if (newAlloc[a.id][m.id] === undefined) newAlloc[a.id][m.id] = 0;
          });
        }
      });
      setAllocations(newAlloc);
    }
  }, [step, assets.length, members.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateAsset = (idx, field, value) => {
    const updated = [...assets];
    updated[idx] = { ...updated[idx], [field]: value };
    setAssets(updated);
  };

  const updateMember = (idx, field, value) => {
    const updated = [...members];
    updated[idx] = { ...updated[idx], [field]: value };
    setMembers(updated);
  };

  const updateAllocation = (assetId, memberId, value) => {
    const val = parseFloat(value) || 0;
    setAllocations((prev) => ({
      ...prev,
      [assetId]: { ...prev[assetId], [memberId]: val },
    }));
  };

  const getAllocationTotal = (assetId) => {
    const dist = allocations[assetId] || {};
    return Object.values(dist).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  };

  const validateStep = () => {
    if (step === 0) {
      if (!scenarioName.trim()) { toast.error("Enter a scenario name"); return false; }
      for (const a of assets) {
        if (!a.asset_name.trim() || !a.asset_type) { toast.error("Fill in all asset fields"); return false; }
        if (a.current_value <= 0) { toast.error("Asset current value must be greater than 0"); return false; }
      }
      return true;
    }
    if (step === 1) {
      for (const m of members) {
        if (!m.name.trim() || !m.relationship) { toast.error("Fill in all family member fields"); return false; }
      }
      return true;
    }
    if (step === 2) {
      for (const a of assets) {
        const total = getAllocationTotal(a.id);
        if (Math.abs(total - 100) > 0.01) {
          toast.error(`${a.asset_name}: allocation must total 100% (currently ${total}%)`);
          return false;
        }
      }
      return true;
    }
    return true;
  };

  const handleSaveAndSimulate = async () => {
    if (!validateStep()) return;
    setSaving(true);
    try {
      const payload = {
        name: scenarioName,
        assets: assets.map(({ id: _id, ...rest }) => ({
          ...rest,
          appreciation_percent: calcAppreciation(rest.purchase_price, rest.current_value),
        })),
        family_members: members.map(({ id: _id, ...rest }) => rest),
        allocations: Object.entries(allocations).map(([assetId, dist]) => ({
          asset_id: assetId,
          distributions: dist,
        })),
      };
      let scenarioId = id;
      if (id) {
        await api.put(`/scenarios/${id}`, payload);
      } else {
        const { data } = await api.post("/scenarios", payload);
        scenarioId = data.id;
      }
      // Run simulation
      setSimulating(true);
      await api.post(`/scenarios/${scenarioId}/simulate`);
      toast.success("Simulation complete!");
      navigate(`/scenario/${scenarioId}/results`);
    } catch (err) {
      toast.error("Failed to save scenario");
    } finally {
      setSaving(false);
      setSimulating(false);
    }
  };

  if (loadingExisting) {
    return (
      <div className="min-h-screen bg-[#0a0c0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7c9082]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0c0a]">
      {/* Header */}
      <header className="glass-surface border-b border-[#232824] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-sm text-[#a3a8a4] hover:text-white transition-colors" data-testid="back-to-dashboard">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <span className="text-sm text-[#6b726d]">{id ? "Edit" : "New"} Scenario</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-12" data-testid="scenario-stepper">
          {stepConfig.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2">
              <button
                onClick={() => { if (i < step) setStep(i); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
                  i === step ? "bg-[#7c9082] text-[#0a0c0a] font-medium" :
                  i < step ? "bg-[#7c9082]/10 text-[#7c9082]" : "bg-[#121513] text-[#6b726d]"
                }`}
                data-testid={`step-btn-${i}`}
              >
                {i < step ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                <span className="hidden md:inline">{s.label}</span>
              </button>
              {i < stepConfig.length - 1 && <div className={`w-8 h-px ${i < step ? "bg-[#7c9082]" : "bg-[#232824]"}`} />}
            </div>
          ))}
        </div>

        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
          {/* Step 1: Assets */}
          {step === 0 && (
            <div data-testid="step-assets">
              <h2 className="text-2xl font-medium tracking-tight mb-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                Define Your Assets
              </h2>
              <p className="text-sm text-[#a3a8a4] mb-8">Add all assets you want to include in this inheritance scenario</p>

              <div className="space-y-3 mb-6">
                <Label className="text-sm text-[#a3a8a4]">Scenario Name</Label>
                <Input
                  data-testid="scenario-name-input"
                  value={scenarioName} onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="e.g., Equal Distribution Plan"
                  className="bg-[#0a0c0a] border-[#232824] text-white focus:ring-1 focus:ring-[#7c9082] focus:border-[#7c9082] rounded-lg placeholder-[#4a554e] h-12 max-w-md"
                />
              </div>

              <div className="space-y-6">
                {assets.map((asset, idx) => (
                  <div key={asset.id} className="flat-card rounded-2xl p-6" data-testid={`asset-form-${idx}`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#6b726d]">Asset {idx + 1}</span>
                      {assets.length > 1 && (
                        <button onClick={() => setAssets(assets.filter((_, i) => i !== idx))} className="text-[#6b726d] hover:text-[#b35959]" data-testid={`remove-asset-${idx}`}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-[#6b726d]">Asset Type</Label>
                        <Select value={asset.asset_type} onValueChange={(v) => updateAsset(idx, "asset_type", v)}>
                          <SelectTrigger data-testid={`asset-type-select-${idx}`} className="bg-[#0a0c0a] border-[#232824] text-white h-10">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#121513] border-[#232824]">
                            {ASSET_TYPES.map((t) => (
                              <SelectItem key={t} value={t} className="text-white hover:bg-[#1a1d1a]">{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-[#6b726d]">Asset Name</Label>
                        <Input data-testid={`asset-name-input-${idx}`} value={asset.asset_name} onChange={(e) => updateAsset(idx, "asset_name", e.target.value)}
                          placeholder="e.g., Family Villa" className="bg-[#0a0c0a] border-[#232824] text-white h-10 placeholder-[#4a554e]" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-[#6b726d]">Purchased Year</Label>
                        <Input data-testid={`asset-year-input-${idx}`} type="number" value={asset.purchased_year} onChange={(e) => updateAsset(idx, "purchased_year", parseInt(e.target.value) || 0)}
                          className="bg-[#0a0c0a] border-[#232824] text-white h-10 font-mono" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-[#6b726d]">Purchase Price</Label>
                        <Input data-testid={`asset-purchase-price-${idx}`} type="number" value={asset.purchase_price} onChange={(e) => updateAsset(idx, "purchase_price", parseFloat(e.target.value) || 0)}
                          className="bg-[#0a0c0a] border-[#232824] text-white h-10 font-mono" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-[#6b726d]">Current Value</Label>
                        <Input data-testid={`asset-current-value-${idx}`} type="number" value={asset.current_value} onChange={(e) => updateAsset(idx, "current_value", parseFloat(e.target.value) || 0)}
                          className="bg-[#0a0c0a] border-[#232824] text-white h-10 font-mono" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-[#6b726d]">Ownership %</Label>
                        <Input data-testid={`asset-ownership-${idx}`} type="number" value={asset.ownership_percent} onChange={(e) => updateAsset(idx, "ownership_percent", parseFloat(e.target.value) || 0)}
                          className="bg-[#0a0c0a] border-[#232824] text-white h-10 font-mono" min={0} max={100} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-[#6b726d]">Asset Appreciation %</Label>
                        {(() => {
                          const appVal = calcAppreciation(asset.purchase_price, asset.current_value);
                          return (
                            <div
                              data-testid={`asset-appreciation-${idx}`}
                              className={`bg-[#0a0c0a] border border-[#232824] rounded-lg h-10 flex items-center px-3 font-mono text-sm ${
                                appVal > 0 ? "text-[#7c9082]" : appVal < 0 ? "text-[#b35959]" : "text-[#6b726d]"
                              }`}
                            >
                              {appVal > 0 ? "+" : ""}{appVal}%
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                data-testid="add-asset-btn"
                onClick={() => setAssets([...assets, emptyAsset()])}
                variant="outline" className="mt-4 border-[#3a423d] text-[#a3a8a4] hover:border-[#7c9082] hover:bg-[#121513] rounded-full"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Another Asset
              </Button>
            </div>
          )}

          {/* Step 2: Family */}
          {step === 1 && (
            <div data-testid="step-family">
              <h2 className="text-2xl font-medium tracking-tight mb-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                Map Your Family
              </h2>
              <p className="text-sm text-[#a3a8a4] mb-8">Add family members who will be part of the distribution</p>

              <div className="space-y-6">
                {members.map((member, idx) => (
                  <div key={member.id} className="flat-card rounded-2xl p-6" data-testid={`member-form-${idx}`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#6b726d]">Member {idx + 1}</span>
                      {members.length > 1 && (
                        <button onClick={() => setMembers(members.filter((_, i) => i !== idx))} className="text-[#6b726d] hover:text-[#b35959]" data-testid={`remove-member-${idx}`}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-[#6b726d]">Name</Label>
                        <Input data-testid={`member-name-input-${idx}`} value={member.name} onChange={(e) => updateMember(idx, "name", e.target.value)}
                          placeholder="Full name" className="bg-[#0a0c0a] border-[#232824] text-white h-10 placeholder-[#4a554e]" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-[#6b726d]">Relationship</Label>
                        <Select value={member.relationship} onValueChange={(v) => updateMember(idx, "relationship", v)}>
                          <SelectTrigger data-testid={`member-relationship-select-${idx}`} className="bg-[#0a0c0a] border-[#232824] text-white h-10">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#121513] border-[#232824]">
                            {RELATIONSHIPS.map((r) => (
                              <SelectItem key={r} value={r} className="text-white hover:bg-[#1a1d1a]">{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-[#6b726d]">Age</Label>
                        <Input data-testid={`member-age-input-${idx}`} type="number" value={member.age} onChange={(e) => updateMember(idx, "age", parseInt(e.target.value) || 0)}
                          className="bg-[#0a0c0a] border-[#232824] text-white h-10 font-mono" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-[#6b726d]">Profession</Label>
                        <Input data-testid={`member-profession-input-${idx}`} value={member.profession} onChange={(e) => updateMember(idx, "profession", e.target.value)}
                          placeholder="e.g., Doctor" className="bg-[#0a0c0a] border-[#232824] text-white h-10 placeholder-[#4a554e]" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-xs text-[#6b726d]">Tell me about him/her</Label>
                        <Textarea data-testid={`member-description-input-${idx}`} value={member.description} onChange={(e) => updateMember(idx, "description", e.target.value)}
                          placeholder="Brief description about this family member..."
                          className="bg-[#0a0c0a] border-[#232824] text-white placeholder-[#4a554e] min-h-[80px]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                data-testid="add-member-btn"
                onClick={() => setMembers([...members, emptyMember()])}
                variant="outline" className="mt-4 border-[#3a423d] text-[#a3a8a4] hover:border-[#7c9082] hover:bg-[#121513] rounded-full"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Another Member
              </Button>
            </div>
          )}

          {/* Step 3: Distribution */}
          {step === 2 && (
            <div data-testid="step-distribution">
              <h2 className="text-2xl font-medium tracking-tight mb-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                Assign Distribution
              </h2>
              <p className="text-sm text-[#a3a8a4] mb-8">Distribute each asset among family members. Each asset must total 100%.</p>

              <div className="space-y-8">
                {assets.map((asset) => {
                  const total = getAllocationTotal(asset.id);
                  const isValid = Math.abs(total - 100) < 0.01;
                  return (
                    <div key={asset.id} className="flat-card rounded-2xl p-6" data-testid={`distribution-${asset.id}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-base font-medium" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{asset.asset_name}</h3>
                          <p className="text-xs text-[#6b726d]">{asset.asset_type} &middot; <span className="font-mono">{asset.current_value.toLocaleString()}</span></p>
                        </div>
                        <div className={`text-sm font-mono px-3 py-1 rounded-full ${isValid ? "bg-[#7c9082]/10 text-[#7c9082]" : "bg-[#b35959]/10 text-[#b35959]"}`}>
                          {total}%
                        </div>
                      </div>
                      <Progress value={Math.min(total, 100)} className="h-1.5 mb-4 bg-[#1a1d1a]" />
                      <Table>
                        <TableHeader>
                          <TableRow className="border-[#232824] hover:bg-transparent">
                            <TableHead className="text-[#6b726d] text-xs">Member</TableHead>
                            <TableHead className="text-[#6b726d] text-xs">Relationship</TableHead>
                            <TableHead className="text-[#6b726d] text-xs text-right">Allocation %</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {members.map((member) => (
                            <TableRow key={member.id} className="border-[#232824] hover:bg-[#121513]/50">
                              <TableCell className="text-sm text-white">{member.name || "Unnamed"}</TableCell>
                              <TableCell className="text-sm text-[#a3a8a4]">{member.relationship}</TableCell>
                              <TableCell className="text-right">
                                <Input
                                  data-testid={`alloc-${asset.id}-${member.id}`}
                                  type="number" min={0} max={100}
                                  value={allocations[asset.id]?.[member.id] || 0}
                                  onChange={(e) => updateAllocation(asset.id, member.id, e.target.value)}
                                  className="bg-[#0a0c0a] border-[#232824] text-white h-8 w-20 text-right font-mono ml-auto"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-[#232824]">
          <Button
            data-testid="prev-step-btn"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            variant="outline" className="border-[#3a423d] text-[#a3a8a4] hover:border-[#7c9082] hover:bg-[#121513] rounded-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          {step < 2 ? (
            <Button
              data-testid="next-step-btn"
              onClick={() => { if (validateStep()) setStep(step + 1); }}
              className="bg-[#7c9082] text-[#0a0c0a] hover:bg-[#98ab9e] rounded-full px-6 font-medium glow-sage"
            >
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              data-testid="run-simulation-btn"
              onClick={handleSaveAndSimulate}
              disabled={saving || simulating}
              className="bg-[#7c9082] text-[#0a0c0a] hover:bg-[#98ab9e] rounded-full px-6 font-medium glow-sage"
            >
              {saving || simulating ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {simulating ? "Simulating..." : "Saving..."}</>
              ) : (
                <><BarChart3 className="w-4 h-4 mr-2" /> Run Simulation</>
              )}
            </Button>
          )}
        </div>
      </main>

      {/* Simulation Overlay */}
      {simulating && (
        <div className="fixed inset-0 z-50 bg-[#0a0c0a]/90 backdrop-blur-xl flex items-center justify-center" data-testid="simulation-loading">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full border-2 border-[#232824]" />
              <div className="absolute inset-0 rounded-full border-2 border-t-[#7c9082] animate-spin" />
              <div className="absolute inset-3 rounded-full border-2 border-[#232824]" />
              <div className="absolute inset-3 rounded-full border-2 border-t-[#98ab9e] animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
            </div>
            <h3 className="text-xl font-medium mb-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              Analyzing Scenarios
            </h3>
            <p className="text-sm text-[#6b726d]">Running fairness analysis and conflict detection...</p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
