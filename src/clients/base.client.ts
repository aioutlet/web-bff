import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';
import config from '@config/index';
import logger from '@observability';

export class BaseClient {
  protected client: AxiosInstance;
  protected serviceName: string;

  constructor(baseURL: string, serviceName: string) {
    this.serviceName = serviceName;

    this.client = axios.create({
      baseURL,
      timeout: config.serviceConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Configure retry logic
    axiosRetry(this.client, {
      retries: config.serviceConfig.retryCount,
      retryDelay: (retryCount) => {
        return retryCount * config.serviceConfig.retryDelay;
      },
      retryCondition: (error) => {
        // Retry on network errors or 5xx status codes
        return (
          axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          (error.response?.status ? error.response.status >= 500 : false)
        );
      },
      onRetry: (retryCount, error, requestConfig) => {
        logger.warn(`Retrying request to ${this.serviceName}`, {
          retryCount,
          url: requestConfig.url,
          error: error.message,
        });
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`Request to ${this.serviceName}`, {
          method: config.method,
          url: config.url,
          correlationId: config.headers?.['x-correlation-id'],
        });
        return config;
      },
      (error) => {
        logger.error(`Request error to ${this.serviceName}`, {
          error: error.message,
        });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Extract correlation ID from response headers or request headers
        const correlationId =
          response.headers['x-correlation-id'] || response.config.headers?.['x-correlation-id'];

        logger.debug(`Response from ${this.serviceName}`, {
          status: response.status,
          url: response.config.url,
          correlationId,
        });
        return response;
      },
      (error) => {
        // Extract correlation ID from error response or request
        const correlationId =
          error.response?.headers?.['x-correlation-id'] ||
          error.config?.headers?.['x-correlation-id'];

        logger.error(`Response error from ${this.serviceName}`, {
          error: error.message,
          status: error.response?.status,
          url: error.config?.url,
          correlationId,
        });
        return Promise.reject(error);
      }
    );
  }

  // Helper method to add correlation ID to request config
  protected withCorrelationId(
    correlationId?: string,
    config?: AxiosRequestConfig
  ): AxiosRequestConfig {
    if (!correlationId) {
      return config || {};
    }

    const mergedConfig = {
      ...config,
      headers: {
        ...config?.headers,
        'x-correlation-id': correlationId,
      },
    };

    logger.debug(`Adding correlation ID to ${this.serviceName} request`, {
      correlationId,
      headers: mergedConfig.headers,
    });

    return mergedConfig;
  }

  protected async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  protected async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  protected async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  protected async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  protected async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }
}
