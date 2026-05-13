export interface FactboxFieldConfig {
  id: string;
  label: string;
  field?: string;
}

export interface FactboxBadgeConfig {
  id: string;
  label?: string;
  field?: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}

export interface FactboxSectionConfig {
  id: string;
  title: string;
  subtitle?: string;
  fields?: FactboxFieldConfig[];
  badges?: FactboxBadgeConfig[];
  collapsed?: boolean;
}

export interface FactboxConfig {
  id: string;
  title?: string;
  subtitle?: string;
  enabled?: boolean;
  width?: string;
  sections: FactboxSectionConfig[];
  defaultSectionId?: string;
}
