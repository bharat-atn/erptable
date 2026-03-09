import * as React from "react";
import { useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { countries } from "@/lib/countries";

const PRIORITY_COUNTRY_NAMES = ["Romania", "Thailand", "Ukraine", "Sweden"];
const priorityCountries = countries.filter((c) => PRIORITY_COUNTRY_NAMES.includes(c.name));
const otherCountries = countries.filter((c) => !PRIORITY_COUNTRY_NAMES.includes(c.name));

interface SearchableCountrySelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
  className?: string;
  tabIndex?: number;
  /** Extra items to show after the "Other" separator */
  extraItems?: { label: string; value: string }[];
}

export function SearchableCountrySelect({
  value,
  onValueChange,
  placeholder = "Select country",
  hasError,
  className,
  tabIndex,
  extraItems,
}: SearchableCountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");


  const selectedCountry = countries.find((c) => c.name === value);
  const query = search.toLowerCase();

  const filteredPriority = priorityCountries.filter((c) =>
    c.name.toLowerCase().includes(query)
  );
  const filteredOther = otherCountries.filter((c) =>
    c.name.toLowerCase().includes(query)
  );
  const filteredExtra = extraItems?.filter((item) =>
    item.label.toLowerCase().includes(query)
  );

  const handleSelect = React.useCallback((nextValue: string) => {
    onValueChange(nextValue);
    setOpen(false);
    setSearch("");
  }, [onValueChange]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          tabIndex={tabIndex}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            !value && "text-muted-foreground",
            hasError && "border-destructive",
            className
          )}
        >
          <span className="truncate">
            {selectedCountry
              ? `${selectedCountry.flag} ${selectedCountry.name}`
              : extraItems?.find((i) => i.value === value)?.label || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Search country..."
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
                    value === c.name && "bg-accent text-accent-foreground"
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(c.name)}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === c.name ? "opacity-100" : "opacity-0")} />
                  {c.flag} {c.name}
                </button>
              ))}
              {(filteredOther.length > 0 || (filteredExtra && filteredExtra.length > 0)) && (
                <div className="-mx-1 my-1 h-px bg-border" />
              )}
            </>
          )}
          {filteredOther.map((c) => (
            <button
              key={c.code}
              type="button"
              className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                value === c.name && "bg-accent text-accent-foreground"
              )}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(c.name)}
            >
              <Check className={cn("mr-2 h-4 w-4", value === c.name ? "opacity-100" : "opacity-0")} />
              {c.flag} {c.name}
            </button>
          ))}
          {filteredExtra && filteredExtra.length > 0 && (
            <>
              <div className="-mx-1 my-1 h-px bg-border" />
              {filteredExtra.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={cn(
                    "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    value === item.value && "bg-accent text-accent-foreground"
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(item.value)}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === item.value ? "opacity-100" : "opacity-0")} />
                  {item.label}
                </button>
              ))}
            </>
          )}
          {filteredPriority.length === 0 && filteredOther.length === 0 && (!filteredExtra || filteredExtra.length === 0) && (
            <p className="py-6 text-center text-sm text-muted-foreground">No country found.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

