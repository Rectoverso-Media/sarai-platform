import { Test, TestingModule } from '@nestjs/testing';
import { AirbyteController } from './airbyte.controller';

describe('AirbyteController', () => {
  let controller: AirbyteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AirbyteController],
    }).compile();

    controller = module.get<AirbyteController>(AirbyteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
