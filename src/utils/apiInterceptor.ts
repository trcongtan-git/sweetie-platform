// API Interceptor để xử lý 401 Unauthorized và tự động redirect về login
import { authStorage } from "@/features/auth/utils/storage";

// Global flag để tránh multiple redirects
let isRedirecting = false;

/**
 * Xử lý response từ API và tự động redirect về login nếu gặp 401
 */
export const handleApiResponse = async (
  response: Response,
  url?: string
): Promise<Response> => {
  // Nếu response là 401 Unauthorized
  if (response.status === 401) {
    // Không redirect nếu đang gọi login API (để tránh page reload khi đăng nhập sai)
    if (url && url.includes("/auth/login")) {
      console.warn("Login failed - 401 Unauthorized");
      throw new Error("Thông tin đăng nhập không chính xác");
    }

    console.warn("API returned 401 Unauthorized - redirecting to login");

    // Chỉ redirect một lần để tránh loop
    if (!isRedirecting) {
      isRedirecting = true;

      // Clear auth data
      authStorage.clear();

      // Redirect về login
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    // Throw error để component có thể handle
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }

  return response;
};

/**
 * Wrapper cho fetch với auto-handle 401
 */
export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  try {
    const response = await fetch(url, options);
    return await handleApiResponse(response, url);
  } catch (error) {
    // Re-throw error để component có thể handle
    throw error;
  }
};

/**
 * Reset redirect flag (dùng khi user login thành công)
 */
export const resetRedirectFlag = () => {
  isRedirecting = false;
};
