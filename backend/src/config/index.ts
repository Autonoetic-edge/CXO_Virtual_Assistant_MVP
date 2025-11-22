import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
  app: {
    env: string;
    port: number;
    apiBaseUrl: string;
  };
  database: {
    url: string;
    poolMin: number;
    poolMax: number;
  };
  redis: {
    url: string;
    password?: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  oauth: {
    google: {
      clientId: string;
      clientSecret: string;
      redirectUri: string;
    };
    microsoft: {
      clientId: string;
      clientSecret: string;
      redirectUri: string;
    };
    apple: {
      clientId: string;
      teamId: string;
      keyId: string;
      privateKeyPath: string;
    };
  };
  calendar: {
    google: {
      apiKey: string;
      scopes: string;
    };
    microsoft: {
      apiEndpoint: string;
      scopes: string;
    };
  };
  email: {
    sendgrid: {
      apiKey: string;
      fromEmail: string;
      fromName: string;
    };
  };
  slack: {
    botToken: string;
    signingSecret: string;
    appToken: string;
  };
  twilio: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
  };
  fcm: {
    serverKey: string;
    senderId: string;
  };
  ai: {
    openai: {
      apiKey: string;
      model: string;
      maxTokens: number;
    };
    anthropic: {
      apiKey: string;
    };
  };
  storage: {
    s3: {
      bucketName: string;
      region: string;
      accessKeyId: string;
      secretAccessKey: string;
    };
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  monitoring: {
    sentryDsn?: string;
    logLevel: string;
  };
  frontend: {
    webAppUrl: string;
    mobileAppScheme: string;
  };
  timezone: string;
  cacheTtl: number;
}

const config: Config = {
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://cxo_user:cxo_password@localhost:5432/cxo_assistant',
    poolMin: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/v1/auth/google/callback',
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID || '',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
      redirectUri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3000/api/v1/auth/microsoft/callback',
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID || '',
      teamId: process.env.APPLE_TEAM_ID || '',
      keyId: process.env.APPLE_KEY_ID || '',
      privateKeyPath: process.env.APPLE_PRIVATE_KEY_PATH || './keys/apple-private-key.p8',
    },
  },
  calendar: {
    google: {
      apiKey: process.env.GOOGLE_CALENDAR_API_KEY || '',
      scopes: process.env.GOOGLE_CALENDAR_SCOPES || 'https://www.googleapis.com/auth/calendar',
    },
    microsoft: {
      apiEndpoint: process.env.MICROSOFT_GRAPH_API_ENDPOINT || 'https://graph.microsoft.com/v1.0',
      scopes: process.env.MICROSOFT_GRAPH_SCOPES || 'Calendars.ReadWrite',
    },
  },
  email: {
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY || '',
      fromEmail: process.env.SENDGRID_FROM_EMAIL || 'assistant@yourcompany.ai',
      fromName: process.env.SENDGRID_FROM_NAME || 'CXO Assistant',
    },
  },
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN || '',
    signingSecret: process.env.SLACK_SIGNING_SECRET || '',
    appToken: process.env.SLACK_APP_TOKEN || '',
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  },
  fcm: {
    serverKey: process.env.FCM_SERVER_KEY || '',
    senderId: process.env.FCM_SENDER_ID || '',
  },
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000', 10),
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    },
  },
  storage: {
    s3: {
      bucketName: process.env.S3_BUCKET_NAME || 'cxo-assistant-files',
      region: process.env.S3_REGION || 'us-east-1',
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10),
  },
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN,
    logLevel: process.env.LOG_LEVEL || 'info',
  },
  frontend: {
    webAppUrl: process.env.WEB_APP_URL || 'http://localhost:5173',
    mobileAppScheme: process.env.MOBILE_APP_SCHEME || 'cxoassistant://',
  },
  timezone: process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata',
  cacheTtl: parseInt(process.env.CACHE_TTL_SECONDS || '3600', 10),
};

export default config;
