import * as React from "react";
import { useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { countries } from "@/lib/countries";

const PRIORITY_CODES = ["RO", "TH", "UA", "SE"];

// Deduplicate by dialCode
const seen = new Set<string>();
const uniquePrefixes = countries.filter((c) => {
  if (seen.has(c.dialCode)) return false;
  seen.add(c.dialCode);
  return true;
});

const priorityPrefixes = uniquePrefixes.filter((c) => PRIORITY_CODES.includes(c.code));
const otherPrefixes = uniquePrefixes.filter((c) => !PRIORITY_CODES.includes(c.code));

interface SearchablePhonePrefixSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  className?: string;
  tabIndex?: number;
}

export function SearchablePhonePrefixSelect({
  value,
  onValueChange,
  className,
  tabIndex,
}: SearchablePhonePrefixSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = uniquePrefixes.find((c) => c.dialCode === value);
  const query = search.toLowerCase();

  const filteredPriority = priorityPrefixes.filter(
    (c) => c.name.toLowerCase().includes(query) || c.dialCode.includes(query)
  );
  const filteredOther = otherPrefixes.filter(
    (c) => c.name.toLowerCase().includes(query) || c.dialCode.includes(query)
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          tabIndex={tabIndex}
          className={cn(
            "flex w-28 h-11 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            className
          )}
        >
          <span className="truncate">
            {selected ? `${selected.flag} ${selected.dialCode}` : value || "+46"}
          </span>
          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Search prefix..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="max-h-[240px] overflow-y-auto p-1">
          {filteredPriority.length > 0 && (
            <>
              {filteredPriority.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  className={cn(
                    "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    value === c.dialCode && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => {
                    onValueChange(c.dialCode);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === c.dialCode ? "opacity-100" : "opacity-0")} />
                  {c.flag} {c.dialCode} <span className="ml-1 text-muted-foreground">{c.name}</span>
                </button>
              ))}
              {filteredOther.length > 0 && <div className="-mx-1 my-1 h-px bg-border" />}
            </>
          )}
          {filteredOther.map((c) => (
            <button
              key={c.code}
              type="button"
              className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                value === c.dialCode && "bg-accent text-accent-foreground"
              )}
              onClick={() => {
                onValueChange(c.dialCode);
                setOpen(false);
                setSearch("");
              }}
            >
              <Check className={cn("mr-2 h-4 w-4", value === c.dialCode ? "opacity-100" : "opacity-0")} />
              {c.flag} {c.dialCode} <span className="ml-1 text-muted-foreground">{c.name}</span>
            </button>
          ))}
          {filteredPriority.length === 0 && filteredOther.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No prefix found.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
