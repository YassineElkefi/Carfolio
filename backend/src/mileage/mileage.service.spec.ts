import { Test, TestingModule } from '@nestjs/testing';
import { MileageService } from './mileage.service';

describe('MileageService', () => {
  let service: MileageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MileageService],
    }).compile();

    service = module.get<MileageService>(MileageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
