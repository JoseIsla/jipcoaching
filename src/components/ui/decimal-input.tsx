import * as React from "react";
import { Input } from "@/components/ui/input";
import { parseDecimal, parseOptionalDecimal } from "@/utils/parseDecimal";
import { cn } from "@/lib/utils";

interface DecimalInputProps {
  value: number | undefined | null;
  onChange: (v: number | undefined) => void;
  /** If true, returns undefined when empty instead of 0 */
  optional?: boolean;
  className?: string;
  placeholder?: string;
  inputMode?: "decimal" | "numeric";
}

/**
 * Numeric input that allows typing decimals with comma or period
 * without stripping the separator mid-keystroke.
 */
const DecimalInput = ({ value, onChange, optional = true, className, placeholder, inputMode = "decimal" }: DecimalInputProps) => {
  const [raw, setRaw] = React.useState(value != null ? String(value) : "");

  // Sync from parent when value changes externally
  React.useEffect(() => {
    const currentParsed = raw === "" ? undefined : parseOptionalDecimal(raw);
    if (value == null && raw !== "") {
      setRaw("");
    } else if (value != null && currentParsed !== value) {
      setRaw(String(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Input
      type="text"
      inputMode={inputMode}
      className={cn(className)}
      value={raw}
      placeholder={placeholder}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "" || /^-?\d*[.,]?\d*$/.test(v)) {
          setRaw(v);
        }
      }}
      onBlur={() => {
        if (raw === "" || raw === "-") {
          onChange(optional ? undefined : 0);
          setRaw("");
        } else {
          const n = parseDecimal(raw, 0);
          onChange(n);
          setRaw(String(n));
        }
      }}
    />
  );
};

export { DecimalInput };
