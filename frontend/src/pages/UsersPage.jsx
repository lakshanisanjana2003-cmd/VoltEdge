import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import { changeUserRole, listUsers } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const selectClass = "h-9 rounded-md border border-input bg-card px-3 text-sm";

export default function UsersPage() {
  const { profile } = useOutletContext(); 
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadUsers() {
    try {
      setUsers(await listUsers());
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Only administrators load the list 
  useEffect(() => {
    if (profile?.role === "admin") loadUsers();
  }, [profile?.role]);

  async function handleRoleChange(user, role) {
    try {
      await changeUserRole(user._id, role);
      toast.success(`${user.full_name} is now ${role}`);
      loadUsers();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (!profile) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (profile.role !== "admin") return <p className="text-sm">Only administrators can open this page.</p>;

  return (
    <div>
      <PageHeader title="User Accounts" subtitle={`${users.length} accounts`} />
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : error ? (
        <p className="text-sm text-destructive">Could not load: {error}</p>
      ) : (
        <div className="shadow-card overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Staff number</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell className="font-mono text-xs">{user.staff_code ?? "—"}</TableCell>
                  <TableCell>
                    <select
                      className={selectClass}
                      value={user.role}
                      disabled={user._id === profile._id} 
                      onChange={(e) => handleRoleChange(user, e.target.value)}
                    >
                      <option value="staff">staff</option>
                      <option value="admin">admin</option>
                    </select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}