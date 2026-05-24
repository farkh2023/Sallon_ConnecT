export type WidgetSize     = 'small' | 'medium' | 'large' | 'full';
export type WidgetCategory = 'system' | 'backup' | 'network' | 'plugins' | 'notifications' | 'updates';

export interface WidgetManifest {
  id:          string;
  name:        string;
  version:     string;
  description: string;
  component:   string;
  permissions: string[];
  defaultSize: WidgetSize;
  localOnly:   boolean;
  category:    WidgetCategory;
  refreshable: boolean;
}

export interface WidgetProps {
  widgetId: string;
  size:     WidgetSize;
}

export interface WidgetLayoutItem {
  widgetId: string;
  size:     WidgetSize;
  visible:  boolean;
  order:    number;
}

export interface SavedDashboardLayout {
  version:   string;
  updatedAt: string;
  widgets:   WidgetLayoutItem[];
}

/** Spans CSS par taille (grille 4 colonnes sur lg, 2 sur sm, 1 sur base) */
export const WIDGET_COL_SPAN: Record<WidgetSize, string> = {
  small:  'col-span-full sm:col-span-1',
  medium: 'col-span-full sm:col-span-1 lg:col-span-2',
  large:  'col-span-full lg:col-span-3',
  full:   'col-span-full',
};

export const WIDGET_SIZE_LABELS: Record<WidgetSize, string> = {
  small:  'S',
  medium: 'M',
  large:  'L',
  full:   'XL',
};
