"use client";

import React from "react";
import { MainLayout } from "@/components/layouts";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"


interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return <MainLayout>{children}</MainLayout>;
}

