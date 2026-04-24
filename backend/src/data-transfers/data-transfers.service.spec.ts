import { Test, TestingModule } from '@nestjs/testing';
import { DataTransfersService } from './data-transfers.service';

describe('DataTransfersService', () => {
  let service: DataTransfersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DataTransfersService],
    }).compile();

    service = module.get<DataTransfersService>(DataTransfersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
