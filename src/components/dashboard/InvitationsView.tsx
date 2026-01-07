import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Mail, Clock, CheckCircle, XCircle, Copy, Send } from "lucide-react";
import { format } from "date-fns";

const statusConfig = {
  PENDING: { variant: "pending" as const, icon: Clock },
  SENT: { variant: "warning" as const, icon: Send },
  ACCEPTED: { variant: "success" as const, icon: CheckCircle },
  EXPIRED: { variant: "expired" as const, icon: XCircle },
};

export function InvitationsView() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [type, setType] = useState<"NEW_HIRE" | "CONTRACT_RENEWAL">("NEW_HIRE");
  const queryClient = useQueryClient();

  const { data: invitations, isLoading } = useQuery({
    queryKey: ["invitations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invitations")
        .select(`*, employees (email, first_name, last_name)`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createInvitation = useMutation({
    mutationFn: async ({ email, type }: { email: string; type: string }) => {
      // First check if employee exists
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
        // Create new employee
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

      // Create invitation
      const { data, error } = await supabase
        .from("invitations")
        .insert({
          employee_id: employeeId,
          type,
          status: "PENDING",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["recent-invitations"] });
      toast.success("Invitation created successfully!");
      setIsOpen(false);
      setEmail("");
      setType("NEW_HIRE");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/onboard/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied to clipboard!");
  };

  const markAsSent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("invitations")
        .update({ status: "SENT" })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Invitation marked as sent!");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Invitations</h1>
          <p className="text-muted-foreground mt-1">
            Manage employee onboarding invitations
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" size="lg">
              <Plus className="w-4 h-4" />
              New Invitation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Create Invitation</DialogTitle>
              <DialogDescription>
                Send an onboarding invitation to a new hire or existing employee
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createInvitation.mutate({ email, type });
              }}
              className="space-y-4"
            >
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
                <Select value={type} onValueChange={(v) => setType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW_HIRE">New Hire</SelectItem>
                    <SelectItem value="CONTRACT_RENEWAL">Contract Renewal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                variant="hero"
                className="w-full"
                disabled={createInvitation.isPending}
              >
                {createInvitation.isPending ? "Creating..." : "Create Invitation"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            All Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : invitations?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No invitations yet</p>
              <p className="text-sm">Create your first invitation to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {invitations?.map((invitation) => {
                const status = statusConfig[invitation.status as keyof typeof statusConfig];
                const StatusIcon = status.icon;

                return (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <StatusIcon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {invitation.employees?.email || "Unknown"}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{invitation.type.replace("_", " ")}</span>
                          <span>•</span>
                          <span>
                            {format(new Date(invitation.created_at), "MMM d, yyyy")}
                          </span>
                          <span>•</span>
                          <span>
                            Expires{" "}
                            {format(new Date(invitation.expires_at), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={status.variant}>
                        {invitation.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyInviteLink(invitation.token)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      {invitation.status === "PENDING" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsSent.mutate(invitation.id)}
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Mark Sent
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
