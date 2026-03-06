import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Building2,
  FlaskConical,
  Loader2,
  Search,
  ShieldCheck,
  ShieldAlert,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

interface CreateOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (orgId: string) => void;
}

interface LookupResult {
  org_number: string;
  address: string;
  postcode: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  official_name: string;
  confidence: string;
  source: string;
}

export function CreateOrganizationDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateOrganizationDialogProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [orgType, setOrgType] = useState<"production" | "sandbox">("production");
  const [orgNumber, setOrgNumber] = useState("");
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Sweden");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [creating, setCreating] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);
  const [lookupConfidence, setLookupConfidence] = useState<string | null>(null);
  const [lookupSource, setLookupSource] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const generateSlug = (val: string) =>
    val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(val));
    }
  };

  const handleLookup = async () => {
    if (!name.trim()) return;
    setLookingUp(true);
    setLookupError(null);
    setLookupDone(false);
    try {
      const { data, error } = await supabase.functions.invoke("lookup-company", {
        body: { company_name: name.trim(), org_number: orgNumber || undefined },
      });
      if (error) throw error;
      if (!data || data.error) throw new Error(data?.error || "Lookup failed");

      const d = data.data || data;
      if (d.official_name) {
        setName(d.official_name);
        setSlug(generateSlug(d.official_name));
      }
      if (d.org_number) setOrgNumber(d.org_number);
      if (d.address) setAddress(d.address);
      if (d.postcode) setPostcode(d.postcode);
      if (d.city) setCity(d.city?.toUpperCase() || "");
      if (d.country) setCountry(d.country);
      if (d.phone) setPhone(d.phone);
      if (d.email) setEmail(d.email);
      if (d.website) setWebsite(d.website);
      setLookupConfidence(d.confidence || "medium");
      setLookupSource(d.source || "AI");
      setLookupDone(true);
      toast.success("Company details found!");
    } catch (err: any) {
      setLookupError(err.message || "Lookup failed");
      toast.error("Lookup failed: " + (err.message || "Unknown error"));
    } finally {
      setLookingUp(false);
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim()) return;
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: org, error } = await supabase
        .from("organizations")
        .insert({
          name: name.trim(),
          slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
          org_type: orgType,
          created_by: user.id,
          org_number: orgNumber || null,
          address: address || null,
          postcode: postcode || null,
          city: city || null,
          country: country || null,
          phone: phone || null,
          email: email || null,
          website: website || null,
        } as any)
        .select("id")
        .single();

      if (error) throw error;

      await supabase.from("org_members").insert({
        org_id: org.id,
        user_id: user.id,
        role: "owner",
      } as any);

      // Auto-create a company record seeded from org details
      await supabase.from("companies").insert({
        org_id: org.id,
        name: name.trim(),
        org_number: orgNumber || null,
        address: address || null,
        postcode: postcode || null,
        city: city || null,
        country: country || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
      } as any);

      toast.success(`Organization "${name}" created!`);
      resetForm();
      onOpenChange(false);
      onCreated(org.id);
    } catch (err: any) {
      toast.error(err.message || "Failed to create organization");
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setName(""); setSlug(""); setOrgNumber(""); setAddress("");
    setPostcode(""); setCity(""); setCountry("Sweden"); setPhone("");
    setEmail(""); setWebsite(""); setLookupDone(false);
    setLookupConfidence(null); setLookupSource(null); setLookupError(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name + Lookup */}
          <div>
            <Label>Company Name</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Acme AB"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLookup}
                disabled={lookingUp || !name.trim()}
                className="gap-1.5 shrink-0"
              >
                {lookingUp ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Lookup
              </Button>
            </div>
          </div>

          {/* Lookup status */}
          {lookupDone && (
            <div className="flex items-center gap-2 text-sm">
              {lookupConfidence === "high" ? (
                <Badge variant="success" className="gap-1">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </Badge>
              ) : (
                <Badge variant="warning" className="gap-1">
                  <ShieldAlert className="w-3 h-3" /> Unverified
                </Badge>
              )}
              {lookupSource && (
                <span className="text-muted-foreground text-xs">
                  Source: {lookupSource}
                </span>
              )}
            </div>
          )}
          {lookupError && (
            <p className="text-xs text-destructive">{lookupError}</p>
          )}

          {/* Org Number */}
          <div>
            <Label>Organization Number</Label>
            <Input
              value={orgNumber}
              onChange={(e) => setOrgNumber(e.target.value)}
              placeholder="556123-4567"
            />
          </div>

          {/* Slug */}
          <div>
            <Label>Slug</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="acme-ab"
            />
          </div>

          {/* Address row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street 1" />
            </div>
            <div>
              <Label>Postcode</Label>
              <Input value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="123 45" />
            </div>
            <div>
              <Label>City</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="STOCKHOLM" />
            </div>
          </div>

          <div>
            <Label>Country</Label>
            <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Sweden" />
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+46 70 123 4567" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@acme.se" />
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Website
            </Label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://acme.se" />
          </div>

          {/* Type */}
          <div>
            <Label>Type</Label>
            <div className="flex gap-2 mt-1">
              <Button
                variant={orgType === "production" ? "default" : "outline"}
                size="sm"
                onClick={() => setOrgType("production")}
                className="gap-1.5"
              >
                <Building2 className="w-4 h-4" />
                Production
              </Button>
              <Button
                variant={orgType === "sandbox" ? "default" : "outline"}
                size="sm"
                onClick={() => setOrgType("sandbox")}
                className="gap-1.5"
              >
                <FlaskConical className="w-4 h-4" />
                Sandbox
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); resetForm(); }}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={creating || !name.trim()}>
            {creating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
