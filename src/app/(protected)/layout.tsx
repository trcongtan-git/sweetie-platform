"use client";

import React from "react";
import { MainLayout } from "@/components/layouts";


interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return <MainLayout>{children}</MainLayout>;
}

