import { Injectable, NotFoundException } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { SetCacheDto } from './dto/set-cache.dto';

@Injectable()
export class CacheService {
  constructor(private readonly redisService: RedisService) {}

  async set(dto: SetCacheDto) {
    await this.redisService.set(dto.key, dto.value, dto.ttlSeconds);
    return {
      message: 'Key successfully cached in Redis',
      key: dto.key,
      ttlSeconds: dto.ttlSeconds ?? 300,
    };
  }

  async get(key: string) {
    const value = await this.redisService.get(key);
    if (value === null || value === undefined) {
      throw new NotFoundException(`Key "${key}" was not found or has expired in Redis`);
    }
    return { key, value };
  }

  async delete(key: string) {
    const deletedCount = await this.redisService.del(key);
    return {
      key,
      deleted: deletedCount > 0,
    };
  }

  async listKeys(pattern = '*') {
    const keys = await this.redisService.getKeys(pattern);
    return { keys, count: keys.length };
  }
}
