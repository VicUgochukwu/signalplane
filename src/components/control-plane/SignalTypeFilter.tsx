import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Shield, 
  Share2, 
  Briefcase, 
  TrendingDown, 
  FlaskConical,
  MessageSquare,
  Target,
  Package
} from 'lucide-react';
import { SignalType, SIGNAL_TYPE_CONFIG } from '@/types/controlPlane';
import { cn } from '@/lib/utils';

interface SignalTypeFilterProps {
  selectedTypes: SignalType[];
  onToggle: (type: SignalType) => void;
  availableTypes?: SignalType[];
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  DollarSign,
  Shield,
  Share2,
  Briefcase,
  TrendingDown,
  FlaskConical,
  MessageSquare,
  Target,
  Package,
};

export function SignalTypeFilter({ 
  selectedTypes, 
  onToggle,
  availableTypes = Object.keys(SIGNAL_TYPE_CONFIG) as SignalType[]
}: SignalTypeFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {availableTypes.map((type) => {
        const config = SIGNAL_TYPE_CONFIG[type];
        const Icon = ICON_MAP[config.icon];
        const isSelected = selectedTypes.includes(type);
        
        return (
          <Badge
            key={type}
            variant="outline"
            className={cn(
              'cursor-pointer transition-all duration-200 flex items-center gap-1.5 py-1.5 px-3',
              isSelected
                ? `${config.bgColor} ${config.color} ${config.borderColor} border`
                : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/30'
            )}
            onClick={() => onToggle(type)}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            <span className="text-xs font-medium">{config.label}</span>
          </Badge>
        );
      })}
    </div>
  );
}

// Compact inline badge for displaying a single signal type
export function SignalTypeBadge({ type }: { type: SignalType }) {
  const config = SIGNAL_TYPE_CONFIG[type];
  const Icon = ICON_MAP[config.icon];
  
  return (
    <Badge
      variant="outline"
      className={`${config.bgColor} ${config.color} ${config.borderColor} border flex items-center gap-1`}
    >
      {Icon && <Icon className="h-3 w-3" />}
      <span className="text-xs">{config.label}</span>
    </Badge>
  );
}
