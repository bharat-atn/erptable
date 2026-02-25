import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ChevronDown, Save, Loader2, AlertTriangle, FileText, Upload, X, Image } from "lucide-react";

const FIELD_TYPE_OPTIONS = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "mobile_phone", label: "Mobile Phone" },
  { value: "select", label: "Dropdown" },
  { value: "textarea", label: "Text Area" },
  { value: "checkbox", label: "Checkbox" },
  { value: "file", label: "File Upload" },
  { value: "url", label: "URL" },
] as const;
import { toast } from "sonner";

interface TemplateField {
  id: string;
  field_key: string;
  section: string;
  label_en: string;
  label_sv: string;
  label_ro: string;
  label_th: string;
  is_visible: boolean;
  is_required: boolean;
  sort_order: number;
  field_type: string;
}

const SECTION_LABELS: Record<string, { en: string; sv: string; displayKey: string | null }> = {
  "2.1": { en: "Name and Address Information", sv: "Namn och Adressinformation", displayKey: "2.1" },
  "2.2": { en: "Birth and Contact Information", sv: "Födelse- och Kontaktinformation", displayKey: "2.2" },
  "2.3": { en: "Emergency Contact Information", sv: "Nödkontaktinformation", displayKey: "2.3" },
  "3": { en: "Bank Information", sv: "Bankinformation", displayKey: null },
  "4": { en: "ID / Passport Information", sv: "ID- / Passinformation", displayKey: null },
};

interface LogoSettings {
  dataUrl: string;
  size: number; // percentage 50-200
  padding: number; // px 0-48
}

function loadLogo(): LogoSettings | null {
  try {
    const saved = localStorage.getItem("invitation-template-logo-v2");
    if (saved) return JSON.parse(saved);
    // migrate from old format
    const old = localStorage.getItem("invitation-template-logo");
    if (old) return { dataUrl: old, size: 100, padding: 16 };
    return null;
  } catch { return null; }
}

function saveLogo(settings: LogoSettings | null) {
  if (settings) {
    localStorage.setItem("invitation-template-logo-v2", JSON.stringify(settings));
  } else {
    localStorage.removeItem("invitation-template-logo-v2");
    localStorage.removeItem("invitation-template-logo");
  }
}

export function InvitationTemplateView() {
  const queryClient = useQueryClient();
  const [editedFields, setEditedFields] = useState<Map<string, Partial<TemplateField>>>(new Map());
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(Object.keys(SECTION_LABELS)));
  const [logoSettings, setLogoSettings] = useState<LogoSettings | null>(loadLogo);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: fields = [], isLoading } = useQuery({
    queryKey: ["invitation-template-fields"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invitation_template_fields")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as TemplateField[];
    },
  });

  const saveFieldsMutation = useMutation({
    mutationFn: async () => {
      const updates = Array.from(editedFields.entries()).map(([id, changes]) => ({
        id,
        ...changes,
      }));

      for (const update of updates) {
        const { id, ...rest } = update;
        const { error } = await supabase
          .from("invitation_template_fields")
          .update(rest)
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitation-template-fields"] });
      setEditedFields(new Map());
      toast.success("Template saved successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  const getField = (field: TemplateField): TemplateField => {
    const edits = editedFields.get(field.id);
    return edits ? { ...field, ...edits } : field;
  };

  const updateField = (id: string, changes: Partial<TemplateField>) => {
    setEditedFields((prev) => {
      const next = new Map(prev);
      next.set(id, { ...(prev.get(id) || {}), ...changes });
      return next;
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newSettings: LogoSettings = { dataUrl, size: logoSettings?.size ?? 100, padding: logoSettings?.padding ?? 16 };
      setLogoSettings(newSettings);
      saveLogo(newSettings);
      toast.success("Logo uploaded successfully");
    };
    reader.readAsDataURL(file);
  };

  const updateLogoSetting = (key: "size" | "padding", value: number) => {
    if (!logoSettings) return;
    const updated = { ...logoSettings, [key]: value };
    setLogoSettings(updated);
    saveLogo(updated);
  };

  const removeLogo = () => {
    setLogoSettings(null);
    saveLogo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.success("Logo removed");
  };

  const hasChanges = editedFields.size > 0;

  const sections = ["2.1", "2.2", "2.3", "3", "4"];
  const fieldsBySection = sections.map((sectionKey) => ({
    key: sectionKey,
    ...SECTION_LABELS[sectionKey],
    fields: fields
      .filter((f) => f.section === sectionKey)
      .sort((a, b) => a.sort_order - b.sort_order),
  }));

  const toggleSection = (key: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Invitation Template
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure which fields appear on the candidate onboarding form and set their requirements
          </p>
        </div>
        <Button
          onClick={() => saveFieldsMutation.mutate()}
          disabled={!hasChanges || saveFieldsMutation.isPending}
          className="gap-2"
        >
          {saveFieldsMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saveFieldsMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {hasChanges && (
        <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-3 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-primary shrink-0" />
          <p className="text-sm text-primary font-medium">
            You have unsaved changes. Click "Save Changes" to apply them to all future invitations.
          </p>
        </div>
      )}

      {/* Logo Upload Section */}
      <Card className="shadow-md">
        <CardHeader className="py-3 px-5">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-primary">
            <Image className="w-4 h-4" />
            Section 1: Form Logo / Sektion 1: Formulärlogotyp
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-4 pt-0">
          <p className="text-xs text-muted-foreground mb-3">
            Upload a company logo to display at the top of the onboarding form sent to candidates.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />
          {logoSettings ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div
                  className="border border-border rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden"
                  style={{ padding: `${logoSettings.padding}px`, width: "auto", maxWidth: "300px" }}
                >
                  <img
                    src={logoSettings.dataUrl}
                    alt="Form logo"
                    className="object-contain"
                    style={{ width: `${logoSettings.size}px` }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
                    <Upload className="w-3.5 h-3.5" />
                    Replace Logo
                  </Button>
                  <Button variant="ghost" size="sm" onClick={removeLogo} className="gap-2 text-destructive hover:text-destructive">
                    <X className="w-3.5 h-3.5" />
                    Remove
                  </Button>
                </div>
              </div>
              {/* Size & Padding controls */}
              <div className="grid grid-cols-2 gap-4 max-w-sm">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Logo Size: {logoSettings.size}px</Label>
                  <Slider
                    value={[logoSettings.size]}
                    onValueChange={([v]) => updateLogoSetting("size", v)}
                    min={32}
                    max={200}
                    step={4}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Padding: {logoSettings.padding}px</Label>
                  <Slider
                    value={[logoSettings.padding]}
                    onValueChange={([v]) => updateLogoSetting("padding", v)}
                    min={0}
                    max={48}
                    step={4}
                  />
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-sm border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
            >
              <Upload className="w-6 h-6 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Click to upload logo</span>
              <span className="text-xs text-muted-foreground/60">PNG, JPG or SVG — max 2MB</span>
            </button>
          )}
        </CardContent>
      </Card>

      {/* Field Sections */}
      <div className="space-y-4">
        {fieldsBySection.map((section) => {
          const isOpen = openSections.has(section.key);
          const visibleCount = section.fields.filter((f) => getField(f).is_visible).length;
          const requiredCount = section.fields.filter((f) => getField(f).is_required && getField(f).is_visible).length;

          return (
            <Card key={section.key} className="shadow-md">
              <Collapsible open={isOpen} onOpenChange={() => toggleSection(section.key)}>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="py-3 px-5 cursor-pointer hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <span className="text-primary">
                          {section.displayKey
                            ? `Section ${section.displayKey}: ${section.en} / Sektion ${section.displayKey}: ${section.sv}`
                            : `${section.en} / ${section.sv}`
                          }
                        </span>
                      </CardTitle>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">
                            {visibleCount}/{section.fields.length} visible
                          </Badge>
                          <Badge variant="pending" className="text-[10px]">
                            {requiredCount} required
                          </Badge>
                        </div>
                        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4 px-5">
                    <div className="grid grid-cols-[1fr_1fr_1fr_1fr_80px_80px_120px] gap-3 pb-2 mb-2 border-b border-border">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">English Label</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">Swedish Label</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">Romanian Label</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">Thai Label</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50 text-center">Visible</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50 text-center">Required</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">Field Type</span>
                    </div>

                    {section.fields.map((rawField) => {
                      const field = getField(rawField);
                      const isEdited = editedFields.has(rawField.id);

                      return (
                        <div
                          key={field.id}
                          className={cn(
                            "grid grid-cols-[1fr_1fr_1fr_1fr_80px_80px_120px] gap-3 items-center py-2.5 rounded-lg px-2 -mx-2 transition-colors",
                            !field.is_visible && "opacity-50",
                            isEdited && "bg-primary/5"
                          )}
                        >
                          <Input
                            value={field.label_en}
                            onChange={(e) => updateField(rawField.id, { label_en: e.target.value })}
                            className="h-9 text-sm"
                          />
                          <Input
                            value={field.label_sv}
                            onChange={(e) => updateField(rawField.id, { label_sv: e.target.value })}
                            className="h-9 text-sm"
                          />
                          <Input
                            value={field.label_ro}
                            onChange={(e) => updateField(rawField.id, { label_ro: e.target.value })}
                            className="h-9 text-sm"
                          />
                          <Input
                            value={field.label_th}
                            onChange={(e) => updateField(rawField.id, { label_th: e.target.value })}
                            className="h-9 text-sm"
                          />
                          <div className="flex justify-center">
                            <Switch
                              checked={field.is_visible}
                              onCheckedChange={(checked) =>
                                updateField(rawField.id, {
                                  is_visible: checked,
                                  ...(checked ? {} : { is_required: false }),
                                })
                              }
                            />
                          </div>
                          <div className="flex justify-center">
                            <Switch
                              checked={field.is_required}
                              disabled={!field.is_visible}
                              onCheckedChange={(checked) =>
                                updateField(rawField.id, { is_required: checked })
                              }
                            />
                          </div>
                          <Select
                            value={field.field_type || "text"}
                            onValueChange={(value) => updateField(rawField.id, { field_type: value })}
                          >
                            <SelectTrigger className="h-9 text-xs bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[200] bg-popover">
                              {FIELD_TYPE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
