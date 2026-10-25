import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Zap } from "lucide-react";
import { isValidOfficerId } from "@/lib/auth";
import { registerStaff, signIn } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Sign in / register page for office staff.
export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("signin"); // "signin" or "register"
  const [fullName, setFullName] = useState("");
  const [officerId, setOfficerId] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!isValidOfficerId(officerId)) return setError("Officer ID must be 3–30 letters, numbers, dots or dashes.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (mode === "register" && fullName.trim().length < 2) return setError("Please enter your name.");

    setBusy(true);
    try {
      if (mode === "signin") await signIn(officerId.trim(), password);
      else await registerStaff(fullName.trim(), officerId.trim(), password);
      toast.success(mode === "signin" ? "Welcome back" : "Account created");
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function switchMode() {
    setMode(mode === "signin" ? "register" : "signin");
    setError("");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="bg-auth bg-blueprint hidden flex-col justify-between p-12 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2 text-sidebar-accent-foreground">
          <Zap className="h-6 w-6 text-sidebar-primary" />
          <span className="font-semibold tracking-wide">VoltEdge</span>
        </div>
        <div>
          <h1 className="text-4xl font-semibold leading-tight text-sidebar-accent-foreground">
            Electrical Design
            <br />
            Office Management
          </h1>
          <p className="mt-4 max-w-sm text-sm">
            Projects, clients, drawings, site visits and approvals for building electrical consultancy.
          </p>
        </div>
        <p className="font-mono text-xs">Staff access only</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5" noValidate>
          <div>
            <h2 className="text-2xl font-semibold">{mode === "signin" ? "Staff sign in" : "Register staff account"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "signin"
                ? "Use your staff number (like U01) or the Officer ID given by the office."
                : "Use the Officer ID given by the office."}
            </p>
          </div>

          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="officerId">{mode === "signin" ? "Staff number or Officer ID" : "Officer ID"}</Label>
            <Input
              id="officerId"
              className="font-mono uppercase"
              placeholder={mode === "signin" ? "e.g. U01" : "e.g. EDO-014"}
              value={officerId}
              onChange={(e) => setOfficerId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
          <button
            type="button"
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
            onClick={switchMode}
          >
            {mode === "signin" ? "New staff member? Register" : "Already registered? Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
