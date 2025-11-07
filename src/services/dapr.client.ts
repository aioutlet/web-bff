import { DaprClient, HttpMethod } from '@dapr/dapr';

interface InvokeMetadata {
  headers?: Record<string, string>;
}

class DaprClientWrapper {
  private client: DaprClient;
  private daprHost: string;
  private daprPort: string;

  constructor() {
    this.daprHost = process.env.DAPR_HOST || '127.0.0.1';
    this.daprPort = process.env.DAPR_HTTP_PORT || '3600';
    this.client = new DaprClient({
      daprHost: this.daprHost,
      daprPort: this.daprPort,
    });
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
      const response = await this.client.invoker.invoke(
        appId,
        methodName,
        httpMethod,
        data,
        metadata
      );
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
    const pubsubName = process.env.DAPR_PUBSUB_NAME || 'rabbitmq-pubsub';
    try {
      await this.client.pubsub.publish(pubsubName, topicName, eventData);
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
    return this.client;
  }
}

// Export singleton instance
export const daprClient = new DaprClientWrapper();
export default daprClient;
