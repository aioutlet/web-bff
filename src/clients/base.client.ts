import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';
import config from '@config/index';
import logger from '@utils/logger';

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
        logger.debug(`Response from ${this.serviceName}`, {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error) => {
        logger.error(`Response error from ${this.serviceName}`, {
          error: error.message,
          status: error.response?.status,
          url: error.config?.url,
        });
        return Promise.reject(error);
      }
    );
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
}
