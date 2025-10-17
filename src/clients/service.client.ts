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

  // Retry logic
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.debug('Making service call', {
        correlationId,
        method,
        url,
        attempt,
        retries,
      });

      const response: AxiosResponse<T> = await axios(axiosConfig);

      logger.debug('Service call successful', {
        correlationId,
        method,
        url,
        status: response.status,
        attempt,
      });

      return response.data;
    } catch (error: any) {
      lastError = error;

      logger.warn('Service call failed', {
        correlationId,
        method,
        url,
        attempt,
        retries,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

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
  logger.error('Service call failed after all retries', {
    correlationId,
    method,
    url,
    retries,
    error: lastError?.message,
  });

  throw lastError || new Error('Service call failed');
}
