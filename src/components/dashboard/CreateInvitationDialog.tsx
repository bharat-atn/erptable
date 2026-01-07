import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Plus, Loader2 } from "lucide-react";

export function CreateInvitationDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [type, setType] = useState<"NEW_HIRE" | "CONTRACT_RENEWAL">("NEW_HIRE");
  const queryClient = useQueryClient();

  const createInvitation = useMutation({
    mutationFn: async ({ email, type }: { email: string; type: string }) => {
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
          .insert({ email, status: "INVITED" })
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
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Invitation created successfully!");
      setIsOpen(false);
      setEmail("");
      setType("NEW_HIRE");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    createInvitation.mutate({ email: email.trim(), type });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Invitation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Invitation</DialogTitle>
          <DialogDescription>
            Send an onboarding invitation to a new hire or existing employee
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Employee Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="employee@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Invitation Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEW_HIRE">New Hire</SelectItem>
                <SelectItem value="CONTRACT_RENEWAL">Contract Renewal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createInvitation.isPending}>
              {createInvitation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
