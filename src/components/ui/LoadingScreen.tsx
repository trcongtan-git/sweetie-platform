"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface LoadingScreenProps {
  children: React.ReactNode;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ children }) => {
  const pathname = usePathname();

  // Check if it's login page
  const isLoginPage = pathname === "/login";

  // Only show loading screen on initial page load (F5/reload), not on navigation
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Only show loading screen on initial page load (F5/reload)
    if (!isInitialLoad) {
      setIsLoading(false);
      setIsVisible(false);
      return;
    }

    let timer: NodeJS.Timeout;
    let checkDOMReady: (() => void) | null = null;

    const hideLoading = () => {
      setIsVisible(false);
      // Wait for fade out animation to complete
      setTimeout(() => {
        setIsLoading(false);
        setIsInitialLoad(false); // Mark as no longer initial load
      }, 300);
    };

    if (isLoginPage) {
      // For login page: wait for DOM ready, then show content immediately
      if (document.readyState === "complete") {
        timer = setTimeout(hideLoading, 200); // Shorter delay for login
      } else {
        checkDOMReady = () => {
          if (document.readyState === "complete") {
            clearTimeout(timer);
            timer = setTimeout(hideLoading, 200);
          }
        };
        document.addEventListener("readystatechange", checkDOMReady);
        timer = setTimeout(hideLoading, 1000); // Fallback for login
      }
    } else {
      // For other pages: normal loading logic with fade animation
      if (document.readyState === "complete") {
        timer = setTimeout(hideLoading, 500);
      } else {
        checkDOMReady = () => {
          if (document.readyState === "complete") {
            clearTimeout(timer);
            timer = setTimeout(hideLoading, 500);
          }
        };
        document.addEventListener("readystatechange", checkDOMReady);
        timer = setTimeout(hideLoading, 1500);
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (checkDOMReady) {
        document.removeEventListener("readystatechange", checkDOMReady);
      }
    };
  }, [pathname, isInitialLoad]);

  // For login page: skip loading overlay so gradient renders instantly
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    // Full loading screen with logo and spinner for other pages
    return (
      <>
        <style>
          {`
            @keyframes spin {
              0% { transform: translate3d(0, 0, 0) rotate(0deg); }
              100% { transform: translate3d(0, 0, 0) rotate(360deg); }
            }
          `}
        </style>
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "#ffffff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            opacity: isVisible ? 1 : 0,
            transition: "opacity 0.3s ease-out",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
            }}
          >
            {/* Loading Spinner */}
            <div
              style={{
                width: "32px",
                height: "32px",
                border: "3px solid #f3f3f3",
                borderTop: "3px solid #ff6b35",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                willChange: "transform",
                transform: "translate3d(0, 0, 0)",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
            />

            {/* Loading Text */}
            <div
              style={{
                fontSize: "16px",
                color: "#666666",
                fontWeight: 500,
              }}
            >
              Đang tải...
            </div>
          </div>
        </div>
      </>
    );
  }

  return <>{children}</>;
};

export default LoadingScreen;
