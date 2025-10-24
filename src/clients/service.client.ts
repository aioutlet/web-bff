/**
 * Generic Service Client Utility
 * Handles HTTP calls to backend services with proper error handling and logging
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import logger from '../observability/logging/index';

interface ServiceClientOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string | string[]>;
  data?: any;
  timeout?: number;
  retries?: number;
}

/**
 * Make HTTP calls to backend services with error handling and retries
 */
export async function serviceCall<T = any>(options: ServiceClientOptions): Promise<T> {
  const { method, url, headers = {}, data, timeout = 5000, retries = 3 } = options;

  const correlationId = headers['x-correlation-id'] || 'no-correlation';

  const axiosConfig: AxiosRequestConfig = {
    method,
    url,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    timeout,
    data,
  };

  let lastError: Error | null = null;

  // Extract service name from URL for better logging
  const serviceName =
    url.match(/\/\/[^/]+:(\d+)/)?.[0] || url.match(/\/\/([^/]+)/)?.[1] || 'unknown';

  // Retry logic
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.debug(`[${serviceName}] ${method} ${url} (attempt ${attempt}/${retries})`, {
        correlationId,
        service: serviceName,
        method,
        url,
        attempt,
        retries,
      });

      const response: AxiosResponse<T> = await axios(axiosConfig);

      logger.debug(`[${serviceName}] ${method} ${url} - Success (${response.status})`, {
        correlationId,
        service: serviceName,
        method,
        url,
        status: response.status,
        attempt,
      });

      return response.data;
    } catch (error: any) {
      lastError = error;

      const errorType =
        error.code === 'ECONNREFUSED'
          ? 'Connection Refused'
          : error.code === 'ETIMEDOUT'
            ? 'Timeout'
            : error.response?.status
              ? `HTTP ${error.response.status}`
              : error.code || 'Unknown Error';

      logger.warn(
        `[${serviceName}] ${method} ${url} - Failed: ${errorType} (attempt ${attempt}/${retries})`,
        {
          correlationId,
          service: serviceName,
          method,
          url,
          attempt,
          retries,
          errorType,
          errorCode: error.code,
          errorMessage: error.message,
          httpStatus: error.response?.status,
          responseData: error.response?.data,
        }
      );

      // If this is the last attempt, don't wait
      if (attempt === retries) {
        break;
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // All retries exhausted
  const errorType =
    (lastError as any)?.code === 'ECONNREFUSED'
      ? 'Connection Refused - Service may be down'
      : (lastError as any)?.code === 'ETIMEDOUT'
        ? 'Timeout'
        : (lastError as any)?.response?.status
          ? `HTTP ${(lastError as any).response.status}`
          : 'Unknown Error';

  logger.error(`[${serviceName}] ${method} ${url} - All retries exhausted: ${errorType}`, {
    correlationId,
    service: serviceName,
    method,
    url,
    retries,
    errorType,
    errorMessage: lastError?.message,
    httpStatus: (lastError as any)?.response?.status,
  });

  throw lastError || new Error('Service call failed');
}
