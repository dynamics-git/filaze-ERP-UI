export interface ErpFactboxFieldConfig {
  id: string;
  label: string;
  field?: string;
}

export interface ErpFactboxBadgeConfig {
  id: string;
  label?: string;
  field?: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}

export interface ErpFactboxSectionConfig {
  id: string;
  title: string;
  subtitle?: string;
  fields?: ErpFactboxFieldConfig[];
  badges?: ErpFactboxBadgeConfig[];
  collapsed?: boolean;
}

export interface ErpFactboxConfig {
  id: string;
  title?: string;
  subtitle?: string;
  enabled?: boolean;
  width?: string;
  sections: ErpFactboxSectionConfig[];
  defaultSectionId?: string;
}
