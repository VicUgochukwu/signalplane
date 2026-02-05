# Lovable Prompt — Admin Panel Phase 3: Data Management & Feature Control

## Context

We have an admin panel with sidebar layout at `/admin/*` routes. Phase 1 built: `AdminDashboard`, `AdminUsers`, `AdminAuditLog`, `AdminFeatureFlags`. Phase 2 added: `AdminSystemOverview`, `AdminWorkflows`, `AdminApiHealth`. Now we add data management capabilities with CSV upload, enhanced feature flags CRUD, and usage reporting with abuse detection.

**Backend is fully deployed:**
- New RPCs: `admin_get_feature_flags`, `admin_create_feature_flag`, `admin_update_feature_flag`, `admin_delete_feature_flag`, `admin_get_usage_summary`, `admin_get_user_usage`, `admin_get_usage_leaderboard`, `admin_get_abuse_flags`, `admin_resolve_abuse_flag`, `log_csv_upload`
- Edge function: `csv-upload` (accepts multipart CSV, parses, validates, inserts into `objection_tracker.events`)
- New tables: `admin.usage_tracking`, `admin.abuse_flags`
- Feature flag seeds: 7 flags pre-populated

## What to build

### 1. Create `src/hooks/useFeatureFlag.ts` — Feature flag consumption hook

```ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FeatureFlag {
  flag_key: string;
  label: string;
  description: string;
  is_enabled: boolean;
  applies_to: string;
}

export function useFeatureFlag() {
  const { data: flags, isLoading } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_feature_flags');
      if (error) throw error;
      return data as FeatureFlag[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const isEnabled = (flagKey: string): boolean => {
    if (isLoading || !flags) return true; // Default to enabled while loading
    const flag = flags.find(f => f.flag_key === flagKey);
    return flag ? flag.is_enabled : true; // Default to enabled if flag not found
  };

  return { isEnabled, isLoading, flags };
}
```

### 2. Create `src/pages/admin/AdminCsvUpload.tsx` — CSV Upload Interface

**Purpose:** Upload CSV files to ingest objection/feedback data into the system.

**Data sources:**
- Preview: `supabase.functions.invoke('csv-upload', { body: formData })` with URL param `?preview=true`
- Upload: `supabase.functions.invoke('csv-upload', { body: formData })`
- Upload history: query `admin.usage_tracking` where `action_type = 'csv_upload'` (use the Supabase client to query via the admin schema, or better: use `supabase.rpc('admin_get_user_usage', { p_user_id: userId, p_days: 30 })` filtered to csv_upload)

**Important:** When calling the edge function, you must send the request as `FormData` directly. The edge function is at the path `csv-upload`. The Supabase JS client's `functions.invoke` does NOT support multipart natively — instead, use a direct fetch call:

```ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dnqjzgfunvbofsuibcsk.supabase.co';

// For preview
const previewResponse = await fetch(`${supabaseUrl}/functions/v1/csv-upload?preview=true`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
  },
  body: formData, // FormData with file, source_name, source_type
});
const previewData = await previewResponse.json();

// For full upload (same but without ?preview=true)
const uploadResponse = await fetch(`${supabaseUrl}/functions/v1/csv-upload`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
  },
  body: formData,
});
const uploadData = await uploadResponse.json();
```

**Layout (uses `<AdminLayout>`):**

**Step 1 — Upload Form Card:**
- Card with header "Upload CSV Data"
- **Drag & drop zone**: A dashed border area that accepts CSV files. Show a cloud upload icon (from lucide-react `Upload`), text "Drop your CSV file here or click to browse", and a subtle "Supports .csv files up to 5MB" note
- Below the drop zone, two form fields in a row:
  - **Source Name** — text input (placeholder: "e.g., LinkedIn Export, Gong Calls")
  - **Source Type** — select dropdown with options: `linkedin`, `crm`, `call_transcript`, `support`, `manual` (default: `manual`)
- When a file is selected, show the filename, file size, and a small "X" button to clear

**Step 2 — Preview (shown after "Preview" button click):**
- A "Preview" button (secondary variant) that calls the edge function with `?preview=true`
- Shows a Card with:
  - **Column Mapping** section: shows which CSV columns were detected as text/date/author/url/metadata
  - **Validation Summary**: "X rows valid, Y rows skipped, Z errors" with appropriate icons
  - **Sample Data Table**: First 5 rows showing: text (truncated to 200 chars), author, date, company
  - If there are errors, show them below: "Row N: reason"
- A "Cancel" button and an "Upload All" button (default/primary variant, emerald colored)

**Step 3 — Upload Progress & Results:**
- While uploading, show a spinner and "Uploading X rows..."
- On success, show a success Card with:
  - Green checkmark icon
  - "Successfully imported X rows"
  - Stats: total rows, valid rows, skipped rows
  - "Upload another" button to reset the form
- On error, show error message with "Try again" button

**Step 4 — Upload History (below the upload form):**
- Card with header "Recent Uploads"
- If the user has admin access, fetch `admin_get_usage_leaderboard` and show a simple table of recent CSV uploads
- Otherwise, show a message "Upload history is available to admins"
- For admin view, show a simple table: Filename, Rows Imported, Date, Source Type

### 3. Create `src/pages/admin/AdminUsageReports.tsx` — Usage Reports Page

**Purpose:** View platform usage statistics, user activity leaderboard, and abuse detection flags.

**Data sources:**
- Usage summary: `supabase.rpc('admin_get_usage_summary')` → returns `{ total_uploads, total_rows_processed, active_users_7d, active_users_30d, flagged_users }`
- Usage leaderboard: `supabase.rpc('admin_get_usage_leaderboard', { p_days: 30, p_limit: 25 })` → returns array of `{ user_id, user_email, display_name, upload_count, total_rows_processed, last_active, abuse_flag_count }`
- Abuse flags: `supabase.rpc('admin_get_abuse_flags', { p_resolved: filterValue, p_limit: 50 })` → returns array of `{ id, user_id, user_email, display_name, flag_type, severity, description, resolved, resolved_at, metadata, created_at }`
- Resolve abuse flag: `supabase.rpc('admin_resolve_abuse_flag', { p_flag_id: flagId })`

**Layout (uses `<AdminLayout>`):**

**Tab interface** using shadcn `<Tabs>` with 3 tabs: "Overview" | "Leaderboard" | "Abuse Flags"

**Tab 1 — Overview:**
- **Summary cards row** (grid-cols-2 lg:grid-cols-5):
  | Card | Value | Icon | Color |
  |------|-------|------|-------|
  | Total Uploads | `total_uploads` | `Upload` | `text-blue-400` |
  | Rows Processed | `total_rows_processed` | `Database` | `text-emerald-400` |
  | Active Users (7d) | `active_users_7d` | `Users` | `text-amber-400` |
  | Active Users (30d) | `active_users_30d` | `Users` | `text-purple-400` |
  | Flagged Users | `flagged_users` | `AlertTriangle` | `text-red-400` |

- Below cards, show a "Quick Stats" section:
  - If `flagged_users > 0`: amber warning banner "⚠ {flagged_users} user(s) flagged for review" with a link to the Abuse Flags tab
  - If `flagged_users === 0`: green success message "✓ No abuse flags detected"

**Tab 2 — Leaderboard:**
- Table with columns:
  | Column | Content |
  |--------|---------|
  | User | email (text-sm) + display_name below in text-muted-foreground |
  | Uploads | upload_count |
  | Rows Processed | total_rows_processed (formatted with comma separator) |
  | Last Active | relative time from last_active |
  | Flags | abuse_flag_count — if > 0, show red Badge with count |

- Clicking a row could optionally expand to show per-user detail (call `admin_get_user_usage`), but this is optional — at minimum show the table.

**Tab 3 — Abuse Flags:**
- **Filter row**: Buttons or a Select to filter by: "All" | "Unresolved" (default) | "Resolved"
- **Abuse flags table**:
  | Column | Content |
  |--------|---------|
  | User | user_email |
  | Type | flag_type as Badge — `large_upload` = amber, `high_volume` = blue, `rapid_requests` = red, `suspicious_pattern` = purple |
  | Severity | severity Badge — `low` = gray, `medium` = amber, `high` = red |
  | Description | description (text-sm, truncated) |
  | Created | relative time from created_at |
  | Status | resolved ? green "Resolved" badge : amber "Open" badge |
  | Actions | If unresolved: "Resolve" button (small, outline). On click: call `admin_resolve_abuse_flag({ p_flag_id: flag.id })`, show toast on success, invalidate query |

Use `useQuery` for all data with `queryKey` patterns like `['admin-usage-summary']`, `['admin-usage-leaderboard']`, `['admin-abuse-flags', resolvedFilter]`. Use `useMutation` for resolve action.

### 4. Modify `src/pages/admin/AdminFeatureFlags.tsx` — Full CRUD Rewrite

**Current state:** The page only shows toggle switches. We need full CRUD.

**Changes:**
- Switch data source from `get_feature_flags()` to `admin_get_feature_flags()` RPC (returns full data including `id`, `allowed_user_ids`, `created_at`, `updated_at`)
- Add a "Create Flag" button in the header row (right side of the h2 heading)

**Updated interface:**
```ts
interface FeatureFlag {
  id: string;
  flag_key: string;
  label: string;
  description: string;
  is_enabled: boolean;
  applies_to: string;
  allowed_user_ids: string[];
  created_at: string;
  updated_at: string;
}
```

**"Create Flag" button** → Opens a Dialog with form:
- `flag_key` — text input (required, lowercase with underscores, use pattern validation)
- `label` — text input (required)
- `description` — textarea (optional)
- `applies_to` — Select: "all" | "admin" | "specific_users"
- `is_enabled` — Switch (default off)
- Submit button calls `admin_create_feature_flag` RPC

**Per-flag card updates:**
- Keep the existing toggle switch functionality
- Add a dropdown menu (three dots icon) in the top right of each card with:
  - "Edit" — opens same dialog pre-populated (flag_key field is read-only)
  - "Delete" — opens confirmation dialog: "Are you sure you want to delete the '{flag.label}' flag? This action cannot be undone."
- Show `applies_to` badge: `all` = emerald, `admin` = purple, `specific_users` = amber
- Show `created_at` as a subtle date below the flag_key code element
- If `applies_to === 'specific_users'`, show count of `allowed_user_ids.length` users in the badge

**Mutations:**
- Create: `supabase.rpc('admin_create_feature_flag', { p_flag_key, p_label, p_description, p_is_enabled, p_applies_to, p_allowed_user_ids: [] })`
- Update: `supabase.rpc('admin_update_feature_flag', { p_flag_key, p_label, p_description, p_applies_to, p_allowed_user_ids })`
- Delete: `supabase.rpc('admin_delete_feature_flag', { p_flag_key })`
- Toggle: keep existing `admin_toggle_feature_flag` RPC

All mutations should invalidate `['feature-flags']` query and show toast.

### 5. Modify `src/components/admin/AdminLayout.tsx` — Add 2 nav items

Add these 2 items to the `navItems` array, below the existing 7:

```ts
{ to: '/admin/csv-upload', label: 'CSV Upload', icon: Upload },
{ to: '/admin/usage', label: 'Usage Reports', icon: BarChart3 },
```

Import `Upload`, `BarChart3` from `lucide-react`.

### 6. Modify `src/App.tsx` — Add 2 new routes

Add these routes in the admin section (before the catch-all `*` route), each wrapped in `<AdminRoute>`:

```tsx
<Route path="/admin/csv-upload" element={<AdminRoute><AdminCsvUpload /></AdminRoute>} />
<Route path="/admin/usage" element={<AdminRoute><AdminUsageReports /></AdminRoute>} />
```

Import the 2 new page components from `@/pages/admin/`.

### 7. Modify `src/components/control-plane/AppNavigation.tsx` — Wire feature flags

- Import `useFeatureFlag` from `@/hooks/useFeatureFlag`
- Use the hook in the component: `const { isEnabled } = useFeatureFlag();`
- Filter the `navItems` array by feature flag before rendering:
  - `control-plane` route → gated by `isEnabled('control_plane')`
  - `control-plane/artifacts` route → gated by `isEnabled('artifacts')`
  - `messaging-diff` route → gated by `isEnabled('messaging_diff')`
- Gate the admin link on `isEnabled('admin_panel') && isAdmin`

Map nav items to flag keys:
```ts
const navItemFlags: Record<string, string> = {
  '/control-plane': 'control_plane',
  '/control-plane/artifacts': 'artifacts',
  '/messaging-diff': 'messaging_diff',
};
```

Filter before rendering:
```ts
{navItems
  .filter(item => {
    const flagKey = navItemFlags[item.to];
    return !flagKey || isEnabled(flagKey);
  })
  .map((item) => { /* existing render code */ })}
```

For admin link:
```ts
{isAdmin && isEnabled('admin_panel') && (
  <Link to="/admin" ...>
```

## Styling Requirements

- Match the existing dark theme: `bg-zinc-900`, `bg-zinc-800/50`, `border-zinc-700`
- Use `emerald` for positive/success states, `amber` for warnings, `red` for errors/high severity
- Drag & drop zone: dashed border (`border-dashed border-2 border-zinc-600`), hover state (`hover:border-emerald-500/50`), active state when file dragged over (`border-emerald-500 bg-emerald-500/5`)
- All text in `text-foreground` or `text-muted-foreground`
- Use `<Skeleton>` components from shadcn for all loading states
- Responsive: stack to single column on mobile

## Import Patterns

Follow the existing patterns exactly:
```ts
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
```

## Error Handling

- If any RPC call fails, show an error card with the message and a "Retry" button
- If the CSV edge function returns a 401, show "Please log in to upload data"
- If the CSV upload returns errors, show them in the preview/result area
- Use `toast.error()` for action failures (like resolve flag failing)
- Use `toast.success()` for successful actions

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/hooks/useFeatureFlag.ts` | CREATE |
| `src/pages/admin/AdminCsvUpload.tsx` | CREATE |
| `src/pages/admin/AdminUsageReports.tsx` | CREATE |
| `src/pages/admin/AdminFeatureFlags.tsx` | MODIFY — CRUD rewrite |
| `src/components/admin/AdminLayout.tsx` | MODIFY — add 2 nav items |
| `src/App.tsx` | MODIFY — add 2 routes |
| `src/components/control-plane/AppNavigation.tsx` | MODIFY — wire feature flags |
