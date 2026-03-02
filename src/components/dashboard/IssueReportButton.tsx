import { useState } from "react";
import { Bug, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { IssueReportDialog } from "./IssueReportDialog";
import { MyIssuesDialog } from "./MyIssuesDialog";

export function IssueReportButton() {
  const [open, setOpen] = useState(false);
  const [myIssuesOpen, setMyIssuesOpen] = useState(false);

  return (
    <>
      {/* My Issues button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setMyIssuesOpen(true)}
            size="icon"
            className="fixed bottom-20 right-6 z-50 h-10 w-10 rounded-full shadow-md bg-primary text-primary-foreground hover:bg-primary/90"
            aria-label="My reported issues"
          >
            <ListChecks className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">My Issues</TooltipContent>
      </Tooltip>

      {/* Report Issue button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setOpen(true)}
            size="icon"
            className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
            aria-label="Report an issue"
          >
            <Bug className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Report an issue</TooltipContent>
      </Tooltip>

      <IssueReportDialog open={open} onOpenChange={setOpen} />
      <MyIssuesDialog open={myIssuesOpen} onOpenChange={setMyIssuesOpen} />
    </>
  );
}
