import { HttpMethod } from '@dapr/dapr';
import { daprClient } from '@services/dapr.client';
import logger from '../core/logger';

export class DaprBaseClient {
  protected serviceName: string;
  protected appId: string;

  constructor(appId: string, serviceName: string) {
    this.appId = appId;
    this.serviceName = serviceName;
  }

  /**
   * GET request via Dapr
   */
  protected async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    try {
      logger.debug(`GET request to ${this.serviceName}`, {
        url,
        correlationId: headers?.['x-correlation-id'],
      });

      const response = await daprClient.invokeService<T>(this.appId, url, HttpMethod.GET, null, {
        headers,
      });

      logger.debug(`Response from ${this.serviceName}`, {
        url,
        correlationId: headers?.['x-correlation-id'],
      });

      return response;
    } catch (error: any) {
      logger.error(`GET request error to ${this.serviceName}`, {
        url,
        error: error.message,
        correlationId: headers?.['x-correlation-id'],
      });
      throw error;
    }
  }

  /**
   * POST request via Dapr
   */
  protected async post<T>(url: string, data?: any, headers?: Record<string, string>): Promise<T> {
    try {
      logger.debug(`POST request to ${this.serviceName}`, {
        url,
        correlationId: headers?.['x-correlation-id'],
      });

      const response = await daprClient.invokeService<T>(this.appId, url, HttpMethod.POST, data, {
        headers,
      });

      logger.debug(`Response from ${this.serviceName}`, {
        url,
        correlationId: headers?.['x-correlation-id'],
      });

      return response;
    } catch (error: any) {
      logger.error(`POST request error to ${this.serviceName}`, {
        url,
        error: error.message,
        correlationId: headers?.['x-correlation-id'],
      });
      throw error;
    }
  }

  /**
   * PUT request via Dapr
   */
  protected async put<T>(url: string, data?: any, headers?: Record<string, string>): Promise<T> {
    try {
      logger.debug(`PUT request to ${this.serviceName}`, {
        url,
        correlationId: headers?.['x-correlation-id'],
      });

      const response = await daprClient.invokeService<T>(this.appId, url, HttpMethod.PUT, data, {
        headers,
      });

      logger.debug(`Response from ${this.serviceName}`, {
        url,
        correlationId: headers?.['x-correlation-id'],
      });

      return response;
    } catch (error: any) {
      logger.error(`PUT request error to ${this.serviceName}`, {
        url,
        error: error.message,
        correlationId: headers?.['x-correlation-id'],
      });
      throw error;
    }
  }

  /**
   * PATCH request via Dapr
   */
  protected async patch<T>(url: string, data?: any, headers?: Record<string, string>): Promise<T> {
    try {
      logger.debug(`PATCH request to ${this.serviceName}`, {
        url,
        correlationId: headers?.['x-correlation-id'],
      });

      const response = await daprClient.invokeService<T>(this.appId, url, HttpMethod.PATCH, data, {
        headers,
      });

      logger.debug(`Response from ${this.serviceName}`, {
        url,
        correlationId: headers?.['x-correlation-id'],
      });

      return response;
    } catch (error: any) {
      logger.error(`PATCH request error to ${this.serviceName}`, {
        url,
        error: error.message,
        correlationId: headers?.['x-correlation-id'],
      });
      throw error;
    }
  }

  /**
   * DELETE request via Dapr
   */
  protected async delete<T>(url: string, headers?: Record<string, string>): Promise<T> {
    try {
      logger.debug(`DELETE request to ${this.serviceName}`, {
        url,
        correlationId: headers?.['x-correlation-id'],
      });

      const response = await daprClient.invokeService<T>(this.appId, url, HttpMethod.DELETE, null, {
        headers,
      });

      logger.debug(`Response from ${this.serviceName}`, {
        url,
        correlationId: headers?.['x-correlation-id'],
      });

      return response;
    } catch (error: any) {
      logger.error(`DELETE request error to ${this.serviceName}`, {
        url,
        error: error.message,
        correlationId: headers?.['x-correlation-id'],
      });
      throw error;
    }
  }
}
