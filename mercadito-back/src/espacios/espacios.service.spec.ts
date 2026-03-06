import { Test, TestingModule } from '@nestjs/testing';
import { EspaciosService } from './espacios.service';

describe('EspaciosService', () => {
  let service: EspaciosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EspaciosService],
    }).compile();

    service = module.get<EspaciosService>(EspaciosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
