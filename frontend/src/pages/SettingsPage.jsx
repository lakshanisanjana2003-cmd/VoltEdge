import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getMyProfessional, getMyProfile, saveMyProfessional } from "@/lib/api";
import { PROFESSIONAL_FIELDS } from "@/lib/constants";
import { validateFields } from "@/components/SimpleRecordPage";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const selectClass = "flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm";

// form signed-in user creates /edits  professional profile.
function MyProfessionalProfile({ fullName }) {
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function fillForm(profile) {
    const filled = {};
    for (const field of PROFESSIONAL_FIELDS) filled[field.name] = profile?.[field.name] ?? "";
    if (!profile) filled.name = fullName ?? ""; // suggest the account name for a new profile
    setValues(filled);
  }

  useEffect(() => {
    getMyProfessional()
      .then((profile) => {
        setExists(Boolean(profile));
        fillForm(profile);
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, [fullName]);

  async function handleSubmit(event) {
    event.preventDefault();
    const problems = validateFields(PROFESSIONAL_FIELDS, values);
    setErrors(problems);
    if (Object.keys(problems).length > 0) return;

    setSaving(true);
    try {
      const saved = await saveMyProfessional(values, exists);
      toast.success(exists ? "Profile updated" : "Profile created");
      setExists(true);
      fillForm(saved);
    } catch (error) {
      if (error.fieldErrors) setErrors(error.fieldErrors);
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  function renderInput(field) {
    const value = values[field.name] ?? "";
    const onChange = (e) => setValues({ ...values, [field.name]: e.target.value });
    if (field.type === "textarea") return <Textarea id={field.name} value={value} onChange={onChange} />;
    if (field.type === "select") {
      return (
        <select id={field.name} className={selectClass} value={value} onChange={onChange}>
          <option value="">— Choose —</option>
          {field.options.map((option) => <option key={option}>{option}</option>)}
        </select>
      );
    }
    return <Input id={field.name} type={field.type ?? "text"} placeholder={field.placeholder} value={value} onChange={onChange} />;
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
      {!exists && (
        <p className="text-sm text-muted-foreground sm:col-span-2">
          You have no professional profile yet. Fill this in to appear on the Professionals page.
        </p>
      )}
      {PROFESSIONAL_FIELDS.map((field) => (
        <div key={field.name} className={field.type === "textarea" ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
          <Label htmlFor={field.name}>{field.label}{field.required && " *"}</Label>
          {renderInput(field)}
          {errors[field.name] && <p className="text-xs text-destructive">{errors[field.name]}</p>}
        </div>
      ))}
      <div className="flex justify-end sm:col-span-2">
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : exists ? "Save profile" : "Create profile"}</Button>
      </div>
    </form>
  );
}

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
        
        <p className="text-sm">Role: <span className="font-mono">{profile?.role}</span></p>
        <p className="mt-1 text-sm text-muted-foreground">You can sign in with either your staff number or your Officer ID.</p>
      </Panel>
      <Panel title="My professional profile">
        <MyProfessionalProfile fullName={profile?.full_name} />
      </Panel>
      <Panel title="About VoltEdge">
        <p className="text-sm">
         Bringing every project, every drawing, and every deadline together.
         VoltEdge is a smart and centralized project management platform designed to simplify the daily operations of electrical design offices. It brings essential project information into one organized system, helping teams manage multiple projects efficiently, collaborate seamlessly, and stay on top of every deadline..
        </p>
        <p className="mt-2 text-sm text-muted-foreground">Office project, client and professional records.</p>
      </Panel>
    </div>
  );
}