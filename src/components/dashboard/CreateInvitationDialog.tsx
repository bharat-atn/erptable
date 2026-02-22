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
import { Plus, Loader2, Mail, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const LANGUAGE_OPTIONS = [
  { value: "sv", label: "Swedish only / Bara svenska" },
  { value: "en", label: "English only" },
  { value: "en_sv", label: "English + Swedish / Engelska + Svenska" },
  { value: "ro_en", label: "Romanian + English / Română + Engleză" },
  { value: "th_en", label: "Thai + English / ไทย + อังกฤษ" },
];

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
        // NEW_HIRE flow
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
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations-table"] });
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employees-for-renewal"] });
      toast.success("Invitation created successfully!");
      resetForm();
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === "NEW_HIRE" && !email.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    if (type === "CONTRACT_RENEWAL" && !selectedEmployeeId) {
      toast.error("Please select an employee");
      return;
    }
    createInvitation.mutate();
  };

  const getEmployeeLabel = (emp: NonNullable<typeof employees>[number]) => {
    const name = [emp.first_name, emp.last_name].filter(Boolean).join(" ") || "Unnamed";
    return `${name} (${emp.employee_code || emp.email})`;
  };

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
            /* Employee Picker for Contract Renewal */
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
            /* New Hire Fields */
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="Jane"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
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
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
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

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={createInvitation.isPending}>
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
