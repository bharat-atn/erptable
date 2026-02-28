import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export function OnboardingStatusChart() {
  const { orgId } = useOrg();
  const { data: statusData } = useQuery({
    queryKey: ["onboarding-status-chart", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("status")
        .eq("org_id", orgId!);
      if (error) throw error;

      const counts: Record<string, number> = {
        INVITED: 0,
        ONBOARDING: 0,
        ACTIVE: 0,
        INACTIVE: 0,
      };

      (data || []).forEach((e) => {
        if (e.status in counts) counts[e.status]++;
      });

      return [
        { name: "Invited", value: counts.INVITED },
        { name: "Onboarding", value: counts.ONBOARDING },
        { name: "Active", value: counts.ACTIVE },
        { name: "Inactive", value: counts.INACTIVE },
      ];
    },
  });

  return (
    <Card className="w-[280px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Employee Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: 'hsl(215, 16%, 47%)' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: 'hsl(215, 16%, 47%)' }}
                hide
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{ 
                  background: 'white', 
                  border: '1px solid hsl(214, 32%, 91%)',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar 
                dataKey="value" 
                fill="hsl(217, 91%, 60%)" 
                radius={[4, 4, 0, 0]}
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
