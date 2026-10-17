import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { PostgresModule } from './database/postgres.module';
import { MongoModule } from './database/mongo.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './modules/users/users.module';
import { LogsModule } from './modules/logs/logs.module';
import { CacheModule } from './modules/cache/cache.module';

@Module({
  imports: [
    // Global Config
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env'],
    }),

    // Databases & Cache
    PostgresModule,
    MongoModule,
    RedisModule,

    // Core & Feature Modules
    HealthModule,
    UsersModule,
    LogsModule,
    CacheModule,
  ],
})
export class AppModule {}
