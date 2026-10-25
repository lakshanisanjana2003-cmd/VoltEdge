import { useEffect, useState } from "react";
import { getMyProfile } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/StatCard";

export default function SettingsPage() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getMyProfile().then(setProfile).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings / About" />
      <Panel title="My account">
        <p className="text-sm">Name: {profile?.full_name}</p>
        <p className="text-sm">Staff number: <span className="font-mono">{profile?.staff_code ?? "—"}</span></p>
        <p className="text-sm">Officer ID: <span className="font-mono">{profile?.officer_id}</span></p>
        <p className="mt-1 text-sm text-muted-foreground">You can sign in with either your staff number or your Officer ID.</p>
      </Panel>
      <Panel title="About VoltEdge">
        <p className="text-sm">
          Electrical Design Office Management System — React frontend, Node.js + Express API and a MongoDB database (MERN stack).
        </p>
        <p className="mt-2 text-sm text-muted-foreground">Office project, client and professional records.</p>
      </Panel>
    </div>
  );
}
