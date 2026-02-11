import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export function ContractTemplateView() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold">Contract Template</h1>
        <p className="text-muted-foreground text-sm">
          Manage your contract templates
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Templates
          </CardTitle>
          <CardDescription>
            Configure and manage contract templates for employee onboarding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Contract template management coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
