import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

export function OnboardingActivityChart() {
  const [period, setPeriod] = useState("7days");
  const { orgId } = useOrg();

  const days = period === "7days" ? 7 : period === "30days" ? 30 : 90;

  const { data: chartData } = useQuery({
    queryKey: ["onboarding-activity", period, orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const since = subDays(new Date(), days).toISOString();

      const [invRes, empRes] = await Promise.all([
        supabase.from("invitations").select("created_at").eq("org_id", orgId!).gte("created_at", since),
        supabase.from("employees").select("created_at").eq("org_id", orgId!).gte("created_at", since),
      ]);

      const interval = eachDayOfInterval({
        start: subDays(new Date(), days - 1),
        end: new Date(),
      });

      const counts: Record<string, number> = {};
      interval.forEach((d) => {
        counts[startOfDay(d).toISOString()] = 0;
      });

      // Count activity per day (invitations + new employees)
      [...(invRes.data || []), ...(empRes.data || [])].forEach((row) => {
        const key = startOfDay(new Date(row.created_at)).toISOString();
        if (key in counts) counts[key]++;
      });

      return interval.map((d) => ({
        label: days <= 7 ? format(d, "EEE") : format(d, "MMM d"),
        value: counts[startOfDay(d).toISOString()] || 0,
      }));
    },
  });

  return (
    <Card className="flex-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Onboarding Activity</CardTitle>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="90days">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: 'hsl(215, 16%, 47%)' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: 'hsl(215, 16%, 47%)' }}
                allowDecimals={false}
                domain={[0, 'dataMax + 1']}
              />
              <Tooltip 
                contentStyle={{ 
                  background: 'white', 
                  border: '1px solid hsl(214, 32%, 91%)',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(217, 91%, 60%)"
                strokeWidth={2}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
