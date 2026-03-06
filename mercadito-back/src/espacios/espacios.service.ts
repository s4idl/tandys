import { Injectable } from '@nestjs/common';

@Injectable()
export class EspaciosService {
  findAll() {
    return {
      message: 'Solo los admin pueden ver esto',
    };
  }
}