import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FilterBarProps {
  companies: string[];
  tags: string[];
  selectedCompany: string;
  selectedTag: string;
  selectedMagnitude: string;
  onCompanyChange: (value: string) => void;
  onTagChange: (value: string) => void;
  onMagnitudeChange: (value: string) => void;
}

export function FilterBar({
  companies,
  tags,
  selectedCompany,
  selectedTag,
  selectedMagnitude,
  onCompanyChange,
  onTagChange,
  onMagnitudeChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Select value={selectedCompany} onValueChange={onCompanyChange}>
        <SelectTrigger className="w-[180px] bg-card border-border text-foreground font-mono text-sm">
          <SelectValue placeholder="All Companies" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          <SelectItem value="all" className="text-foreground focus:bg-muted focus:text-foreground font-mono text-sm">
            All Companies
          </SelectItem>
          {companies.map((company) => (
            <SelectItem
              key={company}
              value={company}
              className="text-foreground focus:bg-muted focus:text-foreground font-mono text-sm"
            >
              {company}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedTag} onValueChange={onTagChange}>
        <SelectTrigger className="w-[180px] bg-card border-border text-foreground font-mono text-sm">
          <SelectValue placeholder="All Tags" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          <SelectItem value="all" className="text-foreground focus:bg-muted focus:text-foreground font-mono text-sm">
            All Tags
          </SelectItem>
          {tags.map((tag) => (
            <SelectItem
              key={tag}
              value={tag}
              className="text-foreground focus:bg-muted focus:text-foreground font-mono text-sm"
            >
              {tag}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedMagnitude} onValueChange={onMagnitudeChange}>
        <SelectTrigger className="w-[180px] bg-card border-border text-foreground font-mono text-sm">
          <SelectValue placeholder="All Priorities" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          <SelectItem value="all" className="text-foreground focus:bg-muted focus:text-foreground font-mono text-sm">
            All Priorities
          </SelectItem>
          <SelectItem value="minor" className="text-foreground focus:bg-muted focus:text-foreground font-mono text-sm">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-terminal-green" />
              Low
            </span>
          </SelectItem>
          <SelectItem value="moderate" className="text-foreground focus:bg-muted focus:text-foreground font-mono text-sm">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-terminal-amber" />
              Medium
            </span>
          </SelectItem>
          <SelectItem value="major" className="text-foreground focus:bg-muted focus:text-foreground font-mono text-sm">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-terminal-red" />
              High
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
