import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { DataSource } from 'typeorm';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { RedisService } from '../redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    @InjectConnection() private readonly mongoConnection: Connection,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  async check(@Res() res: Response) {
    const checks: Record<string, any> = {
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      services: {},
    };

    let allHealthy = true;

    // 1. PostgreSQL Check
    try {
      if (this.dataSource.isInitialized) {
        await this.dataSource.query('SELECT 1');
        checks.services.postgres = { status: 'up', message: 'Connected to PostgreSQL' };
      } else {
        allHealthy = false;
        checks.services.postgres = { status: 'down', message: 'DataSource not initialized' };
      }
    } catch (err: any) {
      allHealthy = false;
      checks.services.postgres = { status: 'down', error: err.message };
    }

    // 2. MongoDB Check
    try {
      const isMongoConnected = this.mongoConnection.readyState === 1;
      if (isMongoConnected && this.mongoConnection.db) {
        await this.mongoConnection.db.admin().ping();
        checks.services.mongodb = { status: 'up', message: 'Connected to MongoDB' };
      } else {
        allHealthy = false;
        checks.services.mongodb = {
          status: 'down',
          message: `ReadyState is ${this.mongoConnection.readyState} (1 is connected)`,
        };
      }
    } catch (err: any) {
      allHealthy = false;
      checks.services.mongodb = { status: 'down', error: err.message };
    }

    // 3. Redis Check
    try {
      const redisPing = await this.redisService.ping();
      checks.services.redis = {
        status: redisPing === 'PONG' ? 'up' : 'down',
        response: redisPing,
      };
      if (redisPing !== 'PONG') allHealthy = false;
    } catch (err: any) {
      allHealthy = false;
      checks.services.redis = { status: 'down', error: err.message };
    }

    checks.status = allHealthy ? 'healthy' : 'degraded';
    const statusCode = allHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

    return res.status(statusCode).json(checks);
  }
}
