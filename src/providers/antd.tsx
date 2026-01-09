"use client";

import React from "react";
import { ConfigProvider, ThemeConfig } from "antd";
import viVN from "antd/locale/vi_VN";

type AntdProviderProps = {
  children: React.ReactNode;
};

const theme: ThemeConfig = {
  token: {
    colorPrimary: "#155eef",
    borderRadius: 8,
    fontFamily: "Inter, sans-serif",
    // Force light theme
    colorBgBase: "#ffffff",
    colorTextBase: "#171717",
    colorBgContainer: "#ffffff",
    colorText: "#171717",
    colorTextSecondary: "#6b7280",
    colorBorder: "#d1d5db",
    colorBorderSecondary: "#e5e7eb",
  },
  components: {
    Button: {
      controlHeight: 32,
    },
    Input: {
      controlHeight: 32,
      colorBgContainer: "#ffffff",
      colorBorder: "#d1d5db",
      colorText: "#171717",
    },
    Form: {
      labelColor: "#111827",
    },
  },
  algorithm: undefined, // Use default light algorithm
};

export const AntdProvider: React.FC<AntdProviderProps> = ({ children }) => {
  return (
    <ConfigProvider theme={theme} locale={viVN}>
      {children}
    </ConfigProvider>
  );
};

export default AntdProvider;
