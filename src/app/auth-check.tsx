"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export function AuthCheck() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip auth check for static files
    if (
      pathname?.startsWith("/_next") ||
      pathname?.startsWith("/api") ||
      pathname?.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$/)
    ) {
      return;
    }

    // Check if credentials are stored
    const storedAuth = sessionStorage.getItem("basic-auth");
    
    if (!storedAuth) {
      // Prompt for basic auth
      const username = prompt("Username:");
      const password = prompt("Password:");
      
      if (username === "vieira" && password === "020802") {
        sessionStorage.setItem("basic-auth", "authenticated");
        window.location.reload();
      } else {
        alert("Invalid credentials");
        window.location.href = "/";
      }
    }
  }, [pathname]);

  return null;
}
