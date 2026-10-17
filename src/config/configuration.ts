export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.APP_PORT || '3000', 10),
  appName: process.env.APP_NAME || 'docker-nest-mastery',
  apiPrefix: process.env.API_PREFIX || 'api/v1',

  postgres: {
    host: process.env.POSTGRES_HOST || 'postgres',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'postgres_user',
    password: process.env.POSTGRES_PASSWORD || 'postgres_secure_password',
    database: process.env.POSTGRES_DB || 'nest_docker_db',
    synchronize: process.env.POSTGRES_SYNCHRONIZE === 'true',
    logging: process.env.POSTGRES_LOGGING === 'true',
  },

  mongo: {
    host: process.env.MONGO_HOST || 'mongodb',
    port: parseInt(process.env.MONGO_PORT || '27017', 10),
    database: process.env.MONGO_DATABASE || 'nest_mongo_db',
    username: process.env.MONGO_INITDB_ROOT_USERNAME || 'mongo_user',
    password: process.env.MONGO_INITDB_ROOT_PASSWORD || 'mongo_secure_password',
    uri:
      process.env.MONGO_URI ||
      'mongodb://mongo_user:mongo_secure_password@mongodb:27017/nest_mongo_db?authSource=admin',
  },

  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || 'redis_secure_password',
    ttl: parseInt(process.env.REDIS_TTL || '300', 10),
  },
});
