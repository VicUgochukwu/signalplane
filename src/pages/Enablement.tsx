import { useState } from 'react';
import { BookOpen, MessageSquare, Star } from 'lucide-react';
import { IconSignalEnablement } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { EnablementDashboard } from '@/components/enablement/EnablementScorecard';
import { ArtifactFeedbackForm } from '@/components/enablement/ArtifactFeedbackForm';

export default function Enablement() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 md:py-8 flex-1">
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <IconSignalEnablement className="h-6 w-6 text-amber-400" />
            Sales Enablement
          </h1>
          <p className="text-muted-foreground mt-2">
            Track artifact delivery, collect rep feedback, and monitor enablement coverage gaps
          </p>
        </div>
        <Button
          onClick={() => setFeedbackOpen(true)}
          variant="outline"
          className="gap-2 shrink-0"
        >
          <Star className="h-4 w-4" />
          <span className="hidden sm:inline">Rate Artifact</span>
          <span className="sm:hidden">Rate</span>
        </Button>
      </div>

      {/* Dashboard */}
      <EnablementDashboard />

      {/* Feedback Dialog (can be opened from header button) */}
      <ArtifactFeedbackForm
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
      />
    </div>
  );
}
