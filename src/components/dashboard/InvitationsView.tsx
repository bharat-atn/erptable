import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateInvitationDialog } from "./CreateInvitationDialog";
import { Mail, Search, Filter, MoreVertical, Copy, Send, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

type InvitationType = "NEW_HIRE" | "CONTRACT_RENEWAL";
type InvitationStatus = "PENDING" | "SENT" | "ACCEPTED" | "EXPIRED";

const typeVariants: Record<InvitationType, "newHire" | "renewal"> = {
  NEW_HIRE: "newHire",
  CONTRACT_RENEWAL: "renewal",
};

const typeLabels: Record<InvitationType, string> = {
  NEW_HIRE: "New Hire",
  CONTRACT_RENEWAL: "Renewal",
};

const statusVariants: Record<InvitationStatus, "completed" | "opened" | "sent" | "expired"> = {
  ACCEPTED: "completed",
  PENDING: "opened",
  SENT: "sent",
  EXPIRED: "expired",
};

const statusLabels: Record<InvitationStatus, string> = {
  ACCEPTED: "Completed",
  PENDING: "Opened",
  SENT: "Sent",
  EXPIRED: "Expired",
};

export function InvitationsView() {
  const [search, setSearch] = useState("");
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
      toast.success("Marked as sent");
    },
  });

  const filteredInvitations = invitations?.filter((inv) =>
    inv.employees?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/onboard/${token}`);
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Invitations</h1>
          <p className="text-muted-foreground text-sm">
            Manage employee onboarding invitations
          </p>
        </div>
        <CreateInvitationDialog />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            All Invitations
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 w-[180px]"
              />
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Sent Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Expires</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td colSpan={6} className="py-4 px-4">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filteredInvitations?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No invitations found
                    </td>
                  </tr>
                ) : (
                  filteredInvitations?.map((invitation) => (
                    <tr key={invitation.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4 text-sm">{invitation.employees?.email}</td>
                      <td className="py-3 px-4">
                        <Badge variant={typeVariants[invitation.type as InvitationType]}>
                          {typeLabels[invitation.type as InvitationType]}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={statusVariants[invitation.status as InvitationStatus]}>
                          {statusLabels[invitation.status as InvitationStatus]}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {format(new Date(invitation.created_at), "yyyy-MM-dd")}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {format(new Date(invitation.expires_at), "yyyy-MM-dd")}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => copyLink(invitation.token)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Link
                            </DropdownMenuItem>
                            {invitation.status === "PENDING" && (
                              <DropdownMenuItem onClick={() => markAsSent.mutate(invitation.id)}>
                                <Send className="w-4 h-4 mr-2" />
                                Mark as Sent
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
