/**
 * Configuration Validator for Web BFF
 * Validates all required environment variables at application startup
 * Fails fast if any required configuration is missing or invalid
 *
 * NOTE: This module MUST NOT import logger, as the logger depends on validated config.
 * Use console.log for bootstrap messages - this is industry standard practice.
 */

/**
 * Validates a URL format
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates a port number
 * @param {string|number} port - The port to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidPort = (port: string | number): boolean => {
  const portNum = parseInt(port.toString(), 10);
  return !isNaN(portNum) && portNum > 0 && portNum <= 65535;
};

/**
 * Validates NODE_ENV
 * @param {string} env - The environment to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidNodeEnv = (env: string): boolean => {
  const validEnvs = ['development', 'production', 'test', 'staging'];
  return validEnvs.includes(env?.toLowerCase());
};

/**
 * Validates log level
 * @param {string} level - The log level to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidLogLevel = (level: string): boolean => {
  const validLevels = ['error', 'warn', 'info', 'debug', 'trace'];
  return validLevels.includes(level?.toLowerCase());
};

interface ValidationRule {
  required: boolean;
  validator?: (value: string) => boolean;
  errorMessage: string;
}

/**
 * Configuration validation rules
 */
const validationRules: Record<string, ValidationRule> = {
  // Server Configuration
  NODE_ENV: {
    required: true,
    validator: isValidNodeEnv,
    errorMessage: 'NODE_ENV must be one of: development, production, test, staging',
  },
  PORT: {
    required: true,
    validator: (value) => isValidPort(value),
    errorMessage: 'PORT must be a valid port number (1-65535)',
  },
  HOST: {
    required: false,
    validator: (value) => !!(value && value.length > 0),
    errorMessage: 'HOST must be a non-empty string',
  },

  // Service URLs (required)
  AUTH_SERVICE_URL: {
    required: true,
    validator: isValidUrl,
    errorMessage: 'AUTH_SERVICE_URL must be a valid URL',
  },
  USER_SERVICE_URL: {
    required: true,
    validator: isValidUrl,
    errorMessage: 'USER_SERVICE_URL must be a valid URL',
  },

  // Service URLs (optional but must be valid if provided)
  PRODUCT_SERVICE_URL: {
    required: false,
    validator: isValidUrl,
    errorMessage: 'PRODUCT_SERVICE_URL must be a valid URL if provided',
  },
  INVENTORY_SERVICE_URL: {
    required: false,
    validator: isValidUrl,
    errorMessage: 'INVENTORY_SERVICE_URL must be a valid URL if provided',
  },
  REVIEW_SERVICE_URL: {
    required: false,
    validator: isValidUrl,
    errorMessage: 'REVIEW_SERVICE_URL must be a valid URL if provided',
  },
  CART_SERVICE_URL: {
    required: false,
    validator: isValidUrl,
    errorMessage: 'CART_SERVICE_URL must be a valid URL if provided',
  },
  ORDER_SERVICE_URL: {
    required: false,
    validator: isValidUrl,
    errorMessage: 'ORDER_SERVICE_URL must be a valid URL if provided',
  },

  // Service Health URLs (optional but must be valid if provided)
  AUTH_SERVICE_HEALTH_URL: {
    required: false,
    validator: isValidUrl,
    errorMessage: 'AUTH_SERVICE_HEALTH_URL must be a valid URL if provided',
  },
  USER_SERVICE_HEALTH_URL: {
    required: false,
    validator: isValidUrl,
    errorMessage: 'USER_SERVICE_HEALTH_URL must be a valid URL if provided',
  },
  PRODUCT_SERVICE_HEALTH_URL: {
    required: false,
    validator: isValidUrl,
    errorMessage: 'PRODUCT_SERVICE_HEALTH_URL must be a valid URL if provided',
  },
  INVENTORY_SERVICE_HEALTH_URL: {
    required: false,
    validator: isValidUrl,
    errorMessage: 'INVENTORY_SERVICE_HEALTH_URL must be a valid URL if provided',
  },
  REVIEW_SERVICE_HEALTH_URL: {
    required: false,
    validator: isValidUrl,
    errorMessage: 'REVIEW_SERVICE_HEALTH_URL must be a valid URL if provided',
  },
  CART_SERVICE_HEALTH_URL: {
    required: false,
    validator: isValidUrl,
    errorMessage: 'CART_SERVICE_HEALTH_URL must be a valid URL if provided',
  },
  ORDER_SERVICE_HEALTH_URL: {
    required: false,
    validator: isValidUrl,
    errorMessage: 'ORDER_SERVICE_HEALTH_URL must be a valid URL if provided',
  },

  // CORS Configuration
  ALLOWED_ORIGINS: {
    required: true,
    validator: (value) => {
      if (!value) return false;
      const origins = value.split(',').map((o) => o.trim());
      return origins.every((origin) => origin === '*' || isValidUrl(origin));
    },
    errorMessage: 'ALLOWED_ORIGINS must be a comma-separated list of valid URLs or *',
  },

  // Service Configuration
  SERVICE_TIMEOUT: {
    required: false,
    validator: (value) => !isNaN(parseInt(value, 10)) && parseInt(value, 10) > 0,
    errorMessage: 'SERVICE_TIMEOUT must be a positive number',
  },
  SERVICE_RETRY_COUNT: {
    required: false,
    validator: (value) => !isNaN(parseInt(value, 10)) && parseInt(value, 10) >= 0,
    errorMessage: 'SERVICE_RETRY_COUNT must be a non-negative number',
  },

  // Logging Configuration
  LOG_LEVEL: {
    required: false,
    validator: isValidLogLevel,
    errorMessage: 'LOG_LEVEL must be one of: error, warn, info, debug, trace',
  },

  // Redis Configuration
  REDIS_HOST: {
    required: false,
    validator: (value) => !!(value && value.length > 0),
    errorMessage: 'REDIS_HOST must be a non-empty string if provided',
  },
  REDIS_PORT: {
    required: false,
    validator: (value) => isValidPort(value),
    errorMessage: 'REDIS_PORT must be a valid port number if provided',
  },

  // Rate Limiting Configuration
  RATE_LIMIT_WINDOW_MS: {
    required: false,
    validator: (value) => !isNaN(parseInt(value, 10)) && parseInt(value, 10) > 0,
    errorMessage: 'RATE_LIMIT_WINDOW_MS must be a positive number',
  },
  RATE_LIMIT_MAX_REQUESTS: {
    required: false,
    validator: (value) => !isNaN(parseInt(value, 10)) && parseInt(value, 10) > 0,
    errorMessage: 'RATE_LIMIT_MAX_REQUESTS must be a positive number',
  },
};

/**
 * Validates all environment variables according to the rules
 * @throws {Error} - If any required variable is missing or invalid
 */
const validateConfig = (): void => {
  const errors: string[] = [];

  // Validate each rule
  for (const [key, rule] of Object.entries(validationRules)) {
    const value = process.env[key];

    // Check if required variable is missing
    if (rule.required && !value) {
      errors.push(`❌ ${key} is required but not set`);
      continue;
    }

    // Skip validation if optional and not provided
    if (!rule.required && !value) {
      continue;
    }

    // Validate the value if provided
    if (rule.validator && value && !rule.validator(value)) {
      errors.push(`❌ ${key}: ${rule.errorMessage}`);
      if (value.length > 100) {
        errors.push(`   Current value: ${value.substring(0, 100)}...`);
      } else {
        errors.push(`   Current value: ${value}`);
      }
    }
  }

  // If there are errors, log them and throw
  if (errors.length > 0) {
    console.error('[CONFIG] ❌ Configuration validation failed:');
    errors.forEach((error) => console.error(`❌ ${error}`));
    console.error(
      '💡 Please check your .env file and ensure all required variables are set correctly.'
    );
    throw new Error(`Configuration validation failed with ${errors.length} error(s)`);
  }
};

/**
 * Gets a validated configuration value
 * Assumes validateConfig() has already been called
 * @param {string} key - The configuration key
 * @returns {string} - The configuration value
 */
const getConfig = (key: string): string | undefined => {
  return process.env[key];
};

/**
 * Gets a validated configuration value as boolean
 * @param {string} key - The configuration key
 * @returns {boolean} - The configuration value as boolean
 */
const getConfigBoolean = (key: string): boolean => {
  return process.env[key]?.toLowerCase() === 'true';
};

/**
 * Gets a validated configuration value as number
 * @param {string} key - The configuration key
 * @returns {number} - The configuration value as number
 */
const getConfigNumber = (key: string): number => {
  return parseInt(process.env[key] || '0', 10);
};

/**
 * Gets a validated configuration value as array (comma-separated)
 * @param {string} key - The configuration key
 * @returns {string[]} - The configuration value as array
 */
const getConfigArray = (key: string): string[] => {
  return process.env[key]?.split(',').map((item) => item.trim()) || [];
};

export default validateConfig;
export { getConfig, getConfigBoolean, getConfigNumber, getConfigArray };
