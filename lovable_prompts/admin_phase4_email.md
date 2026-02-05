# Lovable Prompt — Admin Panel Phase 4: Email Campaigns & Communication

## Context

We have an admin panel with sidebar layout at `/admin/*` routes. Phase 1 built: `AdminDashboard`, `AdminUsers`, `AdminAuditLog`, `AdminFeatureFlags`. Phase 2 added: `AdminSystemOverview`, `AdminWorkflows`, `AdminApiHealth`. Phase 3 added: `AdminCsvUpload`, `AdminUsageReports`, enhanced feature flags CRUD. Now we add email campaign management with templates, audience segmentation, campaign sending, and delivery analytics — all powered by Resend email API.

**Backend is fully deployed:**
- New tables: `admin.newsletter_templates`, `admin.audience_segments`, `admin.email_campaigns`, `admin.email_send_log`, `admin.email_unsubscribe_tokens`
- Template RPCs: `admin_create_newsletter_template`, `admin_list_newsletter_templates`, `admin_get_newsletter_template`, `admin_update_newsletter_template`, `admin_delete_newsletter_template`
- Segment RPCs: `admin_create_audience_segment`, `admin_list_audience_segments`, `admin_get_audience_segment`, `admin_update_audience_segment`, `admin_delete_audience_segment`, `admin_preview_segment`
- Campaign RPCs: `admin_create_email_campaign`, `admin_list_email_campaigns`, `admin_get_email_campaign`, `admin_update_email_campaign`, `admin_cancel_email_campaign`
- Analytics RPCs: `admin_get_campaign_stats`, `admin_get_email_analytics_overview`, `admin_get_campaign_send_log`
- Edge functions: `email-send` (actions: `send_test`, `send_campaign`), `email-webhook` (Resend delivery event handler)
- Feature flag: `email_campaigns` (enabled for admin)

## What to build

### 1. Create `src/pages/admin/AdminEmailTemplates.tsx` — Email Template Manager

**Purpose:** CRUD for email templates with HTML preview and send-test capability.

**Data sources:**
- List: `supabase.rpc('admin_list_newsletter_templates', { p_category: filterValue, p_include_archived: showArchived })`
- Get single: `supabase.rpc('admin_get_newsletter_template', { p_template_id: id })`
- Create: `supabase.rpc('admin_create_newsletter_template', { p_name, p_subject, p_body_html, p_body_text, p_variables, p_category })`
- Update: `supabase.rpc('admin_update_newsletter_template', { p_template_id, p_name, p_subject, p_body_html, p_body_text, p_variables, p_category })`
- Delete (archive): `supabase.rpc('admin_delete_newsletter_template', { p_template_id: id })`
- Send test: Edge function call (see below)

**Return types:**
```ts
interface NewsletterTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string | null;
  variables: string[];
  category: string; // 'general' | 'newsletter' | 'announcement' | 'onboarding' | 're-engagement'
  is_archived: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// List returns lightweight version (no body_html/body_text/created_by)
interface NewsletterTemplateListItem {
  id: string;
  name: string;
  subject: string;
  category: string;
  variables: string[];
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}
```

**Layout (uses `<AdminLayout>`):**

**Header row:**
- Title "Email Templates" (h2)
- Right side: category filter Select ("All", "general", "newsletter", "announcement", "onboarding", "re-engagement"), "Show Archived" toggle Switch, "Create Template" Button (primary, emerald)

**Template grid** (grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4):
- Each template is a Card with:
  - CardHeader: template name (font-semibold), category Badge (see badge colors below), and a DropdownMenu (three dots icon) with: "Edit", "Preview", "Send Test", "Archive" (or "Unarchive" if archived)
  - CardContent: subject line in `text-sm text-muted-foreground`, variable tags as small Badges (`bg-zinc-700 text-zinc-300`), and `updated_at` as relative time at bottom
  - If archived: add `opacity-60` to the card and show a small "Archived" badge

**Category badge colors:**
- `general` → `bg-zinc-600`
- `newsletter` → `bg-emerald-500/20 text-emerald-400`
- `announcement` → `bg-blue-500/20 text-blue-400`
- `onboarding` → `bg-purple-500/20 text-purple-400`
- `re-engagement` → `bg-amber-500/20 text-amber-400`

**Create/Edit Dialog:**
- Name — text Input (required)
- Subject — text Input (required), with hint: "Use {{first_name}}, {{company_name}} for personalization"
- Category — Select with the 5 category options
- Variables — comma-separated text Input, parse into string array on submit. Show hint: "Available: first_name, email, company_name, unsubscribe_url"
- Body HTML — Textarea (rows=12, monospace font `font-mono text-sm`), required
- Body Text — Textarea (rows=6), optional, with hint: "Plain text fallback for email clients that don't support HTML"
- Below the HTML textarea, a "Preview" button that toggles an iframe showing the rendered HTML
- Dialog footer: Cancel, Save buttons

**Preview pane (shown when "Preview" clicked from dropdown or from dialog):**
- A Dialog that shows the template rendered in an iframe
- The iframe uses `srcDoc` attribute with the `body_html` content
- Iframe has a white background and border, height 400px
- Above the iframe, show the subject line

**Send Test Email:**
- When "Send Test" is clicked from a template card dropdown:
  - Show a small confirmation Dialog: "Send a test of '{template.name}' to your email address?"
  - On confirm, call the edge function:
    ```ts
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dnqjzgfunvbofsuibcsk.supabase.co';
    const response = await fetch(`${supabaseUrl}/functions/v1/email-send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'send_test', template_id: template.id }),
    });
    ```
  - Show toast on success: "Test email sent! Check your inbox."
  - Show toast.error on failure with the error message

**Loading state:** Show Skeleton cards (3 cards in the grid) while loading.

### 2. Create `src/pages/admin/AdminAudienceSegments.tsx` — Audience Segmentation Builder

**Purpose:** Create and manage user segments with criteria-based filtering, with live preview of matching users.

**Data sources:**
- List: `supabase.rpc('admin_list_audience_segments')`
- Get single: `supabase.rpc('admin_get_audience_segment', { p_segment_id: id })`
- Create: `supabase.rpc('admin_create_audience_segment', { p_name, p_description, p_criteria })`
- Update: `supabase.rpc('admin_update_audience_segment', { p_segment_id, p_name, p_description, p_criteria })`
- Delete: `supabase.rpc('admin_delete_audience_segment', { p_segment_id: id })`
- Preview: `supabase.rpc('admin_preview_segment', { p_criteria: criteriaJson, p_limit: 20 })`

**Return types:**
```ts
interface AudienceSegment {
  id: string;
  name: string;
  description: string | null;
  criteria: SegmentCriteria;
  estimated_count: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface SegmentCriteria {
  role?: string[];          // e.g. ['user', 'admin']
  status?: string;          // 'active' | 'suspended' | 'banned'
  signup_after?: string;    // ISO date string
  signup_before?: string;   // ISO date string
  active_within_days?: number;
  min_tracked_companies?: number;
  has_delivery_channel?: string; // e.g. 'email', 'slack'
}

interface SegmentPreviewUser {
  user_id: string;
  email: string;
  display_name: string | null;
  role: string;
  last_active_at: string | null;
  created_at: string;
  tracked_companies: number;
  match_count: number; // total matching users (from window function)
}
```

**Layout (uses `<AdminLayout>`):**

**Header row:**
- Title "Audience Segments" (h2)
- "Create Segment" Button (primary, emerald)

**Segments list** (space-y-4):
- Each segment is a Card with:
  - CardHeader: segment name (font-semibold), estimated_count as Badge (`text-emerald-400`), DropdownMenu with "Edit", "Preview", "Delete"
  - CardContent: description (if present) in `text-sm text-muted-foreground`, criteria summary chips showing active filters (e.g., "Role: user", "Active within 30 days", "Min 2 tracked companies"), `updated_at` at bottom

**Criteria summary chips:** For each key in the criteria object, show a small Badge:
- `role` → "Role: {values.join(', ')}"
- `status` → "Status: {value}"
- `signup_after` → "Signed up after: {formatted date}"
- `signup_before` → "Signed up before: {formatted date}"
- `active_within_days` → "Active within {n} days"
- `min_tracked_companies` → "Min {n} companies"
- `has_delivery_channel` → "Has {channel}"

**Create/Edit Dialog (wide: max-w-2xl):**

Left column (segment details):
- Name — text Input (required)
- Description — Textarea (optional, rows=3)

Right column (criteria builder):
- **Role** — multi-select or checkboxes: "user", "admin", "super_admin"
- **Status** — Select: "Any" (no filter), "Active", "Suspended", "Banned"
- **Signed up after** — date Input (type="date")
- **Signed up before** — date Input (type="date")
- **Active within days** — number Input (placeholder: "e.g., 30")
- **Min tracked companies** — number Input (placeholder: "e.g., 1")
- **Has delivery channel** — Select: "Any" (no filter), "email", "slack", "notion"

Below the criteria builder, a "Preview" button that fetches `admin_preview_segment` with the current criteria.

**Preview section (shown below form in dialog, or in a separate area):**
- Header: "Matching Users: {match_count}" (use the `match_count` from the first row of results, which is a window count)
- Table with columns: Email, Display Name, Role, Last Active (relative time), Tracked Companies
- If no results: "No users match these criteria"
- Show max 20 rows with note "Showing first 20 of {match_count} matching users"

Dialog footer: Cancel, Save buttons. Save should build the criteria JSON from the form fields (only include non-empty fields).

**Delete confirmation:** "Are you sure you want to delete '{segment.name}'? This cannot be undone. Note: segments with active campaigns cannot be deleted."

**Loading state:** Skeleton cards.

### 3. Create `src/pages/admin/AdminEmailCampaigns.tsx` — Campaign Management

**Purpose:** Create email campaigns linking templates to segments, schedule/send them, view results.

**Data sources:**
- List: `supabase.rpc('admin_list_email_campaigns', { p_status: filterStatus, p_limit: 50 })`
- Get single: `supabase.rpc('admin_get_email_campaign', { p_campaign_id: id })`
- Create: `supabase.rpc('admin_create_email_campaign', { p_name, p_template_id, p_segment_id, p_from_name, p_from_email, p_reply_to, p_scheduled_at })`
- Update: `supabase.rpc('admin_update_email_campaign', { p_campaign_id, p_name, p_template_id, p_segment_id, ... })`
- Cancel: `supabase.rpc('admin_cancel_email_campaign', { p_campaign_id: id })`
- Campaign stats: `supabase.rpc('admin_get_campaign_stats', { p_campaign_id: id })`
- Send log: `supabase.rpc('admin_get_campaign_send_log', { p_campaign_id: id, p_status: null, p_limit: 100 })`
- Templates list (for Select): `supabase.rpc('admin_list_newsletter_templates')`
- Segments list (for Select): `supabase.rpc('admin_list_audience_segments')`
- Send campaign: Edge function call (see below)

**Return types:**
```ts
interface EmailCampaign {
  id: string;
  name: string;
  status: string; // 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled' | 'failed'
  template_name: string;
  segment_name: string;
  total_recipients: number;
  scheduled_at: string | null;
  sent_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface EmailCampaignDetail {
  id: string;
  name: string;
  status: string;
  template_id: string;
  template_name: string;
  template_subject: string;
  segment_id: string;
  segment_name: string;
  segment_criteria: object;
  total_recipients: number;
  from_name: string;
  from_email: string;
  reply_to: string;
  scheduled_at: string | null;
  sent_at: string | null;
  completed_at: string | null;
  metadata: object;
  created_by: string;
  created_at: string;
}

interface CampaignStats {
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  total_complained: number;
  total_failed: number;
  open_rate: number | null;
  click_rate: number | null;
  bounce_rate: number | null;
}

interface SendLogEntry {
  id: string;
  recipient_email: string;
  status: string;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  failed_reason: string | null;
  created_at: string;
}
```

**Layout (uses `<AdminLayout>`):**

**Header row:**
- Title "Email Campaigns" (h2)
- "Create Campaign" Button (primary, emerald)

**Status Tabs** using shadcn `<Tabs>`: "All" | "Draft" | "Scheduled" | "Sending" | "Sent" | "Cancelled"

**Campaign table** (or cards):
- Table with columns:
  | Column | Content |
  |--------|---------|
  | Name | campaign name (font-medium) |
  | Status | status Badge (see colors below) |
  | Template | template_name (text-sm) |
  | Segment | segment_name (text-sm) |
  | Recipients | total_recipients |
  | Scheduled | scheduled_at (formatted date, or "—" if null) |
  | Sent | sent_at (formatted date, or "—" if null) |
  | Actions | DropdownMenu: "View Details", "Edit" (only draft/scheduled), "Send Now" (only draft/scheduled), "Cancel" (only draft/scheduled) |

**Status badge colors:**
- `draft` → `bg-zinc-600 text-zinc-300`
- `scheduled` → `bg-blue-500/20 text-blue-400`
- `sending` → `bg-amber-500/20 text-amber-400` (pulsing animation)
- `sent` → `bg-emerald-500/20 text-emerald-400`
- `cancelled` → `bg-zinc-500/20 text-zinc-400`
- `failed` → `bg-red-500/20 text-red-400`

**Create/Edit Campaign Dialog (max-w-xl):**
- Name — text Input (required)
- Template — Select dropdown populated from `admin_list_newsletter_templates` (show template name + subject)
- Segment — Select dropdown populated from `admin_list_audience_segments` (show name + estimated_count)
- From Name — text Input (default: "SignalPlane")
- From Email — text Input (default: "hello@signalplane.dev")
- Reply To — text Input (default: "hello@signalplane.dev")
- Schedule At — datetime-local Input (optional, leave empty for draft)
- Footer: Cancel, Save

**"Send Now" action:**
- Confirmation Dialog: "Are you sure you want to send '{campaign.name}' to the '{campaign.segment_name}' audience? This action cannot be undone."
- On confirm, call the edge function:
  ```ts
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dnqjzgfunvbofsuibcsk.supabase.co';
  const response = await fetch(`${supabaseUrl}/functions/v1/email-send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'send_campaign', campaign_id: campaign.id }),
  });
  ```
- Show toast on success, invalidate campaigns query
- Show toast.error on failure

**"View Details" — Campaign Detail Dialog or expandable panel:**
- Show campaign metadata (name, status, template, segment, from, dates)
- **Stats Cards row** (grid-cols-2 md:grid-cols-4):
  | Card | Value | Color |
  |------|-------|-------|
  | Sent | total_sent | blue |
  | Delivered | total_delivered | emerald |
  | Opened | total_opened + open_rate% | amber |
  | Clicked | total_clicked + click_rate% | purple |
  | Bounced | total_bounced + bounce_rate% | red |
- **Send Log Table** below the stats:
  | Column | Content |
  |--------|---------|
  | Email | recipient_email |
  | Status | status Badge |
  | Opened At | formatted date or "—" |
  | Clicked At | formatted date or "—" |
  | Bounced At | formatted date or "—" |
  | Error | failed_reason or "—" |

**Send log status badge colors:**
- `queued` → zinc
- `sent` → blue
- `delivered` → emerald
- `opened` → amber
- `clicked` → purple
- `bounced` → red
- `complained` → red
- `failed` → red

**Loading state:** Skeleton table rows.

### 4. Create `src/pages/admin/AdminEmailAnalytics.tsx` — Email Analytics Dashboard

**Purpose:** Overview of email campaign performance with aggregate stats and per-campaign comparison.

**Data sources:**
- Overview: `supabase.rpc('admin_get_email_analytics_overview', { p_days: periodDays })` → returns `{ total_campaigns, total_emails_sent, avg_open_rate, avg_click_rate, avg_bounce_rate }`
- Campaign list with stats: `supabase.rpc('admin_list_email_campaigns', { p_status: 'sent', p_limit: 20 })` then for each: `supabase.rpc('admin_get_campaign_stats', { p_campaign_id: id })`
  - **Alternatively, to reduce queries**: Just show the campaign list and let users click into detail view. Show `total_recipients` as the primary stat on the list.

**Return types:**
```ts
interface EmailAnalyticsOverview {
  total_campaigns: number;
  total_emails_sent: number;
  avg_open_rate: number | null;
  avg_click_rate: number | null;
  avg_bounce_rate: number | null;
}
```

**Layout (uses `<AdminLayout>`):**

**Header row:**
- Title "Email Analytics" (h2)
- Period select: "Last 7 days" | "Last 30 days" (default) | "Last 90 days"

**Summary Cards** (grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4):
| Card | Value | Icon | Color |
|------|-------|------|-------|
| Campaigns Sent | total_campaigns | `Send` (lucide) | `text-blue-400` |
| Emails Sent | total_emails_sent (formatted with commas) | `Mail` | `text-emerald-400` |
| Avg Open Rate | avg_open_rate% (or "—" if null) | `MailOpen` | `text-amber-400` |
| Avg Click Rate | avg_click_rate% (or "—" if null) | `MousePointerClick` | `text-purple-400` |
| Avg Bounce Rate | avg_bounce_rate% (or "—" if null) | `MailX` | `text-red-400` |

**Performance benchmarks** (below cards):
- A simple info section showing how the rates compare to industry averages:
  - Open rate: good if > 20%, great if > 30%
  - Click rate: good if > 2%, great if > 5%
  - Bounce rate: good if < 2%, concerning if > 5%
- Show with colored indicators (emerald for good, amber for average, red for bad)

**Recent Campaigns Table:**
- Card with header "Recent Campaigns"
- Table: Name, Status Badge, Recipients, Sent Date
- Click on a campaign row navigates to `/admin/email-campaigns` (or shows stats inline)
- If no campaigns yet: "No campaigns sent yet. Create your first campaign to see analytics here." with a link to `/admin/email-campaigns`

**Loading state:** Skeleton cards and table rows.

### 5. Modify `src/components/admin/AdminLayout.tsx` — Add Communication section

Add a section divider and 4 new nav items. The nav items need to be grouped. Update the navItems array and rendering to support sections:

```ts
import { LayoutDashboard, Users, ToggleLeft, ScrollText, ArrowLeft, Shield, Activity, GitBranch, Wifi, Upload, BarChart3, FileText, Send, UsersRound, BarChart } from 'lucide-react';

const navSections = [
  {
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { to: '/admin/users', label: 'Users', icon: Users },
      { to: '/admin/feature-flags', label: 'Feature Flags', icon: ToggleLeft },
      { to: '/admin/audit-log', label: 'Audit Log', icon: ScrollText },
      { to: '/admin/system', label: 'System Overview', icon: Activity },
      { to: '/admin/workflows', label: 'Workflows', icon: GitBranch },
      { to: '/admin/api-health', label: 'API Health', icon: Wifi },
      { to: '/admin/csv-upload', label: 'CSV Upload', icon: Upload },
      { to: '/admin/usage', label: 'Usage Reports', icon: BarChart3 },
    ],
  },
  {
    label: 'Communication',
    items: [
      { to: '/admin/email-templates', label: 'Email Templates', icon: FileText },
      { to: '/admin/email-campaigns', label: 'Campaigns', icon: Send },
      { to: '/admin/audience-segments', label: 'Audience', icon: UsersRound },
      { to: '/admin/email-analytics', label: 'Email Analytics', icon: BarChart },
    ],
  },
];
```

Update the `<nav>` section to render sections:
```tsx
<nav className="flex-1 p-4 space-y-1 overflow-y-auto">
  {navSections.map((section, sectionIdx) => (
    <div key={sectionIdx}>
      {section.label && (
        <div className="px-3 py-2 mt-4 mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {section.label}
        </div>
      )}
      {section.items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
            isActive(item.to, item.exact)
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </div>
  ))}
</nav>
```

Note: Keep the `isActive` function and the `ArrowLeft` back link exactly as they are. Also add `overflow-y-auto` to the nav element since the sidebar is getting longer.

### 6. Modify `src/App.tsx` — Add 4 new routes

Add these routes in the admin section (before the catch-all `*` route), each wrapped in `<AdminRoute>`:

```tsx
<Route path="/admin/email-templates" element={<AdminRoute><AdminEmailTemplates /></AdminRoute>} />
<Route path="/admin/email-campaigns" element={<AdminRoute><AdminEmailCampaigns /></AdminRoute>} />
<Route path="/admin/audience-segments" element={<AdminRoute><AdminAudienceSegments /></AdminRoute>} />
<Route path="/admin/email-analytics" element={<AdminRoute><AdminEmailAnalytics /></AdminRoute>} />
```

Import the 4 new page components from `@/pages/admin/`:
```ts
import AdminEmailTemplates from "./pages/admin/AdminEmailTemplates";
import AdminEmailCampaigns from "./pages/admin/AdminEmailCampaigns";
import AdminAudienceSegments from "./pages/admin/AdminAudienceSegments";
import AdminEmailAnalytics from "./pages/admin/AdminEmailAnalytics";
```

## Styling Requirements

- Match the existing dark theme: `bg-zinc-900`, `bg-zinc-800/50`, `border-zinc-700`
- Use `emerald` for positive/success states, `amber` for warnings, `red` for errors
- Card backgrounds: `bg-zinc-800/50 border-zinc-700`
- All text in `text-foreground` or `text-muted-foreground`
- Use `<Skeleton>` components from shadcn for all loading states
- Responsive: stack to single column on mobile, 2-3 columns on desktop
- Monospace font for HTML template editing: `font-mono text-sm`
- Iframe previews: white background with border, contrasting the dark admin theme

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
- If the edge function returns a 401, show "Please log in"
- Use `toast.error()` for action failures (send campaign fail, delete fail, etc.)
- Use `toast.success()` for successful actions (template created, campaign sent, etc.)
- For the send campaign action: if the edge function returns a rate limit error, show "Daily email limit reached (100 emails/day on free tier)"

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/admin/AdminEmailTemplates.tsx` | CREATE |
| `src/pages/admin/AdminAudienceSegments.tsx` | CREATE |
| `src/pages/admin/AdminEmailCampaigns.tsx` | CREATE |
| `src/pages/admin/AdminEmailAnalytics.tsx` | CREATE |
| `src/components/admin/AdminLayout.tsx` | MODIFY — add Communication section with 4 nav items |
| `src/App.tsx` | MODIFY — add 4 routes |
