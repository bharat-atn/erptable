import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const statusData = [
  { name: "Sent", value: 12 },
  { name: "Viewed", value: 8 },
  { name: "Draft", value: 5 },
  { name: "Done", value: 6 },
];

export function OnboardingStatusChart() {
  return (
    <Card className="w-[280px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Onboarding Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
