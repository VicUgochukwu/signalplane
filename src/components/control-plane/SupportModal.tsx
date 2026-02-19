import { useState } from 'react';
import { LifeBuoy, Mail, ScrollText, Bug, FlaskConical, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SidebarMenuButton } from '@/components/ui/sidebar';

const supportLinks = [
  {
    icon: Mail,
    label: 'Email Support',
    description: 'Get help from the Control Plane team',
    href: 'mailto:support@signalplane.dev',
    external: true,
  },
  {
    icon: Bug,
    label: 'Report a Bug',
    description: 'Something not working? Let us know',
    href: 'mailto:support@signalplane.dev?subject=Bug%20Report',
    external: true,
  },
  {
    icon: FlaskConical,
    label: 'Feature Request',
    description: 'Suggest a new feature or improvement',
    href: 'mailto:support@signalplane.dev?subject=Feature%20Request',
    external: true,
  },
  {
    icon: ScrollText,
    label: 'Documentation',
    description: 'Learn how to get the most from Control Plane',
    href: 'https://signalplane.dev',
    external: true,
  },
];

export function SupportModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <SidebarMenuButton tooltip="Support">
          <LifeBuoy className="h-4 w-4" />
          <span>Support</span>
        </SidebarMenuButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-base">How can we help?</DialogTitle>
          <DialogDescription>
            Get support, report issues, or share feedback with the Control Plane team.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 pt-2">
          {supportLinks.map(({ icon: Icon, label, description, href, external }) => (
            <a
              key={label}
              href={href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              onClick={() => setOpen(false)}
              className="flex items-start gap-3 rounded-lg border border-border/40 px-3.5 py-3 transition-colors hover:bg-muted/50 hover:border-border group"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-badge bg-[hsl(var(--accent-signal)/0.1)] text-accent-signal mt-0.5">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  {external && (
                    <ExternalLink className="h-3 w-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              </div>
            </a>
          ))}
        </div>
        <div className="pt-3 border-t border-border/30">
          <p className="text-[11px] text-muted-foreground/50 text-center">
            You can also ask <span className="text-accent-signal/70 font-medium">Control Plane AI</span> for help using the app — press <kbd className="px-1 py-0.5 rounded-badge border border-border/40 text-[10px] font-mono">⌘K</kbd>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
