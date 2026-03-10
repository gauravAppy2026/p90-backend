import { Test, TestingModule } from '@nestjs/testing';
import { RetreatService } from './retreat.service';
import { getModelToken } from '@nestjs/mongoose';
import { RetreatSettings } from './schemas/retreat-settings.schema';

describe('RetreatService', () => {
  let service: RetreatService;
  let model: any;

  beforeEach(async () => {
    model = {
      findOne: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetreatService,
        { provide: getModelToken(RetreatSettings.name), useValue: model },
      ],
    }).compile();

    service = module.get<RetreatService>(RetreatService);
  });

  it('should get settings (singleton)', async () => {
    model.findOne.mockResolvedValue({ title: 'Retreat', isActive: true });
    const result = await service.getSettings();
    expect(result?.title).toBe('Retreat');
  });

  it('should create settings if none exist', async () => {
    model.findOne.mockResolvedValue(null);
    model.create.mockResolvedValue({ title: 'P90 Wellness Retreat', isActive: false });
    const result = await service.getSettings();
    expect(model.create).toHaveBeenCalled();
  });

  it('should update settings', async () => {
    const existing = { title: 'Old', save: jest.fn().mockResolvedValue({ title: 'New' }) };
    model.findOne.mockResolvedValue(existing);
    const result = await service.updateSettings({ title: 'New' });
    expect(existing.save).toHaveBeenCalled();
  });
});
