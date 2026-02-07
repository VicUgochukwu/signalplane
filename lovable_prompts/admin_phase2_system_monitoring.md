# Lovable Prompt — Admin Panel Phase 2: System Monitoring

## Context

We have an admin panel with sidebar layout at `/admin/*` routes. Phase 1 built: `AdminDashboard`, `AdminUsers`, `AdminAuditLog`, `AdminFeatureFlags`. Now we add 3 new pages for system monitoring. The backend is fully deployed — 4 new Supabase RPCs and an edge function `admin-system-monitor` that proxies n8n and runs health checks.

## What to build

Add 3 new admin pages and update the existing layout/routing:

### 1. Update `AdminLayout.tsx` — add sidebar nav items

Add these 3 items to the `navItems` array, below the existing 4:

```ts
{ to: '/admin/system', label: 'System Overview', icon: Activity },
{ to: '/admin/workflows', label: 'Workflows', icon: GitBranch },
{ to: '/admin/api-health', label: 'API Health', icon: Wifi },
```

Import `Activity`, `GitBranch`, `Wifi` from `lucide-react`.

### 2. Update `App.tsx` — add 3 new routes

Add these routes in the admin section (before the catch-all `*` route), each wrapped in `<AdminRoute>`:

```tsx
<Route path="/admin/system" element={<AdminRoute><AdminSystemOverview /></AdminRoute>} />
<Route path="/admin/workflows" element={<AdminRoute><AdminWorkflows /></AdminRoute>} />
<Route path="/admin/api-health" element={<AdminRoute><AdminApiHealth /></AdminRoute>} />
```

Import the 3 new page components from `@/pages/admin/`.

### 3. Create `src/pages/admin/AdminSystemOverview.tsx`

**Purpose:** Single-pane dashboard combining API health + workflow status.

**Data sources:**
- System summary: `supabase.rpc('admin_get_system_summary')` → returns `{ total_apis, healthy_apis, degraded_apis, down_apis, avg_response_time_ms }`
- Health overview: `supabase.rpc('admin_get_health_overview')` → returns array of `{ api_name, api_slug, category, status, response_time_ms, http_status_code, error_message, checked_at, docs_url }`
- n8n workflows: `supabase.functions.invoke('admin-system-monitor', { body: { action: 'n8n_list_workflows' } })` → returns `{ data: { data: [...workflows] } }` where each workflow has `{ id, name, active, createdAt, updatedAt }`
- n8n recent executions: `supabase.functions.invoke('admin-system-monitor', { body: { action: 'n8n_list_executions', limit: 10 } })` → returns `{ data: { data: [...executions] } }` where each execution has `{ id, workflowId, finished, startedAt, stoppedAt, status }` (status: "success", "error", "waiting", "running")

**Layout (uses `<AdminLayout>`)**:

**Row 1 — 4 stat cards** (same Card pattern as AdminDashboard):
| Card | Value | Icon | Color |
|------|-------|------|-------|
| Total APIs | `total_apis` | `Server` | `text-blue-400` |
| Healthy | `healthy_apis` | `CheckCircle2` | `text-emerald-400` |
| Degraded | `degraded_apis` | `AlertTriangle` | `text-amber-400` |
| Down | `down_apis` | `XCircle` | `text-red-400` |

Below the 4 cards, show a small text: `Avg response time: {avg_response_time_ms}ms` in `text-muted-foreground`.

**Row 2 — Two columns (lg:grid-cols-2)**:

**Left: API Health Grid**
- Header: "API Status" with a link "View all →" pointing to `/admin/api-health`
- Grid of small cards (grid-cols-1 sm:grid-cols-2 gap-3), one per API from `admin_get_health_overview`:
  - API name (bold, text-sm)
  - Category badge: `core` = blue, `integration` = purple, `external` = amber. Use a small `<Badge>` component
  - Status pill: `healthy` = green dot + "Healthy", `degraded` = yellow dot + "Degraded", `down`/`timeout`/`error` = red dot + "Down", `unknown` = gray dot + "No data"
  - Response time in ms (text-xs text-muted-foreground)
  - Last checked relative time (e.g., "2 min ago") using `checked_at` — use a simple helper function

**Right: n8n Workflows**
- Header: "Workflows" with a link "View all →" pointing to `/admin/workflows`
- List of workflows, each showing:
  - Workflow name (font-medium)
  - Active/Inactive badge: active = green Badge "Active", inactive = gray Badge "Inactive"
- Below the workflow list, a "Recent Executions" sub-section:
  - Last 5 executions shown as a compact list
  - Each shows: workflow ID (truncated), status icon (green check for success, red X for error, spinner for running, clock for waiting), started time (relative)

**Row 3 — Recent Issues**
- Card with header "Recent Issues (24h)"
- Filter `admin_get_health_overview` results where `status` is NOT `healthy` and NOT `unknown`
- Show as a simple table or list: API name, status pill, error message (truncated), time
- If no issues, show a green "All systems operational" message with a CheckCircle2 icon

Use `useQuery` from `@tanstack/react-query` for all data fetching. Use `queryKey` patterns like `['admin-system-summary']`, `['admin-health-overview']`, `['admin-n8n-workflows']`, `['admin-n8n-executions']`. Set `refetchInterval: 60000` (1 minute) for health overview and n8n data so the dashboard auto-refreshes.

### 4. Create `src/pages/admin/AdminWorkflows.tsx`

**Purpose:** Detailed n8n workflow monitoring with execution history.

**Data sources:**
- Workflow list: `supabase.functions.invoke('admin-system-monitor', { body: { action: 'n8n_list_workflows' } })`
- Executions for a workflow: `supabase.functions.invoke('admin-system-monitor', { body: { action: 'n8n_list_executions', workflowId: selectedId, limit: 20 } })`
- Single execution detail: `supabase.functions.invoke('admin-system-monitor', { body: { action: 'n8n_get_execution', executionId: id } })`

**Layout (uses `<AdminLayout>`)**:

**Main content — Workflow Table**
Use a `<Table>` component (shadcn) with columns:
| Column | Content |
|--------|---------|
| Name | workflow.name (font-medium) |
| Status | Active = green Badge, Inactive = gray Badge |
| Created | formatted date from `createdAt` |
| Updated | relative time from `updatedAt` |

**When a workflow row is clicked**, expand a detail section below the table (or use a Sheet/drawer sliding in from the right) showing:

**Execution History Panel:**
- Header: "Executions — {workflow.name}"
- Table of last 20 executions with columns:
  | Column | Content |
  |--------|---------|
  | ID | execution.id (truncated to 8 chars, monospace) |
  | Status | Color-coded badge: `success` = green, `error` = red, `running` = blue pulse, `waiting` = amber |
  | Started | formatted datetime |
  | Duration | calculated from `startedAt` and `stoppedAt` (e.g., "2.3s", "45s", "1m 23s") |
  | Mode | execution.mode (e.g., "trigger", "manual") if available |

**When an execution row is clicked**, show execution detail in a dialog/modal:
- Execution ID, status, start/stop times, duration
- If the execution data includes `data.resultData.runData`, show a simplified node list: node name + status + execution time for each node. Format as a vertical timeline or simple list.
- If no detailed data, show a message "Detailed node data not available"

Add loading skeletons and error states. If the edge function returns an error (e.g., n8n not configured), show a friendly message: "n8n integration not configured. Add N8N_BASE_URL and N8N_API_KEY to your edge function secrets."

### 5. Create `src/pages/admin/AdminApiHealth.tsx`

**Purpose:** Detailed API health dashboard with history charts.

**Data sources:**
- API registry: `supabase.rpc('admin_get_api_registry')` → returns array of `{ id, api_name, api_slug, health_check_url, health_check_method, expected_status_codes, timeout_ms, category, enabled, docs_url, created_at }`
- Health overview (latest): `supabase.rpc('admin_get_health_overview')`
- Health history for selected API: `supabase.rpc('admin_get_health_history', { p_api_slug: selectedSlug, p_hours: hoursRange })` → returns array of `{ status, response_time_ms, http_status_code, error_message, checked_at }`
- Manual health check: `supabase.functions.invoke('admin-system-monitor', { body: { action: 'manual_health_check', api_slug: slug } })`

**Layout (uses `<AdminLayout>`)**:

**API Registry Table** (main content)
Use a `<Table>` with columns:
| Column | Content |
|--------|---------|
| API | `api_name` (font-medium) + external link icon to `docs_url` if present |
| Category | Badge — core (blue), integration (purple), external (amber) |
| Endpoint | `health_check_url` (truncated, monospace, text-xs) |
| Method | `health_check_method` badge (small, outline) |
| Status | Color-coded pill from health_overview data (join on api_slug) — healthy/degraded/down/unknown |
| Latency | `response_time_ms` + "ms" with color coding: <500ms green, 500-2000ms amber, >2000ms red |
| Last Check | relative time from `checked_at` |
| Actions | "Check Now" button (small, outline variant) |

**"Check Now" button behavior:**
- On click, call `supabase.functions.invoke('admin-system-monitor', { body: { action: 'manual_health_check', api_slug: row.api_slug } })`
- Show a loading spinner on the button while checking
- On success, invalidate the `['admin-health-overview']` query to refresh the table
- On error, show a toast with the error message

**When an API row is clicked** (not the Check Now button), expand a detail panel below the row or open a Sheet showing:

**API Health Detail Panel:**
- API name, category, endpoint URL, method
- Time range selector: `<Tabs>` with "24h" | "7 days" options (default 24h, maps to p_hours: 24 or 168)
- **Latency Chart**: Line chart using `recharts` (`<LineChart>` with `<Line>` for response_time_ms over time)
  - X axis: time (formatted hour:minute for 24h, day for 7d)
  - Y axis: response time in ms
  - Line color: emerald-500
  - Same chart styling as the bar chart in AdminDashboard (dark theme, zinc backgrounds)
- **Status Timeline**: Below the chart, a horizontal bar or series of small dots showing status over time
  - Green = healthy, Yellow = degraded, Red = down/error/timeout
  - This is a visual indicator, can be implemented as a row of small colored squares
- **Recent Checks Table**: Last 10 health checks for this API
  | Status | HTTP Code | Latency | Error | Time |
  |--------|-----------|---------|-------|------|

Use `refetchInterval: 60000` on the health overview query. Add proper loading skeletons for all sections.

### 6. Update `AdminDashboard.tsx` — add system health summary

Add a new section below the existing "Quick Links" section:

**System Health Summary Card:**
- Card with header "System Health"
- Fetch `admin_get_system_summary` data
- Show: "{healthy_apis}/{total_apis} APIs healthy" with a progress-bar-like indicator (green portion = healthy, yellow = degraded, red = down)
- "Avg latency: {avg_response_time_ms}ms"
- Link: "View details →" pointing to `/admin/system`

Also add "System Overview" to the quickLinks array:
```ts
{ label: 'System Overview', to: '/admin/system' },
```

## Styling Requirements

- Match the existing dark theme: `bg-zinc-900`, `bg-zinc-800/50`, `border-zinc-700`
- Use `emerald` for healthy/positive states, `amber` for warnings/degraded, `red` for errors/down
- Category badges: `core` = small badge with blue-ish bg, `integration` = purple, `external` = amber
- Status dots: small 8px circles with appropriate colors, with a subtle pulse animation for "running" status
- All text in `text-foreground` or `text-muted-foreground`
- Use `<Skeleton>` components from shadcn for all loading states
- Responsive: stack to single column on mobile

## Import Patterns

Follow the existing patterns exactly:
```ts
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
```

For charts, use `recharts` (already installed):
```ts
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
```

## Edge Function Invocation Pattern

For n8n proxy calls, use:
```ts
const { data, error } = await supabase.functions.invoke('admin-system-monitor', {
  body: { action: 'n8n_list_workflows' },
});
if (error) throw error;
return data.data; // The edge function wraps response in { data: ... }
```

## Error Handling

- If any RPC call fails, show an error card with the message and a "Retry" button that calls `queryClient.invalidateQueries()`
- If the edge function returns a 403, show "Admin access required"
- If the edge function returns a 500 with "n8n configuration missing", show the friendly configuration message
- Use `toast.error()` for action failures (like manual health check failing)

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/admin/AdminLayout.tsx` | MODIFY — add 3 nav items |
| `src/App.tsx` | MODIFY — add 3 routes |
| `src/pages/admin/AdminSystemOverview.tsx` | CREATE |
| `src/pages/admin/AdminWorkflows.tsx` | CREATE |
| `src/pages/admin/AdminApiHealth.tsx` | CREATE |
| `src/pages/admin/AdminDashboard.tsx` | MODIFY — add system health summary card |
