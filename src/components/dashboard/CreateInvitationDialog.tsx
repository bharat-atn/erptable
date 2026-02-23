import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { Plus, Loader2, Mail, ChevronsUpDown, Check, Copy, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const LANGUAGE_OPTIONS = [
  { value: "sv", label: "Swedish only / Bara svenska" },
  { value: "en", label: "English only" },
  { value: "en_sv", label: "English + Swedish / Engelska + Svenska" },
  { value: "ro_en", label: "Romanian + English / Română + Engleză" },
  { value: "th_en", label: "Thai + English / ไทย + อังกฤษ" },
];

type EmailResult = {
  success: boolean;
  fallback?: boolean;
  onboardingLink?: string;
  recipientEmail?: string;
  employeeName?: string;
  message?: string;
};

export function CreateInvitationDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState<"NEW_HIRE" | "CONTRACT_RENEWAL">("NEW_HIRE");
  const [language, setLanguage] = useState("en_sv");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [employeePickerOpen, setEmployeePickerOpen] = useState(false);
  const [emailResult, setEmailResult] = useState<EmailResult | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const queryClient = useQueryClient();

  const { data: employees } = useQuery({
    queryKey: ["employees-for-renewal"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, middle_name, last_name, email, employee_code, status")
        .order("first_name");
      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  const selectedEmployee = employees?.find((e) => e.id === selectedEmployeeId);

  const createInvitation = useMutation({
    mutationFn: async () => {
      let employeeId: string | undefined;

      if (type === "CONTRACT_RENEWAL") {
        if (!selectedEmployeeId) {
          throw new Error("Please select an employee for contract renewal");
        }
        employeeId = selectedEmployeeId;
      } else {
        if (!email.trim()) {
          throw new Error("Please enter an email address");
        }
        const { data: existingEmployee } = await supabase
          .from("employees")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (existingEmployee) {
          throw new Error("Employee already exists with this email");
        }

        const { data: newEmployee, error: empError } = await supabase
          .from("employees")
          .insert([{
            email,
            first_name: firstName.trim() || null,
            middle_name: middleName.trim() || null,
            last_name: lastName.trim() || null,
            status: "INVITED" as const,
          }])
          .select("id")
          .single();

        if (empError) throw empError;
        employeeId = newEmployee.id;
      }

      const { data, error } = await supabase
        .from("invitations")
        .insert([{
          employee_id: employeeId,
          type: type as "NEW_HIRE" | "CONTRACT_RENEWAL",
          status: "PENDING" as const,
          language,
        }])
        .select()
        .single();

      if (error) throw error;

      // Now send the invitation email
      try {
        const { data: emailData, error: emailError } = await supabase.functions.invoke(
          "send-invitation-email",
          {
            body: {
              invitationId: data.id,
              baseUrl: "https://erptable.lovable.app",
            },
          }
        );

        if (emailError) {
          console.error("Email function error:", emailError);
          // Fallback: show link for manual copy
          setEmailResult({
            success: false,
            fallback: true,
            onboardingLink: `https://erptable.lovable.app/onboard/${data.token}`,
            recipientEmail: type === "CONTRACT_RENEWAL" ? selectedEmployee?.email : email,
            employeeName: type === "CONTRACT_RENEWAL"
              ? [selectedEmployee?.first_name, selectedEmployee?.last_name].filter(Boolean).join(" ")
              : [firstName, lastName].filter(Boolean).join(" "),
            message: "Could not send email. Copy the link below and send it manually.",
          });
        } else {
          setEmailResult(emailData as EmailResult);
        }
      } catch {
        // Edge function unreachable — show fallback
        setEmailResult({
          success: false,
          fallback: true,
          onboardingLink: `${window.location.origin}/onboard/${data.token}`,
          recipientEmail: type === "CONTRACT_RENEWAL" ? selectedEmployee?.email : email,
          employeeName: type === "CONTRACT_RENEWAL"
            ? [selectedEmployee?.first_name, selectedEmployee?.last_name].filter(Boolean).join(" ")
            : [firstName, lastName].filter(Boolean).join(" "),
          message: "Could not reach email service. Copy the link below and send it manually.",
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations-table"] });
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employees-for-renewal"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setIsOpen(false);
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setEmail("");
    setType("NEW_HIRE");
    setLanguage("en_sv");
    setSelectedEmployeeId(null);
    setEmailResult(null);
    setLinkCopied(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === "NEW_HIRE") {
      const missing: string[] = [];
      if (!firstName.trim()) missing.push("First Name");
      if (!lastName.trim()) missing.push("Last Name");
      if (!email.trim()) missing.push("Email");
      if (missing.length > 0) {
        toast.error(`Please fill in: ${missing.join(", ")}`);
        return;
      }
    }
    if (type === "CONTRACT_RENEWAL" && !selectedEmployeeId) {
      toast.error("Please select an employee");
      return;
    }
    createInvitation.mutate();
  };

  const copyLink = () => {
    if (emailResult?.onboardingLink) {
      navigator.clipboard.writeText(emailResult.onboardingLink);
      setLinkCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setLinkCopied(false), 3000);
    }
  };

  const isFormValid = type === "CONTRACT_RENEWAL"
    ? !!selectedEmployeeId
    : !!(firstName.trim() && lastName.trim() && email.trim());

  const getEmployeeLabel = (emp: NonNullable<typeof employees>[number]) => {
    const name = [emp.first_name, emp.last_name].filter(Boolean).join(" ") || "Unnamed";
    return `${name} (${emp.employee_code || emp.email})`;
  };

  // After email was sent (or fallback), show result screen
  if (emailResult) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsOpen(true); }}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Invitation
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {emailResult.success ? "Invitation Sent" : "Invitation Created"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {emailResult.success ? (
              <div className="flex flex-col items-center text-center gap-3 py-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email sent successfully!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    An onboarding invitation was sent to <strong>{emailResult.recipientEmail}</strong>
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center gap-3 py-2">
                <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-medium">{emailResult.message}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Send this link to <strong>{emailResult.recipientEmail}</strong>
                  </p>
                </div>
              </div>
            )}

            {/* Always show the link for reference/copying */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Onboarding Link</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={emailResult.onboardingLink || ""}
                  className="text-xs font-mono bg-muted"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={copyLink}
                >
                  {linkCopied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <Button className="w-full" onClick={resetForm}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Invitation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">New Invitation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Invitation Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Invitation Type</Label>
            <Select value={type} onValueChange={(v) => {
              setType(v as typeof type);
              setSelectedEmployeeId(null);
            }}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEW_HIRE">New Hire Onboarding</SelectItem>
                <SelectItem value="CONTRACT_RENEWAL">Contract Renewal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Language Selection */}
          <div className="space-y-2">
            <Label>Onboarding Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose the preferred language for the onboarding form
            </p>
          </div>

          {type === "CONTRACT_RENEWAL" ? (
            <div className="space-y-2">
              <Label>Select Employee</Label>
              <Popover open={employeePickerOpen} onOpenChange={setEmployeePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={employeePickerOpen}
                    className="w-full justify-between font-normal"
                  >
                    {selectedEmployee
                      ? getEmployeeLabel(selectedEmployee)
                      : "Search employee register..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search by name, email, or code..." />
                    <CommandList>
                      <CommandEmpty>No employees found.</CommandEmpty>
                      <CommandGroup>
                        {employees?.map((emp) => (
                          <CommandItem
                            key={emp.id}
                            value={`${emp.first_name} ${emp.last_name} ${emp.email} ${emp.employee_code}`}
                            onSelect={() => {
                              setSelectedEmployeeId(emp.id);
                              setEmployeePickerOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedEmployeeId === emp.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {[emp.first_name, emp.last_name].filter(Boolean).join(" ") || "Unnamed"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {emp.employee_code || "—"} · {emp.email}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="firstName"
                    placeholder="Jane"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    placeholder="Marie"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="candidate@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={createInvitation.isPending || !isFormValid}>
            {createInvitation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Mail className="w-4 h-4 mr-2" />
            )}
            Send Invitation
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
