import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { toast } from "sonner";
import { Plus, Loader2, Mail } from "lucide-react";

export function CreateInvitationDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState<"NEW_HIRE" | "CONTRACT_RENEWAL">("NEW_HIRE");
  const queryClient = useQueryClient();

  const createInvitation = useMutation({
    mutationFn: async () => {
      // Check if employee exists
      const { data: existingEmployee } = await supabase
        .from("employees")
        .select("id")
        .eq("email", email)
        .single();

      let employeeId = existingEmployee?.id;

      if (type === "NEW_HIRE") {
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
      } else if (!existingEmployee) {
        throw new Error("Employee not found for contract renewal");
      }

      const { data, error } = await supabase
        .from("invitations")
        .insert([{
          employee_id: employeeId,
          type: type as "NEW_HIRE" | "CONTRACT_RENEWAL",
          status: "PENDING" as const,
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    createInvitation.mutate();
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
          {/* Name Fields Row */}
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

          {/* Email Field */}
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

          {/* Invitation Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Invitation Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEW_HIRE">New Hire Onboarding</SelectItem>
                <SelectItem value="CONTRACT_RENEWAL">Contract Renewal</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
