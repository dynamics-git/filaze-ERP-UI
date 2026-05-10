import { LineDataConfig } from './line-data.config';

export interface SetupHubItem {
  title: string;
  description?: string;
  /** Bootstrap icon class, e.g. 'bi bi-building' */
  icon?: string;
  lineConfig: LineDataConfig;
}
