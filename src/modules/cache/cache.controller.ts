import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CacheService } from './cache.service';
import { SetCacheDto } from './dto/set-cache.dto';

@Controller('cache')
export class CacheController {
  constructor(private readonly cacheService: CacheService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  set(@Body() setCacheDto: SetCacheDto) {
    return this.cacheService.set(setCacheDto);
  }

  @Get('keys')
  listKeys(@Query('pattern') pattern?: string) {
    return this.cacheService.listKeys(pattern || '*');
  }

  @Get(':key')
  get(@Param('key') key: string) {
    return this.cacheService.get(key);
  }

  @Delete(':key')
  delete(@Param('key') key: string) {
    return this.cacheService.delete(key);
  }
}
