import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import AppHeader from "@/components/AppHeader";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
                  <TableRow key={u.email} className="border-[#232824] hover:bg-[#121513]/50" data-testid={`user-row-${i}`}>
                    <TableCell className="text-sm text-[#f5f0e8]">{u.name || "—"}</TableCell>
                    <TableCell className="text-sm text-[#b8c9bc] font-mono">{u.email}</TableCell>
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
