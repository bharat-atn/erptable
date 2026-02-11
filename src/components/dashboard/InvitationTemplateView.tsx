import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { ChevronDown, GripVertical, Eye, EyeOff, Save, Loader2, AlertTriangle, FileText, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface TemplateField {
  id: string;
  field_key: string;
  section: string;
  label_en: string;
  label_sv: string;
  is_visible: boolean;
  is_required: boolean;
  sort_order: number;
  field_type: string;
}

const SECTION_LABELS: Record<string, { en: string; sv: string }> = {
  "2.1": { en: "Name and Address Information", sv: "Namn och Adressinformation" },
  "2.2": { en: "Birth and Contact Information", sv: "Födelse- och Kontaktinformation" },
  "2.3": { en: "Emergency Contact Information", sv: "Nödkontaktinformation" },
  "3": { en: "Bank Information", sv: "Bankinformation" },
  "4": { en: "ID / Passport Information", sv: "ID- / Passinformation" },
};

export function InvitationTemplateView() {
  const queryClient = useQueryClient();
  const [editedFields, setEditedFields] = useState<Map<string, Partial<TemplateField>>>(new Map());
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(Object.keys(SECTION_LABELS)));

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

  const saveFields = useMutation({
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

  const hasChanges = editedFields.size > 0;

  // Group fields by section
  const sections = Object.keys(SECTION_LABELS);
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
          onClick={() => saveFields.mutate()}
          disabled={!hasChanges || saveFields.isPending}
          className="gap-2"
        >
          {saveFields.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saveFields.isPending ? "Saving..." : "Save Changes"}
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
                          Section {section.key}: {section.en} / Sektion {section.key}: {section.sv}
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
                    {/* Table header */}
                    <div className="grid grid-cols-[1fr_1fr_80px_80px] gap-3 pb-2 mb-2 border-b border-border">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">English Label</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">Swedish Label</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50 text-center">Visible</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50 text-center">Required</span>
                    </div>

                    {section.fields.map((rawField) => {
                      const field = getField(rawField);
                      const isEdited = editedFields.has(rawField.id);

                      return (
                        <div
                          key={field.id}
                          className={cn(
                            "grid grid-cols-[1fr_1fr_80px_80px] gap-3 items-center py-2.5 rounded-lg px-2 -mx-2 transition-colors",
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
