import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('postgres.host'),
        port: config.get<number>('postgres.port'),
        username: config.get<string>('postgres.username'),
        password: config.get<string>('postgres.password'),
        database: config.get<string>('postgres.database'),
        autoLoadEntities: true,
        synchronize: config.get<boolean>('postgres.synchronize'),
        logging: config.get<boolean>('postgres.logging'),
        retryAttempts: 10,
        retryDelay: 3000,
      }),
    }),
  ],
})
export class PostgresModule {}
