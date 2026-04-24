import { Test, TestingModule } from '@nestjs/testing';
import { DataTransfersController } from './data-transfers.controller';

describe('DataTransfersController', () => {
  let controller: DataTransfersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DataTransfersController],
    }).compile();

    controller = module.get<DataTransfersController>(DataTransfersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
