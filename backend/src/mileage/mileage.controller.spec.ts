import { Test, TestingModule } from '@nestjs/testing';
import { MileageController } from './mileage.controller';

describe('MileageController', () => {
  let controller: MileageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MileageController],
    }).compile();

    controller = module.get<MileageController>(MileageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
