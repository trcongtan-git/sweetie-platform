"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Drawer, Button, Space } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import type { FilterDrawerProps } from "@/types/filter";

/**
 * FilterDrawer - A reusable filter drawer component
 * 
 * Displays filter inputs in a left-side drawer with Reset and Save buttons.
 * Accepts filter field definitions as props from parent screens.
 * 
 * @example
 * ```tsx
 * <FilterDrawer
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   filterFields={[
 *     {
 *       key: "search",
 *       label: "Tìm kiếm",
 *       component: (props) => <Input {...props} />,
 *       defaultValue: "",
 *     },
 *   ]}
 *   onSave={(values) => {
 *     console.log("Applied filters:", values);
 *     // Fetch filtered data
 *   }}
 *   onReset={() => {
 *     console.log("Reset filters");
 *     // Fetch unfiltered data
 *   }}
 * />
 * ```
 * 
 * @param props - FilterDrawer component props
 * @param props.open - Whether the drawer is open
 * @param props.onClose - Callback when drawer closes (via mask click, Escape, or close button)
 * @param props.filterFields - Array of filter field definitions
 * @param props.initialValues - Initial filter values (for when filters are already applied)
 * @param props.onSave - Callback when "Áp dụng" (Apply) button is clicked. Receives current filter values.
 * @param props.onReset - Callback when "Đặt lại" (Reset) button is clicked. Should fetch unfiltered data.
 * @param props.width - Drawer width. Default: 450 (px). Responsive: 100% on mobile (<768px)
 * @param props.loading - Whether data is being fetched (to show loading state on buttons)
 * @param props.title - Drawer title. Default: "Bộ lọc"
 * 
 * @returns FilterDrawer component
 */
const FilterDrawer: React.FC<FilterDrawerProps> = ({
  open,
  onClose,
  filterFields,
  initialValues,
  onSave,
  onReset,
  width = 450,
  loading = false,
  title = "Bộ lọc",
}) => {
  // Internal filter state management
  const [filterState, setFilterState] = useState<Record<string, unknown>>({});

  // Initialize filter state from initialValues or defaults when drawer opens
  useEffect(() => {
    if (open) {
      const initialState: Record<string, unknown> = {};
      filterFields.forEach((field) => {
        initialState[field.key] = 
          initialValues?.[field.key] ?? field.defaultValue;
      });
      setFilterState(initialState);
    }
  }, [open, filterFields, initialValues]);

  // Handle filter value changes
  const handleFilterChange = (fieldKey: string, value: unknown) => {
    setFilterState((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  // Calculate if any filter is dirty (differs from default)
  const isDirty = useMemo(() => {
    return filterFields.some((field) => {
      const currentValue = filterState[field.key];
      const defaultValue = field.defaultValue;
      
      // Deep equality check for complex values
      if (currentValue === defaultValue) return false;
      if (currentValue === null && defaultValue === undefined) return false;
      if (currentValue === undefined && defaultValue === null) return false;
      if (currentValue === "" && defaultValue === undefined) return true; // Empty string is a filter value
      if (Array.isArray(currentValue) && Array.isArray(defaultValue)) {
        if (currentValue.length !== defaultValue.length) return true;
        return currentValue.some((val, idx) => val !== defaultValue[idx]);
      }
      if (typeof currentValue === "object" && typeof defaultValue === "object") {
        return JSON.stringify(currentValue) !== JSON.stringify(defaultValue);
      }
      return true;
    });
  }, [filterState, filterFields]);

  // Handle Save button click with error handling
  const handleSave = async () => {
    try {
      await onSave(filterState);
      onClose();
    } catch (error) {
      // Error handling is done by parent via toast system
      // Keep drawer open on error
      console.error("Filter save error:", error);
    }
  };

  // Handle Reset button click
  const handleReset = () => {
    const resetState: Record<string, unknown> = {};
    filterFields.forEach((field) => {
      resetState[field.key] = field.defaultValue;
    });
    setFilterState(resetState);
    onReset();
    onClose();
  };

  // Handle drawer close (mask click, Escape key) - discard temporary changes
  const handleDrawerClose = () => {
    // Restore to last applied state (initialValues) or defaults
    const restoreState: Record<string, unknown> = {};
    filterFields.forEach((field) => {
      restoreState[field.key] = initialValues?.[field.key] ?? field.defaultValue;
    });
    setFilterState(restoreState);
    onClose();
  };

  // Custom header with title and close button on the right
  const drawerHeader = (
    <div style={{ fontSize: 20, fontWeight: 500, display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
      <span>{title}</span>
      <Button
        type="text"
        icon={<CloseOutlined />}
        onClick={handleDrawerClose}
        style={{ 
          marginLeft: "auto",
          padding: 0,
          width: 22,
          height: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
    </div>
  );

  // Footer with Reset and Save buttons
  const drawerFooter = (
    <div style={{ padding: "16px 12px", minHeight: "64px", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
      <Space>
        <Button onClick={handleReset} disabled={!isDirty} style={{ fontWeight: 600, paddingLeft: "12px", paddingRight: "12px" }}>
          Đặt lại
        </Button>
        <Button type="primary" onClick={handleSave} loading={loading} style={{ fontWeight: 600, paddingLeft: "12px", paddingRight: "12px" }}>
          Áp dụng
        </Button>
      </Space>
    </div>
  );

  // Render filter input components
  const renderFilterFields = () => {
    if (filterFields.length === 0) {
      return <div>No filter fields provided</div>;
    }

    return (
      <Space direction="vertical" size="small" style={{ width: "100%" }}>
        {filterFields.map((field) => {
          const fieldKey = field.key;
          const fieldValue = filterState[fieldKey] ?? field.defaultValue;
          
          // Handle render function pattern
          if (typeof field.component === "function") {
            return (
              <div key={fieldKey}>
                <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 400 }}>
                  {field.label}
                </div>
                {field.component({
                  value: fieldValue,
                  onChange: (value: unknown) => {
                    handleFilterChange(fieldKey, value);
                    // Also call parent's onChange if provided
                    if (field.onChange) {
                      field.onChange(value);
                    }
                  },
                  disabled: loading,
                })}
              </div>
            );
          }

          // Handle controlled React component pattern (with value prop)
          if (field.value !== undefined || field.onChange) {
            // Parent manages state, use parent's value and onChange
            return (
              <div key={fieldKey}>
                <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 400 }}>
                  {field.label}
                </div>
                {field.component}
              </div>
            );
          }

          // Handle uncontrolled React component pattern
          // Clone element and inject value/onChange props
          if (React.isValidElement(field.component)) {
            return (
              <div key={fieldKey}>
                <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 400 }}>
                  {field.label}
                </div>
                {React.cloneElement(field.component as React.ReactElement<any>, {
                  value: fieldValue,
                  onChange: (value: unknown) => {
                    handleFilterChange(fieldKey, value);
                  },
                  disabled: loading,
                })}
              </div>
            );
          }

          // Fallback: render as-is
          return (
            <div key={fieldKey}>
              <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 400 }}>
                {field.label}
              </div>
              {field.component}
            </div>
          );
        })}
      </Space>
    );
  };

  // Responsive width: 400px desktop, 100% mobile
  const responsiveWidth = useMemo(() => {
    if (typeof width === "string" && width.includes("%")) {
      return width;
    }
    // Default: 400px on desktop, will be overridden by CSS media query if needed
    return width;
  }, [width]);

  return (
    <Drawer
      title={drawerHeader}
      placement="left"
      width={responsiveWidth}
      open={open}
      onClose={handleDrawerClose}
      maskClosable={true}
      keyboard={true}
      destroyOnClose={false}
      closable={false}
      footer={drawerFooter}
      aria-label={title}
    >
      <div style={{ paddingTop: 4, paddingBottom: 4 }}>
        {renderFilterFields()}
      </div>
      <style>{`
        @media (max-width: 768px) {
          .ant-drawer-content-wrapper {
            width: 100% !important;
          }
        }
      `}</style>
    </Drawer>
  );
};

export default FilterDrawer;

