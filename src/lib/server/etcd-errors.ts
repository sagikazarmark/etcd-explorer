import {
  EtcdAuthenticationFailedError,
  EtcdError,
  EtcdPermissionDeniedError,
} from "etcd3";

export interface EtcdErrorResult {
  code: string;
  message: string;
  isAuthError: boolean;
  isPermissionError: boolean;
  isNotFound: boolean;
}

/**
 * Handle etcd3-specific errors and return a normalized error result
 */
export function handleEtcdError(error: unknown): EtcdErrorResult {
  if (error instanceof EtcdAuthenticationFailedError) {
    return {
      code: "AUTH_FAILED",
      message: "Authentication failed. Please check your credentials.",
      isAuthError: true,
      isPermissionError: false,
      isNotFound: false,
    };
  }

  if (error instanceof EtcdPermissionDeniedError) {
    return {
      code: "PERMISSION_DENIED",
      message: "Permission denied. You do not have access to this resource.",
      isAuthError: false,
      isPermissionError: true,
      isNotFound: false,
    };
  }

  if (error instanceof EtcdError) {
    // Check for specific gRPC status codes
    const message = error.message || "Unknown etcd error";

    // Key not found
    if (
      message.includes("key not found") ||
      message.includes("etcdserver: key not found")
    ) {
      return {
        code: "NOT_FOUND",
        message: "The requested key was not found.",
        isAuthError: false,
        isPermissionError: false,
        isNotFound: true,
      };
    }

    // User/role not found
    if (
      message.includes("user name not found") ||
      message.includes("role name not found")
    ) {
      return {
        code: "NOT_FOUND",
        message: message,
        isAuthError: false,
        isPermissionError: false,
        isNotFound: true,
      };
    }

    // Auth not enabled
    if (message.includes("authentication is not enabled")) {
      return {
        code: "AUTH_NOT_ENABLED",
        message: "Authentication is not enabled on this etcd cluster.",
        isAuthError: false,
        isPermissionError: false,
        isNotFound: false,
      };
    }

    return {
      code: "ETCD_ERROR",
      message: message,
      isAuthError: false,
      isPermissionError: false,
      isNotFound: false,
    };
  }

  if (error instanceof Error) {
    return {
      code: "UNKNOWN_ERROR",
      message: error.message,
      isAuthError: false,
      isPermissionError: false,
      isNotFound: false,
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    message: "An unknown error occurred.",
    isAuthError: false,
    isPermissionError: false,
    isNotFound: false,
  };
}

/**
 * Wrapper function to execute etcd operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  defaultValue?: T,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const errorResult = handleEtcdError(error);

    // For not found errors with a default value, return the default
    if (errorResult.isNotFound && defaultValue !== undefined) {
      return defaultValue;
    }

    // Re-throw with a more descriptive message
    throw new Error(`[${errorResult.code}] ${errorResult.message}`);
  }
}
