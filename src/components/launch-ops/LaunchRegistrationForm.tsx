import { useState } from 'react';
import { Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LAUNCH_TYPE_CONFIG, type LaunchType } from '@/types/launchOps';
import { useLaunchOps } from '@/hooks/useLaunchOps';

interface LaunchRegistrationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LaunchRegistrationForm({ open, onOpenChange }: LaunchRegistrationFormProps) {
  const { registerLaunch } = useLaunchOps();

  const [launchName, setLaunchName] = useState('');
  const [productName, setProductName] = useState('');
  const [launchType, setLaunchType] = useState<LaunchType>('feature_launch');
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  const [competitorInput, setCompetitorInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  const reset = () => {
    setLaunchName('');
    setProductName('');
    setLaunchType('feature_launch');
    setTargetDate('');
    setDescription('');
    setCompetitorInput('');
    setTagInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!launchName || !productName || !targetDate) return;

    const competitorNames = competitorInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const tags = tagInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    await registerLaunch.mutateAsync({
      launchName,
      productName,
      launchType,
      targetDate,
      description: description || undefined,
      competitorNames: competitorNames.length > 0 ? competitorNames : undefined,
      tags: tags.length > 0 ? tags : undefined,
    });

    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-orange-400" />
            Register New Launch
          </DialogTitle>
          <DialogDescription>
            Add a product launch to track through its full lifecycle.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="launch-name">Launch Name *</Label>
              <Input
                id="launch-name"
                placeholder="e.g. V3.0 Release"
                value={launchName}
                onChange={(e) => setLaunchName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-name">Product Name *</Label>
              <Input
                id="product-name"
                placeholder="e.g. Signal Plane"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="launch-type">Launch Type</Label>
              <Select value={launchType} onValueChange={(v) => setLaunchType(v as LaunchType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LAUNCH_TYPE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="target-date">Target Launch Date *</Label>
              <Input
                id="target-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of what you're launching and why..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="competitors">Competitors (comma-separated)</Label>
            <Input
              id="competitors"
              placeholder="e.g. Klue, Crayon, Kompyte"
              value={competitorInput}
              onChange={(e) => setCompetitorInput(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="e.g. Q1, enterprise, AI"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={registerLaunch.isPending || !launchName || !productName || !targetDate}
              className="gap-2"
            >
              <Rocket className="h-4 w-4" />
              {registerLaunch.isPending ? 'Registering...' : 'Register Launch'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
