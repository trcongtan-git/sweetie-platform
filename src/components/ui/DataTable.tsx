"use client";

import React, { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  type ColumnSort,
} from "@tanstack/react-table";
import { Button, Space, Spin, Pagination, Select, Empty } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import type { ReactNode } from "react";

export interface TableAction<TData> {
  key: string;
  label: string;
  icon?: ReactNode;
  type?: "text" | "link" | "default" | "primary" | "dashed";
  danger?: boolean;
  onClick: (row: TData) => void;
  disabled?: (row: TData) => boolean;
  loading?: (row: TData) => boolean;
}

/**
 * Pagination configuration for DataTable component.
 * All props are optional to maintain backward compatibility.
 */
export interface PaginationConfig {
  /** Current page number (1-indexed) */
  current: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of items across all pages */
  total: number;
  /** Callback when page changes */
  onChange?: (page: number, pageSize: number) => void;
  /** Callback when page size changes */
  onPageSizeChange?: (page: number, pageSize: number) => void;
  /** Available page size options (default: [50, 100, 200, 500]) */
  pageSizeOptions?: number[];
  /** Pagination style variant: "default" (Select + Pagination), "compact" (Pagination with showSizeChanger), or custom CSS class */
  paginationStyle?: "default" | "compact" | string;
  /** Show total items display - boolean or custom render function */
  showTotal?: boolean | ((total: number, range: [number, number]) => ReactNode);
  /** Show page size changer in Pagination component (for compact style) */
  showSizeChanger?: boolean;
}

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  rowKey?: (row: TData, index: number) => React.Key;
  height?: number | string;
  rowHeight?: number;
  className?: string;
  style?: React.CSSProperties;
  bordered?: boolean;
  rowClassName?: (row: TData, index: number) => string;
  sttColumnWidth?: number;
  actions?: TableAction<TData>[];
  actionsColumnWidth?: number;
  loading?: boolean;
  /** Optional pagination configuration */
  pagination?: PaginationConfig;
  /** Optional initial sorting state */
  initialState?: {
    sorting?: ColumnSort[];
  };
}

export default function DataTable<TData>({
  columns,
  data,
  rowKey,
  height = "100%",
  // rowHeight = 40, // Reserved for future use
  className,
  style,
  bordered = true,
  rowClassName,
  sttColumnWidth = 64,
  actions = [],
  actionsColumnWidth = 60,
  loading = false,
  pagination,
  initialState,
}: DataTableProps<TData>) {
  // Create columns with actions if provided
  const tableColumns = useMemo(() => {
    if (!actions || actions.length === 0) {
      return columns;
    }

    const actionsColumn: ColumnDef<TData, unknown> = {
      id: "actions",
      header: "",
      size: actionsColumnWidth,
      minSize: actionsColumnWidth,
      maxSize: actionsColumnWidth,
      enableResizing: false,
      meta: {
        width: actionsColumnWidth,
        minWidth: actionsColumnWidth,
        align: "center",
      },
      cell: ({ row }) => (
        <Space size="small">
          {actions.map((action) => {
            const isDisabled = action.disabled ? action.disabled(row.original) : false;
            const isLoading = action.loading ? action.loading(row.original) : false;
            return (
              <Button
                key={action.key}
                type={action.key === "edit" ? "text" : (action.type || "text")}
                icon={action.icon}
                danger={action.danger}
                onClick={() => action.onClick(row.original)}
                title={action.label}
                className={
                  action.key === "edit"
                    ? "edit-button-custom"
                    : action.key === "reset-password"
                    ? "reset-password-button-custom"
                    : ""
                }
                disabled={isDisabled || isLoading}
                loading={isLoading}
              />
            );
          })}
        </Space>
      ),
    };

    return [...columns, actionsColumn];
  }, [columns, actions, actionsColumnWidth]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableColumnPinning: true,
    getRowId: rowKey 
      ? (row, index) => String(rowKey(row, index))
      : (row, index) => String(index),
    initialState: {
      ...(initialState || {}),
      ...(actions && actions.length > 0 ? { columnPinning: { right: ['actions'] } } : {}),
    },
  });

  const containerBorder = bordered ? "1px solid #eaecf0" : "transparent";

  // Pagination validation and normalization
  const paginationConfig = useMemo(() => {
    if (!pagination) return null;

    const { current, pageSize, total } = pagination;
    
    // Validate and normalize pagination values
    const maxPageSize = 1000; // Maximum page size limit
    const validPageSize = Math.max(1, Math.min(pageSize, maxPageSize));
    const maxPage = Math.ceil(total / validPageSize) || 1;
    const validCurrent = Math.max(1, Math.min(current, maxPage));
    
    // Default showTotal format: "Hiển thị X - Y / Z"
    const defaultShowTotal = (total: number, range: [number, number]) =>
      `Hiển thị ${range[0]} - ${range[1]} / ${total}`;
    
    return {
      ...pagination,
      current: validCurrent,
      pageSize: validPageSize,
      total: Math.max(0, total),
      pageSizeOptions: pagination.pageSizeOptions || [50, 100, 200, 500],
      paginationStyle: pagination.paginationStyle || "default",
      showTotal: pagination.showTotal !== undefined 
        ? pagination.showTotal 
        : defaultShowTotal,
    };
  }, [pagination]);

  // Handle pagination page change
  const handlePageChange = (page: number) => {
    if (paginationConfig?.onChange) {
      paginationConfig.onChange(page, paginationConfig.pageSize);
    }
  };

  // Handle pagination page size change (for compact style)
  const handlePageSizeChange = (page: number, size: number) => {
    if (paginationConfig?.onChange) {
      paginationConfig.onChange(page, size);
    }
  };

  // Handle page size change via Select (for default style)
  const handleSelectPageSizeChange = (size: number) => {
    if (paginationConfig?.onPageSizeChange) {
      paginationConfig.onPageSizeChange(1, size);
    } else if (paginationConfig?.onChange) {
      paginationConfig.onChange(1, size);
    }
  };

  return (
    <div
      className={`kf-table-fullheight ${className || ''}`}
      style={{
        height,
        display: "flex",
        flexDirection: "column",
        border: containerBorder,
        borderRadius: "8px",
        overflow: "hidden",
        background: "#fff",
        width: "100%",
        ...style,
      }}
    >
      <style>{`
        .data-table-scroll-container {
          overflow-x: auto !important;
          overflow-y: auto !important;
          position: relative;
          width: 100%;
          box-sizing: border-box;
          /* Ensure sticky positioning works correctly */
          isolation: isolate;
        }
        
        .tanstack-table {
          border-collapse: separate;
          border-spacing: 0;
          table-layout: auto;
          width: max-content;
          min-width: 100%;
        }
        
        
        .tanstack-table th,
        .tanstack-table td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid #eaecf0;
          white-space: nowrap;
          height: 40px !important;
          line-height: 24px;
          vertical-align: middle;
          font-family: "Inter", sans-serif !important;
          overflow: hidden;
          text-overflow: ellipsis;
          direction: ltr;
        }
        
        .tanstack-table td textarea {
          direction: ltr !important;
          text-align: left !important;
          unicode-bidi: normal !important;
        }
        
        /* Override overflow for pinned columns to ensure they're fully visible */
        .tanstack-table th[data-pinned="right"],
        .tanstack-table td[data-pinned="right"],
        .tanstack-table th[data-column-id="actions"],
        .tanstack-table td[data-column-id="actions"] {
          overflow: visible !important;
        }
        
        /* TanStack Table pinned columns - using data-pinned attribute from TanStack Table */
        /* Critical: sticky positioning must be relative to scroll container, not table */
        .data-table-scroll-container .tanstack-table th[data-pinned="right"],
        .data-table-scroll-container .tanstack-table td[data-pinned="right"],
        .data-table-scroll-container .tanstack-table th[data-column-id="actions"],
        .data-table-scroll-container .tanstack-table td[data-column-id="actions"] {
          position: sticky !important;
          right: 0 !important;
          z-index: 10 !important;
          background: #fff !important;
          border-left: 1px solid #eaecf0 !important;
          box-shadow: none !important;
          box-sizing: border-box !important;
          /* Ensure pinned column stays within viewport - no margin that could push it out */
          margin-right: 0 !important;
          padding-right: 12px !important;
          /* Force hardware acceleration for better sticky performance */
          will-change: transform;
          /* Ensure sticky positioning is calculated relative to scroll container */
          transform: translateZ(0);
        }
        
        .data-table-scroll-container .tanstack-table th[data-pinned="right"],
        .data-table-scroll-container .tanstack-table th[data-column-id="actions"] {
          z-index: 25 !important;
          background: #f9fafb !important;
        }
        
        .data-table-scroll-container .tanstack-table tr:hover td[data-pinned="right"],
        .data-table-scroll-container .tanstack-table tr:hover td[data-column-id="actions"] {
          background: #f5f5f5 !important;
        }
        
        
        
        .tanstack-table td {
          padding: 2px 12px !important;
          height: 40px !important;
          line-height: 36px !important;
          vertical-align: middle !important;
          font-family: "Inter", sans-serif !important;
        }
        
        /* Remove margin/padding from Badge in table cells */
        .tanstack-table td .ant-badge {
          margin: 0 !important;
          padding: 0 !important;
        }
        
        .tanstack-table td .ant-badge-status {
          margin: 0 !important;
          padding: 0 !important;
        }
        
        .tanstack-table td .ant-badge-status-text {
          margin-left: 0 !important;
          padding-left: 0 !important;
        }
        
        .tanstack-table th {
          background: #f9fafb;
          font-weight: 500;
          font-size: 13px;
          color: #475467;
          font-family: "Inter", sans-serif !important;
          vertical-align: middle;
          white-space: normal;
          word-wrap: break-word;
          line-height: 1.4;
        }
        
        /* Freeze header - sticky header */
        .tanstack-table-header-sticky {
          position: sticky;
          top: 0;
          z-index: 20;
        }
        
        .tanstack-table-header-sticky th {
          position: sticky;
          top: 0;
          z-index: 20;
          background: #f9fafb;
        }
        
        /* Ensure sticky header works with pinned columns - removed duplicate, handled above */
        
        .tanstack-table tbody tr {
          height: 40px !important;
          max-height: 40px !important;
        }
        
        .tanstack-table tbody tr td {
          height: 40px !important;
          max-height: 40px !important;
          line-height: 36px !important;
          vertical-align: middle !important;
          padding: 2px 12px !important;
          font-family: "Inter", sans-serif !important;
        }
        
        /* Force data row height */
        .kf-table-fullheight .tanstack-table tbody tr {
          height: 40px !important;
          max-height: 40px !important;
        }
        
        .kf-table-fullheight .tanstack-table tbody tr td {
          height: 40px !important;
          max-height: 40px !important;
          line-height: 36px !important;
          vertical-align: middle !important;
          padding: 2px 12px !important;
          font-family: "Inter", sans-serif !important;
        }
        
        /* Force all data rows to 40px */
        .kf-table-fullheight .tanstack-table tbody tr,
        .kf-table-fullheight .tanstack-table tbody tr td {
          height: 40px !important;
          max-height: 40px !important;
          min-height: 40px !important;
          font-family: "Inter", sans-serif !important;
        }
        
        /* Force all data rows to 40px with higher specificity */
        .kf-table-fullheight .tanstack-table tbody tr {
          height: 40px !important;
          max-height: 40px !important;
          min-height: 40px !important;
          font-family: "Inter", sans-serif !important;
        }
        
        .kf-table-fullheight .tanstack-table tbody tr td {
          height: 40px !important;
          max-height: 40px !important;
          min-height: 40px !important;
          font-family: "Inter", sans-serif !important;
        }
        
        /* Force all data rows to 40px with even higher specificity */
        .kf-table-fullheight .tanstack-table tbody tr {
          height: 40px !important;
          max-height: 40px !important;
          min-height: 40px !important;
          font-family: "Inter", sans-serif !important;
        }
        
        .kf-table-fullheight .tanstack-table tbody tr td {
          height: 40px !important;
          max-height: 40px !important;
          min-height: 40px !important;
          font-family: "Inter", sans-serif !important;
        }
        
        /* Force all data rows to 40px with maximum specificity */
        .kf-table-fullheight .tanstack-table tbody tr {
          height: 40px !important;
          max-height: 40px !important;
          min-height: 40px !important;
        }
        
        .kf-table-fullheight .tanstack-table tbody tr td {
          height: 40px !important;
          max-height: 40px !important;
          min-height: 40px !important;
        }
        
        .tanstack-table tbody tr:hover {
          background: #f9fafb;
        }
        
        
        /* Edit button custom styling - applied when action key is "edit" */
        .edit-button-custom {
          border: none !important;
          color: #155eef !important;
          background: transparent !important;
          box-shadow: none !important;
          min-width: 32px !important;
          width: 32px !important;
          height: 32px !important;
          padding: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .edit-button-custom:hover {
          color: #0f4fd1 !important;
          background: rgba(21, 94, 239, 0.04) !important;
        }
        .edit-button-custom:focus {
          color: #155eef !important;
          background: transparent !important;
          box-shadow: 0 0 0 2px rgba(21, 94, 239, 0.2) !important;
        }
        
        /* Reset password button custom styling - same as edit but with black icon */
        .reset-password-button-custom {
          border: none !important;
          color: #262626 !important;
          background: transparent !important;
          box-shadow: none !important;
          min-width: 32px !important;
          width: 32px !important;
          height: 32px !important;
          padding: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .reset-password-button-custom:hover {
          color: #000000 !important;
          background: rgba(38, 38, 38, 0.04) !important;
        }
        .reset-password-button-custom:focus {
          color: #262626 !important;
          background: transparent !important;
          box-shadow: 0 0 0 2px rgba(38, 38, 38, 0.2) !important;
        }
        
        /* STT column styling */
        .tanstack-table th[data-column-id="_stt"],
        .tanstack-table td[data-column-id="_stt"] {
          width: ${sttColumnWidth}px !important;
          min-width: ${sttColumnWidth}px !important;
          max-width: ${sttColumnWidth}px !important;
          text-align: center !important;
        }
        
        /* Custom scrollbar styling - very thin scrollbar */
        .data-table-scroll-container::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        
        .data-table-scroll-container::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .data-table-scroll-container::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 2px;
        }
        
        .data-table-scroll-container::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        
        /* Firefox scrollbar */
        .data-table-scroll-container {
          scrollbar-width: thin;
          scrollbar-color: #d1d5db transparent;
        }
        
        /* Pagination button styles */
        .data-table-pagination .ant-pagination-item {
          border: 1px solid #d9d9d9 !important;
          border-radius: 6px !important;
        }
        .data-table-pagination .ant-pagination-item:hover {
          border-color: #155eef !important;
          outline: none !important;
          box-shadow: none !important;
        }
        .data-table-pagination .ant-pagination-item:focus {
          outline: none !important;
          box-shadow: none !important;
        }
        .data-table-pagination .ant-pagination-item.ant-pagination-item-active {
          border-color: #155eef !important;
          background-color: transparent !important;
          color: #155eef !important;
        }
        .data-table-pagination .ant-pagination-prev,
        .data-table-pagination .ant-pagination-next {
          border: 1px solid #d9d9d9 !important;
          border-radius: 6px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .data-table-pagination .ant-pagination-prev:hover,
        .data-table-pagination .ant-pagination-next:hover {
          border-color: #155eef !important;
          outline: none !important;
          box-shadow: none !important;
        }
        .data-table-pagination .ant-pagination-prev:focus,
        .data-table-pagination .ant-pagination-next:focus {
          outline: none !important;
          box-shadow: none !important;
        }
        /* Hide tooltip on pagination buttons */
        .data-table-pagination .ant-pagination-item {
          title: none !important;
        }
        .data-table-pagination .ant-pagination-prev,
        .data-table-pagination .ant-pagination-next {
          title: none !important;
        }
        .data-table-pagination .ant-pagination-item[title] {
          title: "" !important;
        }
        .data-table-pagination .ant-pagination-prev[title],
        .data-table-pagination .ant-pagination-next[title] {
          title: "" !important;
        }
      `}</style>
      
      <div
        className="data-table-scroll-container"
        style={{
          flex: 1,
          overflow: "auto",
          overflowX: "auto",
          overflowY: "auto",
          minWidth: 0, // Allow flex item to shrink below content size
          position: "relative",
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        {loading && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              zIndex: 100,
            }}
          >
            <Spin size="large" />
          </div>
        )}
        <table className="tanstack-table" style={{ opacity: loading ? 0.5 : 1 }}>
          <thead className="tanstack-table-header-sticky">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isPinned = header.column.getIsPinned();
                  const isPinnedRight = isPinned === 'right' || header.id === 'actions';
                  const align = (header.column.columnDef.meta as any)?.align || 'left';
                  return (
                    <th
                      key={header.id}
                      data-column-id={header.id}
                      data-pinned={isPinnedRight ? 'right' : undefined}
                      style={{
                        width: header.getSize(),
                        minWidth: header.getSize(),
                        maxWidth: header.getSize(),
                        cursor: header.column.getCanSort() ? 'pointer' : 'default',
                        userSelect: 'none',
                        textAlign: align,
                        // Sticky positioning handled by CSS via data-pinned attribute
                      }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {header.isPlaceholder ? null : (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          flexWrap: 'wrap',
                          gap: '4px',
                          justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
                          whiteSpace: 'normal',
                          wordWrap: 'break-word',
                          lineHeight: '1.4',
                          width: '100%',
                        }}>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && header.column.id === 'openingDate' && (
                            <span style={{ fontSize: '10px', color: '#666' }}>
                              {{
                                asc: ' ↑',
                                desc: ' ↓',
                              }[header.column.getIsSorted() as string] ?? ' ↕'}
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {!loading && data.length === 0 ? (
              <tr>
                <td
                  colSpan={table.getHeaderGroups()[0]?.headers.length || tableColumns.length}
                  style={{
                    textAlign: "center",
                    padding: "60px 20px",
                    borderBottom: "none",
                  }}
                >
                  <Empty
                    description="No data"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, rowIndex) => (
                <tr
                  key={rowKey ? rowKey(row.original, rowIndex) : row.id}
                  className={rowClassName ? rowClassName(row.original, rowIndex) : ""}
                  style={{
                    height: '40px',
                    maxHeight: '40px',
                  }}
                >
                  {row.getVisibleCells().map((cell) => {
                    const isPinned = cell.column.getIsPinned();
                    const isPinnedRight = isPinned === 'right' || cell.column.id === 'actions';
                    // Create a custom context with rowIndex for STT column
                    const cellContext = cell.getContext();
                    const customContext = {
                      ...cellContext,
                      rowIndex: rowIndex, // Add rowIndex to context
                    };
                    return (
                      <td
                        key={cell.id}
                        data-column-id={cell.column.id}
                        data-pinned={isPinnedRight ? 'right' : undefined}
                        style={{
                          width: cell.column.getSize(),
                          minWidth: cell.column.getSize(),
                          maxWidth: cell.column.getSize(),
                          height: '40px',
                          lineHeight: '36px',
                          verticalAlign: 'middle',
                          padding: '2px 12px',
                          textAlign: (cell.column.columnDef.meta as any)?.align || 'left',
                          // Sticky positioning handled by CSS via data-pinned attribute
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, customContext)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {paginationConfig && (
        <div
          className={`data-table-pagination ${paginationConfig.paginationStyle !== "default" && paginationConfig.paginationStyle !== "compact" ? paginationConfig.paginationStyle : ""}`}
          style={{
            padding: "16px",
            borderTop: "1px solid #f0f0f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#fff",
          }}
        >
          {paginationConfig.paginationStyle === "default" ? (
            <>
              <Space size="middle">
                <Select
                  size="middle"
                  value={paginationConfig.pageSize}
                  style={{ width: 120, height: 32 }}
                  onChange={handleSelectPageSizeChange}
                  options={paginationConfig.pageSizeOptions.map((size) => ({
                    label: String(size),
                    value: size,
                  }))}
                />
                <div style={{ color: "#666" }}>
                  {paginationConfig.showTotal !== false && (
                    typeof paginationConfig.showTotal === "function" ? (
                      paginationConfig.showTotal(
                        paginationConfig.total,
                        [
                          (paginationConfig.current - 1) * paginationConfig.pageSize + 1,
                          Math.min(paginationConfig.current * paginationConfig.pageSize, paginationConfig.total),
                        ]
                      )
                    ) : (
                      paginationConfig.showTotal === true ? (
                        `Hiển thị ${(paginationConfig.current - 1) * paginationConfig.pageSize + 1} - ${Math.min(paginationConfig.current * paginationConfig.pageSize, paginationConfig.total)} / ${paginationConfig.total}`
                      ) : null
                    )
                  )}
                </div>
              </Space>
              <Pagination
                current={paginationConfig.current}
                pageSize={paginationConfig.pageSize}
                total={paginationConfig.total}
                showSizeChanger={false}
                onChange={handlePageChange}
                itemRender={(page, type, originalElement) => {
                  if (type === 'prev') {
                    return <span title=""><LeftOutlined /></span>;
                  }
                  if (type === 'next') {
                    return <span title=""><RightOutlined /></span>;
                  }
                  if (type === 'page') {
                    return <span title="">{originalElement}</span>;
                  }
                  return originalElement;
                }}
              />
            </>
          ) : (
              <Pagination
                current={paginationConfig.current}
                pageSize={paginationConfig.pageSize}
                total={paginationConfig.total}
                showSizeChanger={paginationConfig.showSizeChanger ?? true}
                pageSizeOptions={paginationConfig.pageSizeOptions.map((size) => String(size))}
                showTotal={
                  typeof paginationConfig.showTotal === "function"
                    ? paginationConfig.showTotal
                    : undefined
                }
                onChange={handlePageSizeChange}
                onShowSizeChange={handlePageSizeChange}
                itemRender={(page, type, originalElement) => {
                  if (type === 'prev') {
                    return <span title=""><LeftOutlined /></span>;
                  }
                  if (type === 'next') {
                    return <span title=""><RightOutlined /></span>;
                  }
                  if (type === 'page') {
                    return <span title="">{originalElement}</span>;
                  }
                  return originalElement;
                }}
              />
          )}
        </div>
      )}
    </div>
  );
}