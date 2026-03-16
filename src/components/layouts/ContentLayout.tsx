"use client";

import React from "react";

export interface ContentLayoutProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  left?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  children: React.ReactNode;
  headerHidden?: boolean;
  stickyHeader?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

// Standardized content layout
// - No outer padding to avoid double padding (Content provides it)
// - Header with optional left (custom), or title/description
// - Space for actions on the right
// - No divider line between header and content
const ContentLayout: React.FC<ContentLayoutProps> = ({
  title,
  description,
  actions,
  left,
  children,
  breadcrumb,
  headerHidden = false,
  stickyHeader = false,
  style,
  className,
}) => {
  const showHeader = !headerHidden && (left || title || actions || description);
  return (
    <div
      className={className}
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {showHeader && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 56,
            marginBottom: 12,
            ...(stickyHeader && {
              position: "sticky",
              top: 0,
              zIndex: 100,
              backgroundColor: "#ffffff",
              background: "#ffffff",
              paddingTop: 8,
              paddingBottom: 12,
              marginBottom: 0,
              borderBottom: "1px solid #e5e7eb",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }),
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              ...(stickyHeader && { backgroundColor: "#ffffff" }),
            }}
          >
            {breadcrumb && (
              <div style={{ marginBottom: 6, fontSize: 12, color: "#667085" }}>
                {breadcrumb}
              </div>
            )}
            {left ? (
              <div style={{ display: "flex", alignItems: "center" }}>
                {left}
              </div>
            ) : (
              <>
                {title && (
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: "#101828",
                      lineHeight: "24px",
                    }}
                  >
                    {title}
                  </div>
                )}
                {description && (
                  <div style={{ marginTop: 4, fontSize: 13, color: "#667085" }}>
                    {description}
                  </div>
                )}
              </>
            )}
          </div>
          {actions && (
            <div
              style={{
                display: "flex",
                gap: 8,
                ...(stickyHeader && { backgroundColor: "#ffffff" }),
              }}
            >
              {actions}
            </div>
          )}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
};

export default ContentLayout;