export interface ChangelogEntry {
  week_start_date: string;
  company_name: string;
  company_slug: string;
  url: string;
  url_type: string;
  primary_tag: string;
  diff_summary: string;
  implication: string;
  confidence: number;
  change_magnitude: 'minor' | 'moderate' | 'major';
}
