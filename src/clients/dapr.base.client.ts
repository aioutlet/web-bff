import logger from '../core/logger';
import config from '@/core/config';

export class DaprBaseClient {
  protected serviceName: string;
  protected appId: string;
  protected baseUrl: string;
  protected useDapr: boolean;

  constructor(appId: string, serviceName: string) {
    this.appId = appId;
    this.serviceName = serviceName;
    this.useDapr = config.dapr.enabled;

    // Get base URL from environment variables for direct HTTP calls
    const serviceUrlKey = `${serviceName.toUpperCase().replace(/-/g, '_')}_URL`;
    this.baseUrl =
      process.env[serviceUrlKey] || `http://localhost:${this.getDefaultPort(serviceName)}`;

    logger.info(`[DaprBaseClient] Initialized for ${serviceName}`, {
      appId,
      serviceName,
      useDapr: this.useDapr,
      serviceUrlKey,
      baseUrl: this.baseUrl,
      envValue: process.env[serviceUrlKey],
    });
  }

  private getDefaultPort(serviceName: string): number {
    const portMap: Record<string, number> = {
      'auth-service': 3001,
      'user-service': 3002,
      'product-service': 8003,
      'inventory-service': 8004,
      'cart-service': 8005,
      'order-service': 5088,
      'payment-service': 5002,
      'review-service': 9001,
      'admin-service': 8008,
    };
    return portMap[serviceName] || 3000;
  }

  private async httpRequest<T>(
    method: string,
    url: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    try {
      const fullUrl = `${this.baseUrl}${url}`;
      logger.debug(`Direct HTTP ${method} request to ${this.serviceName}`, {
        url: fullUrl,
        correlationId: headers?.['x-correlation-id'],
      });

      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      if (data && method !== 'GET' && method !== 'DELETE') {
        fetchOptions.body = JSON.stringify(data);
      }

      const response = await fetch(fullUrl, fetchOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        logger.error(`Direct HTTP ${method} request error to ${this.serviceName}`, {
          url: fullUrl,
          status: response.status,
          error: errorData,
          correlationId: headers?.['x-correlation-id'],
        });
        throw errorData;
      }

      const responseData = await response.json();

      logger.debug(`Direct HTTP response from ${this.serviceName}`, {
        url: fullUrl,
        status: response.status,
        correlationId: headers?.['x-correlation-id'],
      });

      return responseData as T;
    } catch (error: any) {
      logger.error(`Direct HTTP ${method} request error to ${this.serviceName}`, {
        url,
        error: error.message,
        correlationId: headers?.['x-correlation-id'],
      });
      throw error;
    }
  }

  private async daprRequest<T>(
    method: string,
    url: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    // Lazy load Dapr modules only when needed
    const { HttpMethod } = await import('@dapr/dapr');
    const { daprClient } = await import('./dapr.service.client.js');

    const methodMap: Record<string, any> = {
      GET: HttpMethod.GET,
      POST: HttpMethod.POST,
      PUT: HttpMethod.PUT,
      PATCH: HttpMethod.PATCH,
      DELETE: HttpMethod.DELETE,
    };

    logger.debug(`Dapr ${method} request to ${this.serviceName}`, {
      url,
      correlationId: headers?.['x-correlation-id'],
    });

    const response = await daprClient.invokeService<T>(
      this.appId,
      url,
      methodMap[method],
      method !== 'GET' && method !== 'DELETE' ? data : null,
      { headers }
    );

    logger.debug(`Dapr response from ${this.serviceName}`, {
      url,
      correlationId: headers?.['x-correlation-id'],
    });

    return response;
  }

  /**
   * GET request via Dapr or HTTP
   */
  protected async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    if (this.useDapr) {
      return this.daprRequest<T>('GET', url, undefined, headers);
    } else {
      return this.httpRequest<T>('GET', url, undefined, headers);
    }
  }

  /**
   * POST request via Dapr or HTTP
   */
  protected async post<T>(url: string, data?: any, headers?: Record<string, string>): Promise<T> {
    if (this.useDapr) {
      return this.daprRequest<T>('POST', url, data, headers);
    } else {
      return this.httpRequest<T>('POST', url, data, headers);
    }
  }

  /**
   * PUT request via Dapr or HTTP
   */
  protected async put<T>(url: string, data?: any, headers?: Record<string, string>): Promise<T> {
    if (this.useDapr) {
      return this.daprRequest<T>('PUT', url, data, headers);
    } else {
      return this.httpRequest<T>('PUT', url, data, headers);
    }
  }

  /**
   * PATCH request via Dapr or HTTP
   */
  protected async patch<T>(url: string, data?: any, headers?: Record<string, string>): Promise<T> {
    if (this.useDapr) {
      return this.daprRequest<T>('PATCH', url, data, headers);
    } else {
      return this.httpRequest<T>('PATCH', url, data, headers);
    }
  }

  /**
   * DELETE request via Dapr or HTTP
   */
  protected async delete<T>(url: string, headers?: Record<string, string>): Promise<T> {
    if (this.useDapr) {
      return this.daprRequest<T>('DELETE', url, undefined, headers);
    } else {
      return this.httpRequest<T>('DELETE', url, undefined, headers);
    }
  }
}
