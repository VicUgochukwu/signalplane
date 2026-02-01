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
        <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700 text-zinc-100">
          <SelectValue placeholder="All Companies" />
        </SelectTrigger>
        <SelectContent className="bg-zinc-800 border-zinc-700">
          <SelectItem value="all" className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100">
            All Companies
          </SelectItem>
          {companies.map((company) => (
            <SelectItem 
              key={company} 
              value={company}
              className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100"
            >
              {company}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedTag} onValueChange={onTagChange}>
        <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700 text-zinc-100">
          <SelectValue placeholder="All Tags" />
        </SelectTrigger>
        <SelectContent className="bg-zinc-800 border-zinc-700">
          <SelectItem value="all" className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100">
            All Tags
          </SelectItem>
          {tags.map((tag) => (
            <SelectItem 
              key={tag} 
              value={tag}
              className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100"
            >
              {tag}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedMagnitude} onValueChange={onMagnitudeChange}>
        <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700 text-zinc-100">
          <SelectValue placeholder="All Magnitudes" />
        </SelectTrigger>
        <SelectContent className="bg-zinc-800 border-zinc-700">
          <SelectItem value="all" className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100">
            All Magnitudes
          </SelectItem>
          <SelectItem value="minor" className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100">
            Minor
          </SelectItem>
          <SelectItem value="moderate" className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100">
            Moderate
          </SelectItem>
          <SelectItem value="major" className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100">
            Major
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
