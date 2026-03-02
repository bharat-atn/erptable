

## Plan: Make Screenshot Instructions More Prominent

**File: `src/components/dashboard/IssueReportDialog.tsx`**

Restyle the screenshot instruction `Alert` banner to be more visually dominant and encouraging:

1. Change background from `bg-muted/50` to a stronger blue/primary tint (`bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800`)
2. Make the heading larger with a bolder weight and primary color
3. Increase the keyboard shortcut text size slightly (from `text-[10px]` to `text-xs`) and make the kbd elements more visible with stronger borders
4. Add a brief encouraging call-to-action line at the top: "Take a screenshot first, then attach it below!"
5. Add subtle emphasis styling to the "Attach Image" reference text

Single file change, purely cosmetic.

