/**
 * TypeScript Types for Filter Drawer Base Component
 * 
 * These interfaces define the contract between FilterDrawer component
 * and parent screens that use it.
 */

import type { ReactNode } from "react";
import type { Rule } from "antd/es/form";

/**
 * Props for filter field component render function
 */
export interface FilterFieldComponentProps {
  value?: unknown;
  onChange?: (value: unknown) => void;
  disabled?: boolean;
}

/**
 * Definition of a single filter field
 * 
 * Each filter field represents one filter input in the FilterDrawer.
 * 
 * @interface FilterField
 */
export interface FilterField {
  /** Unique identifier for the filter field (e.g., "search", "role", "status") */
  key: string;
  
  /** Display label for the filter field (e.g., "Tìm kiếm", "Vai trò") */
  label: string;
  
  /** 
   * The input component to render.
   * Can be a React component (ReactNode) or a render function that receives FilterFieldComponentProps.
   * 
   * @example
   * // React component pattern:
   * component: <Input placeholder="Search..." />
   * 
   * // Render function pattern:
   * component: (props) => <Input {...props} placeholder="Search..." />
   */
  component: ReactNode | ((props: FilterFieldComponentProps) => ReactNode);
  
  /** Default/empty value for the filter field (e.g., "", undefined, null, []) */
  defaultValue: unknown;
  
  /** 
   * Current value (for controlled components).
   * If not provided, FilterDrawer manages its own state.
   * If provided, parent screen manages the state.
   */
  value?: unknown;
  
  /** 
   * Change handler for the filter field.
   * Called when value changes. Used for controlled components.
   */
  onChange?: (value: unknown) => void;
  
  /** 
   * Ant Design Form validation rules.
   * Used if component is wrapped in Form.Item (future enhancement).
   */
  validationRules?: Rule[];
}

/**
 * Props for FilterDrawer component
 * 
 * @interface FilterDrawerProps
 */
export interface FilterDrawerProps {
  /** Whether the drawer is open */
  open: boolean;
  
  /** 
   * Callback when drawer closes (via mask click, Escape, or close button).
   * Temporary changes are discarded when closing without saving.
   */
  onClose: () => void;
  
  /** Array of filter field definitions */
  filterFields: FilterField[];
  
  /** 
   * Initial filter values (for when filters are already applied).
   * Keys must match FilterField keys.
   * Used to initialize filter state when drawer opens.
   */
  initialValues?: Record<string, unknown>;
  
  /** 
   * Callback when "Áp dụng" (Apply) button is clicked.
   * Receives current filter values as a Record<string, unknown>.
   * Should fetch filtered data based on the provided values.
   * 
   * @param values - Current filter values, keyed by FilterField.key
   */
  onSave: (values: Record<string, unknown>) => void | Promise<void>;
  
  /** 
   * Callback when "Đặt lại" (Reset) button is clicked.
   * Should fetch unfiltered data (clear all filters).
   */
  onReset: () => void;
  
  /** 
   * Drawer width. Default: 450 (px).
   * Responsive: Automatically becomes 100% width on mobile devices (<768px).
   */
  width?: number | string;
  
  /** 
   * Whether data is being fetched (to show loading state on buttons).
   * When true, buttons are disabled and "Áp dụng" button shows loading spinner.
   */
  loading?: boolean;
  
  /** Drawer title. Default: "Bộ lọc" */
  title?: string;
}

/**
 * Internal filter state (managed by FilterDrawer)
 * 
 * This interface represents the internal state structure used by FilterDrawer.
 * It's not directly exposed to parent components, but is used internally
 * to track filter values and dirty state.
 * 
 * @interface FilterState
 * @internal
 */
export interface FilterState {
  /** Key-value pairs of filter field values */
  fields: Record<string, unknown>;
  
  /** Whether any field value differs from its default value */
  isDirty: boolean;
}

