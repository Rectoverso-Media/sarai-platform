import { Test, TestingModule } from '@nestjs/testing';
import { AirbyteService } from './airbyte.service';

describe('AirbyteService', () => {
  let service: AirbyteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AirbyteService],
    }).compile();

    service = module.get<AirbyteService>(AirbyteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
