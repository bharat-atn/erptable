import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface SubmissionViewDialogProps {
  employeeId: string | null;
  onOpenChange: (open: boolean) => void;
}

type FieldDef = { key: string; label: string };

const SECTIONS: { title: string; fields: FieldDef[] }[] = [
  {
    title: "Personal Information",
    fields: [
      { key: "preferredName", label: "Preferred Name" },
      { key: "nationality", label: "Nationality" },
      { key: "citizenship", label: "Citizenship" },
    ],
  },
  {
    title: "Address",
    fields: [
      { key: "address", label: "Address" },
      { key: "postcode", label: "Postcode" },
      { key: "city", label: "City" },
      { key: "country", label: "Country" },
    ],
  },
  {
    title: "Birth & Contact",
    fields: [
      { key: "dateOfBirth", label: "Date of Birth" },
      { key: "gender", label: "Gender" },
      { key: "mobilePhone", label: "Mobile Phone" },
      { key: "privateEmail", label: "Private Email" },
    ],
  },
  {
    title: "Emergency Contact",
    fields: [
      { key: "emergencyName", label: "Name" },
      { key: "emergencyRelation", label: "Relation" },
      { key: "emergencyPhone", label: "Phone" },
    ],
  },
  {
    title: "Bank Details",
    fields: [
      { key: "bankName", label: "Bank Name" },
      { key: "clearingNumber", label: "Clearing Number" },
      { key: "accountNumber", label: "Account Number" },
    ],
  },
  {
    title: "Swedish ID Numbers",
    fields: [
      { key: "personnummer", label: "Personnummer" },
      { key: "samordningsnummer", label: "Samordningsnummer" },
    ],
  },
];

function extractValue(info: Record<string, unknown>, key: string): string {
  // Handle nested emergency contact object
  if (key === "emergencyName" && typeof info.emergencyContact === "object" && info.emergencyContact) {
    return String((info.emergencyContact as Record<string, unknown>).name ?? "");
  }
  if (key === "emergencyRelation" && typeof info.emergencyContact === "object" && info.emergencyContact) {
    return String((info.emergencyContact as Record<string, unknown>).relation ?? "");
  }
  if (key === "emergencyPhone" && typeof info.emergencyContact === "object" && info.emergencyContact) {
    return String((info.emergencyContact as Record<string, unknown>).phone ?? "");
  }
  // Flat keys or snake_case fallback
  const val = info[key] ?? info[toSnake(key)];
  if (val === null || val === undefined || val === "") return "";
  return String(val);
}

function toSnake(s: string) {
  return s.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
}

export function SubmissionViewDialog({ employeeId, onOpenChange }: SubmissionViewDialogProps) {
  const { data: employee, isLoading } = useQuery({
    queryKey: ["employee-submission", employeeId],
    enabled: !!employeeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("first_name, last_name, email, personal_info")
        .eq("id", employeeId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const info = (employee?.personal_info ?? {}) as Record<string, unknown>;
  const name = employee ? `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() || employee.email : "";

  return (
    <Dialog open={!!employeeId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Onboarding Submission</DialogTitle>
          <DialogDescription>{name ? `Submitted by ${name}` : "Loading…"}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] px-6 pb-6">
          {isLoading ? (
            <div className="space-y-4 py-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-6 py-2">
              {SECTIONS.map((section, idx) => {
                const hasAny = section.fields.some((f) => extractValue(info, f.key));
                return (
                  <div key={section.title}>
                    {idx > 0 && <Separator className="mb-4" />}
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">{section.title}</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      {section.fields.map((field) => {
                        const val = extractValue(info, field.key);
                        return (
                          <div key={field.key} className="space-y-0.5">
                            <p className="text-xs text-muted-foreground">{field.label}</p>
                            <p className="text-sm font-medium">{val || "—"}</p>
                          </div>
                        );
                      })}
                    </div>
                    {!hasAny && <p className="text-xs text-muted-foreground italic">No data submitted</p>}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
