import {
  FolderKanban,
  MapPin,
  Users,
  Compass,
  Box,
  ArrowDown,
  Sprout,
  TreePine,
  Star,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/* ─── Arrow Connector ─────────────────────────────────────────── */

function ArrowConnector({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-2">
      {label && <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>}
      <ArrowDown className="w-5 h-5 text-muted-foreground" />
    </div>
  );
}

/* ─── Hierarchy Flow Card ─────────────────────────────────────── */

const hierarchyItems = [
  { icon: FolderKanban, label: "Project", desc: "Contract / assignment" },
  { icon: Users, label: "Client", desc: "Customer ordering work" },
  { icon: MapPin, label: "Location", desc: "Geographic area" },
  { icon: Compass, label: "Coordinates", desc: "GPS reference point" },
  { icon: Box, label: "Objects", desc: "Individual work parcels" },
];

/* ─── Object Types ────────────────────────────────────────────── */

const objectTypes = [
  { title: "Planting Objects", icon: Sprout, unit: "Plant pieces / thousands", color: "bg-green-500/10 text-green-700 dark:text-green-400", border: "border-green-500/20" },
  { title: "Clearing Objects", icon: TreePine, unit: "Hectares (ha)", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400", border: "border-blue-500/20" },
];

/* ─── SLA Classes ─────────────────────────────────────────────── */

const slaClasses = [
  { id: "101", label: "Light", color: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
  { id: "102", label: "", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  { id: "103", label: "", color: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" },
  { id: "104", label: "Light-Medium", color: "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300" },
  { id: "105", label: "", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
  { id: "106", label: "", color: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300" },
  { id: "107", label: "Medium", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  { id: "108", label: "", color: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" },
  { id: "109", label: "Medium-Heavy", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  { id: "110", label: "", color: "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300" },
  { id: "111", label: "", color: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400" },
  { id: "112", label: "", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  { id: "113", label: "Heavy", color: "bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-200" },
];

/* ─── Plant & Clearing Types ─────────────────────────────────── */

const plantTypes = [
  { num: 1, name: "Jackpot" },
  { num: 2, name: "Powerpot" },
  { num: 3, name: "Superpot" },
  { num: 4, name: "Pluggpot" },
  { num: 5, name: "Täckrot" },
  { num: 6, name: "Barrot" },
  { num: 7, name: "Skogsplantering Övrigt" },
  { num: 8, name: "Fjällplantering" },
  { num: 9, name: "Specialplantering" },
  { num: 10, name: "Reserv" },
];

const clearingTypes = [
  { num: 1, name: "Ungskog" },
  { num: 2, name: "Sly / Underväxt" },
  { num: 3, name: "Kraftledning" },
  { num: 4, name: "Väg / Dike" },
  { num: 5, name: "Lövröjning" },
  { num: 6, name: "Stamkvistning" },
  { num: 7, name: "Markberedning Manuell" },
  { num: 8, name: "Skogsvård Övrigt" },
  { num: 9, name: "Specialröjning" },
  { num: 10, name: "Reserv" },
];

/* ─── Hourly Salary Star System ──────────────────────────────── */

const hourlyStarData = [
  { jobType: "Planting", salaryGroup: "A", stars: [165, 175, 185, 200, 220] },
  { jobType: "Planting", salaryGroup: "B", stars: [155, 165, 175, 190, 210] },
  { jobType: "Clearing", salaryGroup: "A", stars: [170, 180, 190, 205, 225] },
  { jobType: "Clearing", salaryGroup: "B", stars: [160, 170, 180, 195, 215] },
];

/* ─── Piece Work: Planting ───────────────────────────────────── */

const pieceWorkPlanting = [
  { sla: "101", stars: [1800, 2100, 2400, 2800, 3200], net: "0.45", gross: "0.58" },
  { sla: "104", stars: [1500, 1800, 2100, 2500, 2900], net: "0.52", gross: "0.67" },
  { sla: "107", stars: [1200, 1500, 1800, 2200, 2600], net: "0.60", gross: "0.77" },
  { sla: "110", stars: [900, 1200, 1500, 1900, 2300], net: "0.72", gross: "0.93" },
  { sla: "113", stars: [700, 950, 1200, 1600, 2000], net: "0.88", gross: "1.13" },
];

/* ─── Piece Work: Clearing ───────────────────────────────────── */

const pieceWorkClearing = [
  { sla: "101", stars: [1.8, 2.1, 2.5, 3.0, 3.5], net: "450", gross: "580" },
  { sla: "104", stars: [1.5, 1.8, 2.1, 2.6, 3.1], net: "520", gross: "670" },
  { sla: "107", stars: [1.2, 1.5, 1.8, 2.2, 2.7], net: "600", gross: "770" },
  { sla: "110", stars: [0.9, 1.2, 1.5, 1.9, 2.4], net: "720", gross: "930" },
  { sla: "113", stars: [0.6, 0.9, 1.2, 1.6, 2.0], net: "880", gross: "1130" },
];

/* ─── 5-Level Hierarchy ──────────────────────────────────────── */

const hierarchyLevels = [
  { level: 1, title: "Category", desc: "Planting or Clearing", color: "bg-primary/10 text-primary" },
  { level: 2, title: "Compensation Method", desc: "Hourly Salary or Piece Work", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  { level: 3, title: "Quantity Units", desc: "Plants/thousands or Hectares", color: "bg-green-500/10 text-green-700 dark:text-green-400" },
  { level: 4, title: "Difficulty Level (SLA)", desc: "101 Light → 113 Heavy", color: "bg-orange-500/10 text-orange-700 dark:text-orange-400" },
  { level: 5, title: "Employee Performance", desc: "Stars ★1 – ★5", color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" },
];

/* ─── Info Dialogs ────────────────────────────────────────────── */

function CompGroupDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Info className="w-3.5 h-3.5" /> What is a Compensation Group?
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>What is a Compensation Group?</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>A <strong className="text-foreground">Compensation Group</strong> defines the pricing and performance parameters for a specific category of forestry work.</p>
          <p>Each group contains:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-foreground">Job category</strong> — Planting or Clearing</li>
            <li><strong className="text-foreground">Compensation method</strong> — Hourly Salary or Piece Work</li>
            <li><strong className="text-foreground">SLA class range</strong> — Difficulty levels 101–113</li>
            <li><strong className="text-foreground">Star system rates</strong> — Performance-based pay scales (★1–★5)</li>
            <li><strong className="text-foreground">Net/Gross factors</strong> — For piece work calculations</li>
          </ul>
          <p>Compensation groups are configured in <strong className="text-foreground">Settings → Comp. Groups</strong> and linked to project objects to determine worker pay.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SlaClassDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Info className="w-3.5 h-3.5" /> What is an SLA Class?
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>What is an SLA Class?</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>An <strong className="text-foreground">SLA Class</strong> (Service Level Agreement Class) represents the <strong className="text-foreground">difficulty level</strong> of a forestry work object.</p>
          <p>The scale runs from <strong className="text-foreground">101 (Light)</strong> to <strong className="text-foreground">113 (Heavy)</strong>, with 13 levels total:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-foreground">101–103</strong> — Light terrain, easy conditions</li>
            <li><strong className="text-foreground">104–106</strong> — Light-Medium, moderate challenges</li>
            <li><strong className="text-foreground">107–108</strong> — Medium difficulty</li>
            <li><strong className="text-foreground">109–111</strong> — Medium-Heavy, significant obstacles</li>
            <li><strong className="text-foreground">112–113</strong> — Heavy, extreme conditions</li>
          </ul>
          <p>Higher SLA classes result in <strong className="text-foreground">higher compensation rates</strong> and <strong className="text-foreground">lower expected output</strong> per day, reflecting the increased difficulty.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main Component ──────────────────────────────────────────── */

export function ProcessMapTab() {
  return (
    <div className="space-y-6">
      {/* Header Info Buttons */}
      <div className="flex flex-wrap gap-3">
        <CompGroupDialog />
        <SlaClassDialog />
      </div>

      {/* 1. Project Hierarchy Flow */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Project Hierarchy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {hierarchyItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-card p-3 min-w-[90px]">
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">{item.label}</span>
                    <span className="text-[10px] text-muted-foreground text-center">{item.desc}</span>
                  </div>
                  {i < hierarchyItems.length - 1 && (
                    <span className="text-muted-foreground text-lg hidden sm:block">→</span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <ArrowConnector label="Contains" />

      {/* 2. Object Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {objectTypes.map((t) => {
          const Icon = t.icon;
          return (
            <Card key={t.title} className={`border ${t.border}`}>
              <CardContent className="pt-5 flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg ${t.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{t.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Measured in: <strong>{t.unit}</strong></p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ArrowConnector label="Compensated by" />

      {/* 3. Compensation Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5">
            <h4 className="text-sm font-semibold text-foreground mb-2">💰 Hourly Salary</h4>
            <p className="text-xs text-muted-foreground">Fixed rate per hour. Used for both planting and clearing. Rate determined by Job Type, Salary Group, and Star level.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <h4 className="text-sm font-semibold text-foreground mb-2">📦 Piece Work</h4>
            <p className="text-xs text-muted-foreground">Pay per unit produced. Planting: per plant. Clearing: per hectare. Rate varies by SLA class and Star level.</p>
          </CardContent>
        </Card>
      </div>

      <ArrowConnector label="Difficulty rated by" />

      {/* 4. SLA Classes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">SLA Classes (101–113)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {slaClasses.map((sla) => (
              <div key={sla.id} className="flex flex-col items-center">
                <Badge className={`${sla.color} border-0 text-xs font-mono`}>{sla.id}</Badge>
                {sla.label && <span className="text-[9px] text-muted-foreground mt-0.5">{sla.label}</span>}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">Green = easy terrain → Red = extreme conditions. Higher SLA = higher pay, lower expected output.</p>
        </CardContent>
      </Card>

      <ArrowConnector label="Applied to" />

      {/* 5. Plant & Clearing Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-700 dark:text-green-400">🌱 Forest Plant Types (1–10)</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {plantTypes.map((t) => (
                <div key={t.num} className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="text-[10px] w-6 justify-center font-mono">{t.num}</Badge>
                  <span className="text-foreground">{t.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-700 dark:text-blue-400">🌲 Clearing Types (1–10)</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {clearingTypes.map((t) => (
                <div key={t.num} className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="text-[10px] w-6 justify-center font-mono">{t.num}</Badge>
                  <span className="text-foreground">{t.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <ArrowConnector label="Compensation details" />

      {/* 6. Hourly Salary Star System */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Hourly Salary — Star System (kr/h)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Job Type</TableHead>
                <TableHead className="text-xs">Salary Group</TableHead>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TableHead key={s} className="text-xs text-center">
                    {"★".repeat(s)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {hourlyStarData.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs font-medium">{row.jobType}</TableCell>
                  <TableCell className="text-xs">{row.salaryGroup}</TableCell>
                  {row.stars.map((val, j) => (
                    <TableCell key={j} className="text-xs text-center font-mono">{val}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 7. Piece Work Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-green-700 dark:text-green-400">Piece Work — Planting (plants/day)</CardTitle>
          </CardHeader>
          <CardContent className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px]">SLA</TableHead>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <TableHead key={s} className="text-[10px] text-center">★{s}</TableHead>
                  ))}
                  <TableHead className="text-[10px] text-center">Net</TableHead>
                  <TableHead className="text-[10px] text-center">Gross</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pieceWorkPlanting.map((row) => (
                  <TableRow key={row.sla}>
                    <TableCell className="text-[10px] font-mono font-medium">{row.sla}</TableCell>
                    {row.stars.map((val, j) => (
                      <TableCell key={j} className="text-[10px] text-center font-mono">{val}</TableCell>
                    ))}
                    <TableCell className="text-[10px] text-center font-mono">{row.net}</TableCell>
                    <TableCell className="text-[10px] text-center font-mono">{row.gross}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-blue-700 dark:text-blue-400">Piece Work — Clearing (ha/day)</CardTitle>
          </CardHeader>
          <CardContent className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px]">SLA</TableHead>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <TableHead key={s} className="text-[10px] text-center">★{s}</TableHead>
                  ))}
                  <TableHead className="text-[10px] text-center">Net</TableHead>
                  <TableHead className="text-[10px] text-center">Gross</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pieceWorkClearing.map((row) => (
                  <TableRow key={row.sla}>
                    <TableCell className="text-[10px] font-mono font-medium">{row.sla}</TableCell>
                    {row.stars.map((val, j) => (
                      <TableCell key={j} className="text-[10px] text-center font-mono">{val}</TableCell>
                    ))}
                    <TableCell className="text-[10px] text-center font-mono">{row.net}</TableCell>
                    <TableCell className="text-[10px] text-center font-mono">{row.gross}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <ArrowConnector label="Object structure" />

      {/* 8. What is a Project Object? */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">What is a Project Object?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">Every project object has three core attributes:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Unique ID", desc: "e.g. D330470 — auto-generated or manually set", icon: "🏷️" },
              { label: "Quantity", desc: "Amount of work: plants (thousands) or area (hectares)", icon: "📏" },
              { label: "Compensation Type", desc: "Links to a Compensation Group defining rates", icon: "💰" },
            ].map((attr) => (
              <div key={attr.label} className="rounded-lg border border-border p-3">
                <div className="text-lg mb-1">{attr.icon}</div>
                <h5 className="text-xs font-semibold text-foreground">{attr.label}</h5>
                <p className="text-[10px] text-muted-foreground mt-0.5">{attr.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 9. Compensation Type Connection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Compensation Type Connection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <Badge className="bg-primary/10 text-primary border-0">Category</Badge>
            <span className="text-muted-foreground">+</span>
            <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-0">Compensation Method</Badge>
            <span className="text-muted-foreground">=</span>
            <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-0">Compensation Type</Badge>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Example: <strong className="text-foreground">Planting</strong> + <strong className="text-foreground">Piece Work</strong> = <strong className="text-foreground">"Planting Piece Work"</strong> compensation type
          </p>
        </CardContent>
      </Card>

      <ArrowConnector label="Full hierarchy" />

      {/* 10. 5-Level Compensation Hierarchy */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">5-Level Compensation Hierarchy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {hierarchyLevels.map((lvl, i) => (
            <div key={lvl.level} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full ${lvl.color} flex items-center justify-center text-xs font-bold shrink-0`}>
                {lvl.level}
              </div>
              <div>
                <span className="text-xs font-semibold text-foreground">{lvl.title}</span>
                <span className="text-[10px] text-muted-foreground ml-2">{lvl.desc}</span>
              </div>
              {i < hierarchyLevels.length - 1 && (
                <ArrowDown className="w-3 h-3 text-muted-foreground ml-auto shrink-0 hidden sm:block" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <ArrowConnector label="Practical example" />

      {/* 11. Practical Example */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Practical Example — Object D330470</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Object ID", value: "D330470" },
                { label: "Category", value: "Planting" },
                { label: "Compensation Method", value: "Piece Work" },
                { label: "Plant Type", value: "Type 2 — Powerpot" },
                { label: "SLA Class", value: "107 (Medium)" },
                { label: "Quantity", value: "15,000 plants" },
                { label: "Employee Star", value: "★★★ (3 stars)" },
                { label: "Expected Output", value: "1,800 plants/day" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between rounded-md bg-muted/50 px-3 py-2">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="rounded-md bg-primary/5 border border-primary/10 p-3 mt-2">
              <p className="text-xs text-foreground">
                <strong>Result:</strong> A ★3 planter on SLA 107 is expected to plant ~1,800 plants/day at a net rate of 0.60 kr/plant, earning approximately <strong>1,080 kr/day</strong> before gross adjustments.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
