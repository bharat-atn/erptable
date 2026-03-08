import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MappingPreset {
  id: string;
  name: string;
  mappings: Record<string, string>;
  created_at: string;
}

interface ImportDraft {
  id: string;
  name: string;
  step: number;
  file_name: string | null;
  raw_headers: string[];
  mappings: Record<string, string>;
  mapped_data: any[];
  raw_csv_rows: any[];
  row_count: number;
  created_at: string;
  updated_at: string;
}

export function useImportPresets(orgId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ["import-mapping-presets", orgId];

  const { data: presets = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("import_mapping_presets" as any)
        .select("id, name, mappings, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as MappingPreset[];
    },
    enabled: !!orgId,
  });

  const savePreset = useMutation({
    mutationFn: async ({ name, mappings }: { name: string; mappings: Record<string, string> }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("import_mapping_presets" as any).insert({
        name,
        mappings,
        created_by: userData.user?.id || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Mapping preset saved");
    },
    onError: (err: any) => toast.error("Failed to save preset: " + err.message),
  });

  const deletePreset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("import_mapping_presets" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Preset deleted");
    },
    onError: (err: any) => toast.error("Failed to delete preset: " + err.message),
  });

  return { presets, isLoading, savePreset, deletePreset };
}

export function useImportDrafts(orgId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ["import-drafts", orgId];

  const { data: drafts = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("import_drafts" as any)
        .select("id, name, step, file_name, raw_headers, mappings, mapped_data, row_count, created_at, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ImportDraft[];
    },
    enabled: !!orgId,
  });

  const saveDraft = useMutation({
    mutationFn: async (draft: {
      id?: string;
      name: string;
      step: number;
      file_name: string;
      raw_headers: string[];
      mappings: Record<string, string>;
      mapped_data: any[];
      row_count: number;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (draft.id) {
        const { error } = await supabase
          .from("import_drafts" as any)
          .update({
            name: draft.name,
            step: draft.step,
            file_name: draft.file_name,
            raw_headers: draft.raw_headers,
            mappings: draft.mappings,
            mapped_data: draft.mapped_data,
            row_count: draft.row_count,
            updated_at: new Date().toISOString(),
          } as any)
          .eq("id", draft.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("import_drafts" as any).insert({
          name: draft.name,
          step: draft.step,
          file_name: draft.file_name,
          raw_headers: draft.raw_headers,
          mappings: draft.mappings,
          mapped_data: draft.mapped_data,
          row_count: draft.row_count,
          created_by: userData.user?.id || null,
        } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Draft saved");
    },
    onError: (err: any) => toast.error("Failed to save draft: " + err.message),
  });

  const deleteDraft = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("import_drafts" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Draft deleted");
    },
    onError: (err: any) => toast.error("Failed to delete draft: " + err.message),
  });

  return { drafts, isLoading, saveDraft, deleteDraft };
}
