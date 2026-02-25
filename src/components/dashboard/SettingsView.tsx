import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building, Bell, Shield, PenTool, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

export function SettingsView() {
  const [defaultSigUrl, setDefaultSigUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loadingSig, setLoadingSig] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadingSig(false); return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("default_signature_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile?.default_signature_url) {
        setDefaultSigUrl(profile.default_signature_url);
      }
      setLoadingSig(false);
    };
    load();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large. Max 2MB.");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const filePath = `employer-default/${user.id}.png`;
      const { error: uploadErr } = await supabase.storage
        .from("signatures")
        .upload(filePath, file, { upsert: true, contentType: file.type });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("signatures").getPublicUrl(filePath);

      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ default_signature_url: urlData.publicUrl } as any)
        .eq("user_id", user.id);
      if (updateErr) throw updateErr;

      setDefaultSigUrl(urlData.publicUrl);
      toast.success("Default signature saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload signature");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      await supabase.storage.from("signatures").remove([`employer-default/${user.id}.png`]);

      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ default_signature_url: null } as any)
        .eq("user_id", user.id);
      if (updateErr) throw updateErr;

      setDefaultSigUrl(null);
      toast.success("Default signature removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove signature");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your organization settings
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Building className="w-4 h-4 text-primary" />
              Organization
            </CardTitle>
            <CardDescription>
              Update your organization details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input id="orgName" placeholder="Acme Inc." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input id="domain" placeholder="acme.com" />
              </div>
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Default Employer Signature */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <PenTool className="w-4 h-4 text-primary" />
              Default Employer Signature
            </CardTitle>
            <CardDescription>
              Upload a default signature image to use when counter-signing contracts. This saves you from drawing your signature every time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingSig ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading...
              </div>
            ) : defaultSigUrl ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <img
                    src={defaultSigUrl}
                    alt="Default signature"
                    className="max-h-[100px] mx-auto"
                  />
                </div>
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      className="hidden"
                      onChange={handleUpload}
                      disabled={uploading}
                    />
                    <Button variant="outline" size="sm" asChild disabled={uploading}>
                      <span className="gap-2">
                        <Upload className="w-4 h-4" />
                        Replace
                      </span>
                    </Button>
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemove}
                    disabled={uploading}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
                  <PenTool className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No default signature uploaded yet.
                  </p>
                </div>
                <label className="cursor-pointer inline-block">
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={handleUpload}
                    disabled={uploading}
                  />
                  <Button variant="default" size="sm" asChild disabled={uploading}>
                    <span className="gap-2">
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload Signature Image
                    </span>
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground">
                  Accepted formats: PNG, JPG. Max size: 2MB.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Notification settings coming soon...
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Security
            </CardTitle>
            <CardDescription>
              Manage security settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Security settings coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
