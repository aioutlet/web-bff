import { DaprClient, HttpMethod, CommunicationProtocolEnum } from '@dapr/dapr';
import config from '../core/config.js';

interface InvokeMetadata {
  headers?: Record<string, string>;
}

class DaprClientService {
  private client: DaprClient | null = null;

  private ensureClient(): DaprClient {
    if (!this.client) {
      this.client = new DaprClient({
        daprHost: config.dapr.host,
        daprPort: String(config.dapr.httpPort),
        communicationProtocol: CommunicationProtocolEnum.HTTP,
      });
    }
    return this.client;
  }

  /**
   * Invoke a method on another Dapr service
   * @param appId - The app-id of the target service
   * @param methodName - The API endpoint/method to call (e.g., 'api/users')
   * @param httpMethod - HTTP method (GET, POST, PUT, DELETE, etc.)
   * @param data - Request payload (optional)
   * @param metadata - Additional metadata like headers (optional)
   * @returns Response data from the invoked service
   */
  async invokeService<T = any>(
    appId: string,
    methodName: string,
    httpMethod: HttpMethod,
    data?: any,
    metadata?: InvokeMetadata
  ): Promise<T> {
    try {
      const client = this.ensureClient();
      console.log(`[Dapr] Invoking ${appId}/${methodName}`, {
        httpMethod,
        headers: metadata?.headers,
        hasData: !!data,
      });
      const response = await client.invoker.invoke(appId, methodName, httpMethod, data, metadata);
      return response as T;
    } catch (error: any) {
      console.error(`[Dapr] Service invocation failed: ${appId}/${methodName}`, {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Publish an event to a pub/sub topic
   * @param topicName - The name of the topic
   * @param eventData - The event payload
   * @returns Promise that resolves when the event is published
   */
  async publishEvent(topicName: string, eventData: any): Promise<void> {
    try {
      const client = this.ensureClient();
      await client.pubsub.publish(config.dapr.pubsubName, topicName, eventData);
      console.log(`[Dapr] Event published to topic: ${topicName}`);
    } catch (error: any) {
      console.error(`[Dapr] Failed to publish event to ${topicName}`, {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get the underlying Dapr client (for advanced use cases)
   */
  getClient(): DaprClient {
    return this.ensureClient();
  }
}

// Export singleton instance
export const daprClient = new DaprClientService();
export default daprClient;
