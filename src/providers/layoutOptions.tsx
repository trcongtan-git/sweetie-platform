"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

export interface LayoutFooterAction {
  text: string;
  onClick: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  leftButton?: {
    text: string;
    icon?: React.ReactNode;
    onClick: () => void | Promise<void>;
    loading?: boolean;
    disabled?: boolean;
  };
}

export interface LayoutFooterLeftAction {
  text: string;
  onClick: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface LayoutOptions {
  showFooter: boolean;
  setShowFooter: (v: boolean) => void;
  footerAction: LayoutFooterAction | null;
  setFooterAction: (a: LayoutFooterAction | null) => void;
  footerLeftText: string | null;
  setFooterLeftText: (text: string | null) => void;
  footerLeftAction: LayoutFooterLeftAction | null;
  setFooterLeftAction: (a: LayoutFooterLeftAction | null) => void;
  headerCenterContent: React.ReactNode | null;
  setHeaderCenterContent: (content: React.ReactNode | null) => void;
}

const LayoutOptionsContext = createContext<LayoutOptions | undefined>(
  undefined
);

export const LayoutOptionsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [showFooter, setShowFooter] = useState<boolean>(false);
  const [footerAction, setFooterAction] = useState<LayoutFooterAction | null>(
    null
  );
  const [footerLeftText, setFooterLeftText] = useState<string | null>(null);
  const [footerLeftAction, setFooterLeftAction] = useState<LayoutFooterLeftAction | null>(null);
  const [headerCenterContent, setHeaderCenterContent] = useState<React.ReactNode | null>(null);
  const value = useMemo(
    () => ({ showFooter, setShowFooter, footerAction, setFooterAction, footerLeftText, setFooterLeftText, footerLeftAction, setFooterLeftAction, headerCenterContent, setHeaderCenterContent }),
    [showFooter, footerAction, footerLeftText, footerLeftAction, headerCenterContent]
  );
  return (
    <LayoutOptionsContext.Provider value={value}>
      {children}
    </LayoutOptionsContext.Provider>
  );
};

export const useLayoutOptions = (): LayoutOptions => {
  const ctx = useContext(LayoutOptionsContext);
  if (!ctx) {
    throw new Error(
      "useLayoutOptions must be used within LayoutOptionsProvider"
    );
  }
  return ctx;
};
