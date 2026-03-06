import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProcessMapTab } from "./forestry-guide/ProcessMapTab";
import { ScenariosTab } from "./forestry-guide/ScenariosTab";

export function ForestryProcessGuideView() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Forestry Process Guide</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete reference for the forestry compensation system, project structure, and operational workflows.
        </p>
      </div>

      <Tabs defaultValue="process-map" className="w-full">
        <TabsList>
          <TabsTrigger value="process-map">Process Map</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
        </TabsList>

        <TabsContent value="process-map">
          <ProcessMapTab />
        </TabsContent>

        <TabsContent value="scenarios">
          <ScenariosTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
