"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Layout, Menu, Button } from "antd";
import type { MenuProps } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FileTextOutlined,
  HeartOutlined,
  ScissorOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "@/styles/sidebar.css";
import { useLayoutOptions } from "@/providers/layoutOptions";

const { Header, Sider, Content, Footer } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { showFooter, footerAction, footerLeftText, footerLeftAction, headerCenterContent, contentOverflow } = useLayoutOptions();

  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [welcomeTextIndex, setWelcomeTextIndex] = useState<number>(0);
  const [isFading, setIsFading] = useState<boolean>(false);
  const [isInitialFadeIn, setIsInitialFadeIn] = useState<boolean>(true);

  const welcomeTexts = [
    "Embe, no matter how hard today feels, I believe you have the strength to get through it.",
    "Bảo Bối, when you doubt yourself, remember that I see how capable and strong you really are.",
  ];

  const handleCollapsedChange = (newCollapsed: boolean) => {
    setCollapsed(newCollapsed);
    localStorage.setItem("my-baby-sidebar-collapsed", JSON.stringify(newCollapsed));
  };

  useEffect(() => {
    const savedCollapsed = localStorage.getItem("my-baby-sidebar-collapsed");
    if (savedCollapsed) {
      setCollapsed(JSON.parse(savedCollapsed));
    }
  }, []);

  // Auto-collapse sidebar when on euc-report or pdf-cut page
  useEffect(() => {
    if (pathname.startsWith("/euc-report") || pathname.startsWith("/pdf-cut")) {
      setCollapsed(true);
      localStorage.setItem("my-baby-sidebar-collapsed", JSON.stringify(true));
    }
  }, [pathname]);

  useEffect(() => {
    const updateTime = () => {
      const now = dayjs();
      const timeStr = now.format("HH:mm:ss - dddd, D MMMM YYYY");
      setCurrentTime(timeStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Fade in first text on initial load
    const initialFadeIn = setTimeout(() => {
      setIsInitialFadeIn(false);
    }, 100);

    // Show first text immediately, then toggle after 10 seconds
    let intervalId: NodeJS.Timeout | null = null;
    
    const timeout = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => {
        setWelcomeTextIndex(1);
        setIsFading(false);
        
        // Continue with interval
        intervalId = setInterval(() => {
          setIsFading(true);
          setTimeout(() => {
            setWelcomeTextIndex((prev) => (prev === 0 ? 1 : 0));
            setIsFading(false);
          }, 300);
        }, 10000);
      }, 300);
    }, 10000);

    return () => {
      clearTimeout(initialFadeIn);
      clearTimeout(timeout);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  const getMenuItems = (): MenuProps["items"] => {
    const items: MenuProps["items"] = [
      {
        key: "/euc-report",
        icon: <FileTextOutlined />,
        label: "EUC Report",
      },
      {
        key: "/pdf-cut",
        icon: <ScissorOutlined />,
        label: "Cắt PDF",
      },
    ];
    return items;
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key.startsWith("/")) {
      router.push(key);
    }
  };

  const getBreadcrumb = () => {
    if (pathname.startsWith("/euc-report")) {
      return "EUC Report";
    }
    if (pathname.startsWith("/pdf-cut")) {
      return "Cắt PDF";
    }
    return pathname.replace("/", "").split("/")[0] || "EUC Report";
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        width={280}
        trigger={null}
        style={{
          background: "#f9fafb",
        }}
      >
        <div
          style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          <div
            style={{
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              paddingLeft: collapsed ? 0 : 24,
              marginBottom: 24,
              transition: "all 0.2s",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                backgroundColor: "#eb99c2",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: collapsed ? 0 : "12px",
                padding: "4px",
              }}
            >
              <HeartOutlined
                style={{
                  fontSize: "18px",
                  color: "#fff",
                }}
              />
            </div>
            {!collapsed && (
              <div
                style={{
                  color: "#000000",
                  fontSize: "15px",
                  fontWeight: "600",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Sweetie
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflow: "auto" }}>
            <Menu
              mode="inline"
              theme="light"
              items={getMenuItems()}
              selectedKeys={[pathname]}
              onClick={handleMenuClick}
              style={{
                border: "none",
                height: "100%",
              }}
              inlineCollapsed={collapsed}
            />
          </div>

          <div
            style={{
              padding: "12px 24px",
              display: "flex",
              justifyContent: collapsed ? "center" : "flex-start",
              marginTop: "auto",
            }}
          >
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => handleCollapsedChange(!collapsed)}
              style={{
                fontSize: 16,
                color: "rgba(0, 0, 0, 0.65)",
                padding: "4px 8px",
                height: "auto",
                minWidth: "auto",
              }}
            />
          </div>
        </div>
      </Sider>

      <Layout>
        <Header
          style={{
            padding: "0 24px",
            background: "#fff",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            alignItems: "center",
            borderBottom: "1px solid rgb(234, 236, 240)",
            height: "56px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, height: "100%" }}>
            <span style={{ color: "#101828", fontWeight: 600, fontSize: 13, lineHeight: "56px" }}>
              {getBreadcrumb()}
            </span>
          </div>
          {headerCenterContent ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              {headerCenterContent}
            </div>
          ) : (
            <div style={{ height: "100%" }}></div>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
            <span style={{ color: "#475467", fontSize: 13, lineHeight: "56px" }}>
              {currentTime}
            </span>
          </div>
        </Header>

        <Content
          style={{
            padding: "16px 25px",
            background: "#ffffff",
            height: showFooter
              ? "calc(100vh - 56px - 56px)"
              : "calc(100vh - 56px)",
            overflow: contentOverflow,
          }}
        >
          {children}
        </Content>

        {showFooter && (
          <Footer
            style={{
              padding: "0 25px",
              background: "#fff",
              borderTop: "1px solid rgb(234, 236, 240)",
              height: 56,
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {footerLeftText && (
                <span style={{ fontSize: "14px", fontWeight: 500, color: "#1f2937" }}>
                  {footerLeftText}
                </span>
              )}
              {footerLeftAction && (
                <Button
                  icon={footerLeftAction.icon}
                  onClick={footerLeftAction?.onClick}
                  loading={footerLeftAction?.loading || false}
                  disabled={footerLeftAction?.disabled || false}
                >
                  {footerLeftAction?.text}
                </Button>
              )}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 400,
                  color: "#9ca3af",
                  opacity: isInitialFadeIn ? 0 : isFading ? 0 : 1,
                  transition: "opacity 0.5s ease-in-out",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {welcomeTexts[welcomeTextIndex] || welcomeTexts[0]}
              </span>
            </div>
            {footerAction ? (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "flex-end" }}>
                {footerAction.leftButton && (
                  <Button
                    icon={footerAction.leftButton.icon}
                    onClick={footerAction.leftButton.onClick}
                    loading={footerAction.leftButton.loading || false}
                    disabled={footerAction.leftButton.disabled || false}
                  >
                    {footerAction.leftButton.text}
                  </Button>
                )}
                <Button
                  type="primary"
                  onClick={footerAction?.onClick}
                  loading={footerAction?.loading || false}
                  disabled={footerAction?.disabled || false}
                >
                  {footerAction?.text || "Lưu cài đặt"}
                </Button>
              </div>
            ) : (
              <div></div>
            )}
          </Footer>
        )}
      </Layout>
    </Layout>
  );
};

export default MainLayout;
