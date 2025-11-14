import logger from '../core/logger';
import config from '@/core/config';

export class DaprBaseClient {
  protected serviceName: string;
  protected appId: string;

  constructor(appId: string, serviceName: string) {
    this.appId = appId;
    this.serviceName = serviceName;

    logger.info(`[DaprBaseClient] Initialized for ${serviceName}`, {
      appId,
      serviceName,
    });
  }

  /**
   * Make a request to another service via Dapr
   */
  private async daprRequest<T>(
    method: string,
    url: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    // Lazy load Dapr modules only when needed
    const { HttpMethod } = await import('@dapr/dapr');
    const { daprClient } = await import('./dapr.client.service.js');

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
   * GET request via Dapr
   */
  protected async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.daprRequest<T>('GET', url, undefined, headers);
  }

  /**
   * POST request via Dapr
   */
  protected async post<T>(url: string, data?: any, headers?: Record<string, string>): Promise<T> {
    return this.daprRequest<T>('POST', url, data, headers);
  }

  /**
   * PUT request via Dapr
   */
  protected async put<T>(url: string, data?: any, headers?: Record<string, string>): Promise<T> {
    return this.daprRequest<T>('PUT', url, data, headers);
  }

  /**
   * PATCH request via Dapr
   */
  protected async patch<T>(url: string, data?: any, headers?: Record<string, string>): Promise<T> {
    return this.daprRequest<T>('PATCH', url, data, headers);
  }

  /**
   * DELETE request via Dapr
   */
  protected async delete<T>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.daprRequest<T>('DELETE', url, undefined, headers);
  }
}

