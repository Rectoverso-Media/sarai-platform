import { Test, TestingModule } from '@nestjs/testing';
import { DatasourcesController } from './datasources.controller';

describe('DatasourcesController', () => {
  let controller: DatasourcesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DatasourcesController],
    }).compile();

    controller = module.get<DatasourcesController>(DatasourcesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
