import { DaprClient, CommunicationProtocolEnum } from '@dapr/dapr';
import config from '../core/config.js';

class DaprSecretManager {
  private client: DaprClient;

  constructor() {
    this.client = new DaprClient({
      daprHost: config.dapr.host,
      daprPort: String(config.dapr.httpPort),
      communicationProtocol: CommunicationProtocolEnum.HTTP,
    });
  }

  /**
   * Get a secret from Dapr secret store
   * @param secretName - The name of the secret to retrieve
   * @returns The secret value
   */
  async getSecret(secretName: string): Promise<string> {
    try {
      const secrets = await this.client.secret.get(config.dapr.secretStoreName, secretName);
      const secretValue =
        secrets && typeof secrets === 'object'
          ? secrets[secretName as keyof typeof secrets]
          : undefined;
      
      if (!secretValue) {
        throw new Error(`Secret '${secretName}' not found in Dapr secret store`);
      }
      
      return secretValue as string;
    } catch (error: any) {
      console.error(`[Dapr] Failed to get secret '${secretName}' from Dapr`, {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get JWT configuration from secrets
   * @returns JWT secret and expiration settings
   */
  async getJwtConfig(): Promise<{ secret: string; expiresIn: string }> {
    const secret = await this.getSecret('JWT_SECRET');
    const expiresIn = await this.getSecret('JWT_EXPIRES_IN') || '1h';
    return { secret, expiresIn };
  }
}

// Export singleton instance
export const secretManager = new DaprSecretManager();
export default secretManager;
