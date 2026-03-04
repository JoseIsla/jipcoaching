

## Problem

In Recharts tooltips, `contentStyle.color` controls the **label** text color (e.g. "Semana 27/1"). The **value** text (e.g. "Variación: +0.5 kg") is controlled by `itemStyle`. Currently both are set to the same green color via `contentStyle`, but the user wants:

- **Label** (top line like "Semana 17/2") → **white**
- **Value** (data line like "Variación: +0.5 kg") → **green**

## Changes

**File: `src/pages/client/ClientProgress.tsx`**

### 1. Weight Evolution tooltip (line 183)
- Keep `color: "hsl(0 0% 100%)"` in `contentStyle` (label = white)
- Add `itemStyle={{ color: "hsl(110 100% 54%)" }}` (value = green)

### 2. Weekly Weight Delta tooltip (line 205)
- Set `color: "hsl(0 0% 100%)"` in `contentStyle` (label = white)  
- Add `itemStyle={{ color: "hsl(110 100% 54%)" }}` (value = green)

### 3. Adherence tooltip (line 117) — same treatment for consistency
- Keep `color: "hsl(0 0% 100%)"` in `contentStyle`
- Add `itemStyle={{ color: "hsl(110 100% 54%)" }}`

All three tooltips will show white labels and green values, matching the screenshot reference.

