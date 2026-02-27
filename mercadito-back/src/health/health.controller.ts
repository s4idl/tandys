import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'OK',
      message: 'Backend running',
      timestamp: new Date(),
    };
  }
}