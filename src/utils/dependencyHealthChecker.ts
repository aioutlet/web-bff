/**
 * Dependency Health Checker for Web BFF
 * Validates external service availability without blocking startup
 * Provides visibility into dependency status through logging
 */

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'timeout' | 'unreachable';
  url?: string;
  statusCode?: number;
  error?: string;
}

/**
 * Check health of service dependencies without blocking startup
 * @param {Object} dependencies - Object with service names as keys and health URLs as values
 * @param {number} timeout - Timeout for each health check in ms
 * @returns {Promise<Array>} - Array of health check results
 */
export async function checkDependencyHealth(
  dependencies: Record<string, string>,
  timeout: number = 5000
): Promise<HealthCheckResult[]> {
  const healthChecks = Object.entries(dependencies).map(
    async ([serviceName, healthUrl]): Promise<HealthCheckResult> => {
      try {
        // Create fetch with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(healthUrl, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
          method: 'GET',
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          return { service: serviceName, status: 'healthy', url: healthUrl };
        } else {
          return {
            service: serviceName,
            status: 'unhealthy',
            url: healthUrl,
            statusCode: response.status,
          };
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          return { service: serviceName, status: 'timeout', error: 'timeout' };
        } else {
          return { service: serviceName, status: 'unreachable', error: error.message };
        }
      }
    }
  );

  const results = await Promise.allSettled(healthChecks);

  // Extract values from settled promises
  const healthResults = results.map((r) =>
    r.status === 'fulfilled'
      ? r.value
      : { service: 'unknown', status: 'unreachable' as const, error: 'Promise rejected' }
  );

  // Log results in auth service format
  const healthyServices = healthResults.filter((r) => r.status === 'healthy').length;
  const totalServices = healthResults.length;

  // Log individual service status
  healthResults.forEach((result) => {
    if (result.status === 'healthy') {
      console.log(`[DEPS] ✅ ${result.service} is healthy`);
    } else {
      console.log(`[DEPS] ❌ ${result.service} is not reachable: ${result.error || result.status}`);
    }
  });

  // Log summary
  console.log(`[DEPS] ⚠️ ${healthyServices}/${totalServices} dependencies are healthy`);

  return healthResults;
}

/**
 * Get dependency health URLs from environment variables
 * Uses explicit health endpoint URLs for accurate health checking
 * @returns {Object} - Object with service names as keys and health URLs as values
 */
export function getDependencies(): Record<string, string> {
  const dependencies: Record<string, string> = {};

  // Core services (required)
  if (process.env.AUTH_SERVICE_HEALTH_URL) {
    dependencies['auth-service'] = process.env.AUTH_SERVICE_HEALTH_URL;
  }

  if (process.env.USER_SERVICE_HEALTH_URL) {
    dependencies['user-service'] = process.env.USER_SERVICE_HEALTH_URL;
  }

  // Optional services
  if (process.env.PRODUCT_SERVICE_HEALTH_URL) {
    dependencies['product-service'] = process.env.PRODUCT_SERVICE_HEALTH_URL;
  }

  if (process.env.INVENTORY_SERVICE_HEALTH_URL) {
    dependencies['inventory-service'] = process.env.INVENTORY_SERVICE_HEALTH_URL;
  }

  if (process.env.REVIEW_SERVICE_HEALTH_URL) {
    dependencies['review-service'] = process.env.REVIEW_SERVICE_HEALTH_URL;
  }

  if (process.env.CART_SERVICE_HEALTH_URL) {
    dependencies['cart-service'] = process.env.CART_SERVICE_HEALTH_URL;
  }

  if (process.env.ORDER_SERVICE_HEALTH_URL) {
    dependencies['order-service'] = process.env.ORDER_SERVICE_HEALTH_URL;
  }

  return dependencies;
}

/**
 * Get critical dependencies that must be healthy for BFF to function
 * @returns {Object} - Object with critical service names as keys and health URLs as values
 */
export function getCriticalDependencies(): Record<string, string> {
  const critical: Record<string, string> = {};

  // Auth service is critical - can't authenticate without it
  if (process.env.AUTH_SERVICE_HEALTH_URL) {
    critical['auth-service'] = process.env.AUTH_SERVICE_HEALTH_URL;
  }

  // User service is critical - most operations need user data
  if (process.env.USER_SERVICE_HEALTH_URL) {
    critical['user-service'] = process.env.USER_SERVICE_HEALTH_URL;
  }

  return critical;
}

/**
 * Check if critical dependencies are healthy
 * @param {number} timeout - Timeout for health checks
 * @returns {Promise<boolean>} - True if all critical dependencies are healthy
 */
export async function checkCriticalDependencies(timeout: number = 3000): Promise<boolean> {
  const critical = getCriticalDependencies();

  if (Object.keys(critical).length === 0) {
    return true;
  }

  const results = await checkDependencyHealth(critical, timeout);
  const allHealthy = results.every((r) => r.status === 'healthy');

  if (!allHealthy) {
    console.log('[DEPS] ⚠️ Some critical services unavailable - limited functionality');
    const unhealthy = results.filter((r) => r.status !== 'healthy');
    unhealthy.forEach((r) => {
      console.log(`[DEPS] ❌ ${r.service} is not reachable: ${r.error || r.status}`);
    });
  }

  return allHealthy;
}
