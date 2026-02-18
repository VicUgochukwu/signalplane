import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, Loader2, ArrowRight, SendHorizonal } from 'lucide-react';
import { IconSubmitSignal } from '@/components/icons';
import { Link } from 'react-router-dom';
import { useSubmitSignal } from '@/hooks/useSubmitSignal';

const SIGNAL_TYPES = [
  { value: 'messaging', label: 'Messaging' },
  { value: 'narrative', label: 'Narrative' },
  { value: 'icp', label: 'ICP' },
  { value: 'horizon', label: 'Horizon' },
  { value: 'objection', label: 'Objection' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'other', label: 'Other' },
];

const SOURCE_TYPES = [
  { value: 'manual', label: 'Manual' },
  { value: 'sales_call', label: 'Sales Call' },
  { value: 'support_ticket', label: 'Support Ticket' },
  { value: 'crm_note', label: 'CRM Note' },
  { value: 'win_loss', label: 'Win/Loss' },
];

const SEVERITY_LEVELS = [
  { value: '1', label: '1 — Low' },
  { value: '2', label: '2 — Minor' },
  { value: '3', label: '3 — Moderate' },
  { value: '4', label: '4 — High' },
  { value: '5', label: '5 — Critical' },
];

export default function SubmitSignal() {
  const { submitSignal, isSubmitting, isSuccess, reset } = useSubmitSignal();

  const [text, setText] = useState('');
  const [signalType, setSignalType] = useState('other');
  const [sourceType, setSourceType] = useState('manual');
  const [company, setCompany] = useState('');
  const [severity, setSeverity] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length < 10) return;

    submitSignal({
      text: text.trim(),
      signal_type: signalType,
      source_type: sourceType,
      ...(company.trim() && { company: company.trim() }),
      ...(severity && { severity: parseInt(severity) }),
    });
  };

  const handleReset = () => {
    setText('');
    setSignalType('other');
    setSourceType('manual');
    setCompany('');
    setSeverity('');
    reset();
  };

  return (
    <main className="flex-1 container max-w-4xl mx-auto px-4 py-6 md:py-8">
        {isSuccess ? (
          <Card className="bg-emerald-500/10 border-emerald-500/30">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Signal submitted
              </h3>
              <p className="text-muted-foreground mb-6">
                It will be processed and included in your next weekly packet.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={handleReset}>
                  Submit Another
                </Button>
                <Link to="/control-plane">
                  <Button variant="outline">
                    Back to Packets
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <IconSubmitSignal className="h-5 w-5 text-accent-signal" />
                Submit a Signal
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                Paste competitive intelligence — Gong snippets, support tickets,
                win/loss notes, or any insight. Processed and included in your next weekly packet.
              </p>
            </div>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Signal Details</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Only the text field is required. Additional context helps the scoring engine.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Text area */}
                  <div className="space-y-2">
                    <Label htmlFor="signal-text">
                      Signal Text <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="signal-text"
                      placeholder="Paste a Gong snippet, support ticket, win/loss note, or any competitive insight..."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      className="min-h-[160px] bg-background border-border resize-y"
                      required
                      minLength={10}
                    />
                    <p className="text-xs text-muted-foreground">
                      {text.trim().length < 10
                        ? `${10 - text.trim().length} more characters needed`
                        : `${text.trim().length} characters`}
                    </p>
                  </div>

                  {/* Signal type + Source type row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signal-type">Signal Type</Label>
                      <Select value={signalType} onValueChange={setSignalType}>
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SIGNAL_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="source-type">Source Type</Label>
                      <Select value={sourceType} onValueChange={setSourceType}>
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SOURCE_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Company + Severity row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company (optional)</Label>
                      <Input
                        id="company"
                        placeholder="Which competitor is this about?"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="severity">Severity (optional)</Label>
                      <Select value={severity} onValueChange={setSeverity}>
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="Select severity..." />
                        </SelectTrigger>
                        <SelectContent>
                          {SEVERITY_LEVELS.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={isSubmitting || text.trim().length < 10}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Signal'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Bulk upload link */}
            <div className="text-center">
              <Link
                to="/control-plane/upload"
                className="inline-flex items-center gap-2 text-accent-signal hover:text-[hsl(var(--accent-signal)/0.8)] transition-colors text-sm font-medium"
              >
                Have a CSV file? Upload in bulk
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
    </main>
  );
}
