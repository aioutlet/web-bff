import { DaprClient } from '@dapr/dapr';

const DAPR_SECRET_STORE = 'local-secret-store';

class DaprSecretManager {
  private client: DaprClient | null = null;
  private daprEnabled: boolean;

  constructor() {
    this.daprEnabled = process.env.DAPR_ENABLED === 'true';
    if (this.daprEnabled) {
      const daprHost = process.env.DAPR_HOST || '127.0.0.1';
      const daprPort = process.env.DAPR_HTTP_PORT || '3600';
      this.client = new DaprClient({
        daprHost,
        daprPort,
      });
    }
  }

  /**
   * Get a secret from Dapr secret store or fallback to environment variables
   * @param secretName - The name of the secret to retrieve
   * @returns The secret value or undefined if not found
   */
  async getSecret(secretName: string): Promise<string | undefined> {
    if (this.daprEnabled && this.client) {
      try {
        const secrets = await this.client.secret.get(DAPR_SECRET_STORE, secretName);
        const secretValue =
          secrets && typeof secrets === 'object'
            ? secrets[secretName as keyof typeof secrets]
            : undefined;
        return secretValue as string | undefined;
      } catch (error: any) {
        console.warn(`[Dapr] Failed to get secret '${secretName}' from Dapr, falling back to env`, {
          error: error.message,
        });
      }
    }
    return process.env[secretName];
  }

  /**
   * Get JWT configuration from secrets
   * @returns JWT secret and expiration settings
   */
  async getJwtConfig(): Promise<{ secret: string; expiresIn: string }> {
    const secret = (await this.getSecret('JWT_SECRET')) || 'default-secret-change-in-production';
    const expiresIn = (await this.getSecret('JWT_EXPIRES_IN')) || '1h';
    return { secret, expiresIn };
  }
}

// Export singleton instance
export const secretManager = new DaprSecretManager();
export default secretManager;
