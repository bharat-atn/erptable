import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Building2, MapPin, Upload } from "lucide-react";
import { toast } from "sonner";

interface BasicInfoTabProps {
  project: any;
  onSave: (updates: Record<string, any>) => Promise<void>;
  orgId: string | null;
}

export function BasicInfoTab({ project, onSave, orgId }: BasicInfoTabProps) {
  const [name, setName] = useState(project?.name || "");
  const [type, setType] = useState(project?.type || "clearing");
  const [clientId, setClientId] = useState(project?.client_id || "");
  const [purchaseOrder, setPurchaseOrder] = useState(project?.purchase_order_number || "");
  const [location, setLocation] = useState(project?.location || "");
  const [gps, setGps] = useState(project?.gps_coordinates || "");
  const [description, setDescription] = useState(project?.description || "");

  useEffect(() => {
    if (project) {
      setName(project.name || "");
      setType(project.type || "clearing");
      setClientId(project.client_id || "");
      setPurchaseOrder(project.purchase_order_number || "");
      setLocation(project.location || "");
      setGps(project.gps_coordinates || "");
      setDescription(project.description || "");
    }
  }, [project]);

  const { data: clients = [] } = useQuery({
    queryKey: ["forestry-clients", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase
        .from("forestry_clients")
        .select("id, company_name, client_number")
        .eq("org_id", orgId)
        .eq("status", "active")
        .order("company_name");
      return data || [];
    },
    enabled: !!orgId,
  });

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Project name is required"); return; }
    if (!location.trim()) { toast.error("Location is required"); return; }
    const clientName = clients.find((c: any) => c.id === clientId)?.company_name || project?.client || "";
    await onSave({
      name: name.trim(),
      type,
      client_id: clientId || null,
      client: clientName,
      purchase_order_number: purchaseOrder || null,
      location: location.trim(),
      gps_coordinates: gps || null,
      description: description || null,
    });
    toast.success("Basic info saved");
  };

  return (
    <div className="space-y-6">
      {/* Project Identity */}
      <Card className="border-border/60">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-primary/10"><FileText className="w-4 h-4 text-primary" /></div>
            <h3 className="font-semibold text-foreground">Project Identity</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Project Number</Label>
              <Input value={project?.project_id_display || ""} disabled className="bg-muted/50 font-mono" />
              <span className="text-[10px] text-muted-foreground">Auto-generated</span>
            </div>
            <div>
              <Label className="text-xs">Project Name <span className="text-destructive">*</span></Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sala röjning på Ösby Gårds skogsmark" />
            </div>
            <div>
              <Label className="text-xs">Project Type <span className="text-destructive">*</span></Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="clearing">Forest Clearing</SelectItem>
                  <SelectItem value="planting">Forest Planting</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client & Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-primary/10"><Building2 className="w-4 h-4 text-primary" /></div>
              <h3 className="font-semibold text-foreground">Client Information</h3>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Client <span className="text-destructive">*</span></Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger><SelectValue placeholder="Select client..." /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Purchase Order Number <span className="text-destructive">*</span></Label>
                <Input value={purchaseOrder} onChange={(e) => setPurchaseOrder(e.target.value)} placeholder="e.g. PO-81669" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-primary/10"><MapPin className="w-4 h-4 text-primary" /></div>
              <h3 className="font-semibold text-foreground">Location Details</h3>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Location <span className="text-destructive">*</span></Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Ösby Gård" />
              </div>
              <div>
                <Label className="text-xs">GPS Coordinates</Label>
                <Input value={gps} onChange={(e) => setGps(e.target.value)} placeholder="16.6077, 59.9239" />
                <span className="text-[10px] text-muted-foreground">Optional: Longitude, Latitude (GeoJSON format)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      <Card className="border-border/60">
        <CardContent className="pt-6">
          <Label className="text-xs">Project Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Brief description of the project scope and objectives..."
            className="mt-1.5"
          />
        </CardContent>
      </Card>

      {/* Appendix Documents */}
      <Card className="border-border/60">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-primary/10"><Upload className="w-4 h-4 text-primary" /></div>
            <h3 className="font-semibold text-foreground">Appendix Documents</h3>
          </div>
          <div>
            <Label className="text-xs">Upload PDF Documents</Label>
            <div className="mt-1.5 border-2 border-dashed border-border rounded-lg p-6 text-center text-sm text-muted-foreground">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
              <p>Drag & drop PDF files here, or click to browse</p>
              <p className="text-[10px] mt-1">Upload PDF files to include as appendices in the project report</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">Initialize Project</Button>
      </div>
    </div>
  );
}
