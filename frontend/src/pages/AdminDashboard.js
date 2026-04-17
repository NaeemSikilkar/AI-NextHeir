import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [tillDate, setTillDate] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const { data } = await api.get("/admin/users");
        setUsers(data);
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const handleExportExcel = async () => {
    if (!fromDate || !tillDate) {
      toast.error("Please select both From and Till dates");
      return;
    }
    if (fromDate > tillDate) {
      toast.error("'From' date must be before 'Till' date");
      return;
    }
    setExporting(true);
    try {
      const response = await api.get("/admin/users/export", {
        params: { from_date: fromDate, till_date: tillDate },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `NextHeir_Users_${fromDate}_to_${tillDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Excel report downloaded!");
    } catch {
      toast.error("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c0a]">
      <AppHeader />

      <main className="max-w-5xl mx-auto px-6 md:px-12 py-8 pt-28">
        <h1
          className="text-2xl md:text-3xl font-medium tracking-tight mb-2 text-[#f5f0e8]"
          style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
          data-testid="admin-title"
        >
          Admin Dashboard
        </h1>
        <p className="text-sm text-[#b8c9bc] mb-8">All registered users</p>

        {/* Date Range & Export */}
        <div className="flat-card rounded-2xl p-6 mb-8" data-testid="export-section">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#6b726d] mb-4">Export Report</p>
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="space-y-2 flex-1 w-full">
              <Label className="text-sm text-[#b8c9bc]">From</Label>
              <Input
                data-testid="export-from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-[#0a0c0a] border-[#232824] text-white focus:ring-1 focus:ring-[#7c9082] focus:border-[#7c9082] rounded-lg h-12 [color-scheme:dark]"
              />
            </div>
            <div className="space-y-2 flex-1 w-full">
              <Label className="text-sm text-[#b8c9bc]">Till</Label>
              <Input
                data-testid="export-till-date"
                type="date"
                value={tillDate}
                onChange={(e) => setTillDate(e.target.value)}
                className="bg-[#0a0c0a] border-[#232824] text-white focus:ring-1 focus:ring-[#7c9082] focus:border-[#7c9082] rounded-lg h-12 [color-scheme:dark]"
              />
            </div>
            <Button
              data-testid="export-excel-btn"
              onClick={handleExportExcel}
              disabled={exporting || !fromDate || !tillDate}
              className="bg-[#7c9082] text-[#0a0c0a] hover:bg-[#98ab9e] rounded-full h-12 px-6 font-medium glow-sage whitespace-nowrap"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              {exporting ? "Exporting..." : "Download Excel"}
            </Button>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#7c9082]" />
          </div>
        ) : error ? (
          <div className="bg-[#b35959]/10 border border-[#b35959]/30 text-[#b35959] text-sm rounded-lg px-4 py-3" data-testid="admin-error">
            {error}
          </div>
        ) : (
          <div className="flat-card rounded-2xl overflow-hidden" data-testid="admin-users-table">
            <Table>
              <TableHeader>
                <TableRow className="border-[#232824] hover:bg-transparent">
                  <TableHead className="text-[#b8c9bc] text-xs font-bold tracking-wider uppercase">Full Name</TableHead>
                  <TableHead className="text-[#b8c9bc] text-xs font-bold tracking-wider uppercase">Email</TableHead>
                  <TableHead className="text-[#b8c9bc] text-xs font-bold tracking-wider uppercase">Signup Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u, i) => (
                  <TableRow key={u.email || u.phone || i} className="border-[#232824] hover:bg-[#121513]/50" data-testid={`user-row-${i}`}>
                    <TableCell className="text-sm text-[#f5f0e8]">{u.name || "—"}</TableCell>
                    <TableCell className="text-sm text-[#b8c9bc] font-mono">{u.email || u.phone || "—"}</TableCell>
                    <TableCell className="text-sm text-[#b8c9bc]">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow className="border-[#232824]">
                    <TableCell colSpan={3} className="text-center text-sm text-[#6b726d] py-8">No users found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
}
