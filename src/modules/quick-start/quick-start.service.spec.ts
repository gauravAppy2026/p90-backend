import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { QuickStartService } from './quick-start.service';
import { QuickStartVideo } from './schemas/quick-start-video.schema';
import { QuickStartConfig } from './schemas/quick-start-config.schema';

describe('QuickStartService', () => {
  let service: QuickStartService;
  let model: any;
  let configModel: any;

  beforeEach(async () => {
    model = {
      find: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      create: jest.fn(),
    };
    configModel = {
      findOne: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuickStartService,
        { provide: getModelToken(QuickStartVideo.name), useValue: model },
        { provide: getModelToken(QuickStartConfig.name), useValue: configModel },
      ],
    }).compile();

    service = module.get(QuickStartService);
  });

  it('listActive filters out inactive videos', async () => {
    const mockChain = { sort: jest.fn().mockResolvedValue([{ title: 'Intro' }]) };
    model.find.mockReturnValue(mockChain);
    const r = await service.listActive();
    expect(model.find).toHaveBeenCalledWith({ isActive: true });
    expect(r).toEqual([{ title: 'Intro' }]);
  });

  it('listAll returns every video', async () => {
    const mockChain = { sort: jest.fn().mockResolvedValue([{ title: 'A' }, { title: 'B' }]) };
    model.find.mockReturnValue(mockChain);
    await service.listAll();
    expect(model.find).toHaveBeenCalledWith();
  });

  it('create defaults isActive to true when omitted', async () => {
    model.create.mockResolvedValue({ _id: 'v1', isActive: true });
    await service.create({ title: 'T', videoUrl: 'https://r2/v.mp4' });
    expect(model.create).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: true }),
    );
  });

  it('update throws when not found', async () => {
    model.findByIdAndUpdate.mockResolvedValue(null);
    await expect(service.update('nope', { title: 'X' })).rejects.toThrow(NotFoundException);
  });

  it('delete throws when not found', async () => {
    model.findByIdAndDelete.mockResolvedValue(null);
    await expect(service.delete('nope')).rejects.toThrow(NotFoundException);
  });

  it('getConfig creates default doc when none exists', async () => {
    configModel.findOne.mockResolvedValue(null);
    configModel.create.mockResolvedValue({ introText: 'default' });
    const r = await service.getConfig();
    expect(configModel.create).toHaveBeenCalledWith({});
    expect(r).toEqual({ introText: 'default' });
  });

  it('updateConfig persists introText', async () => {
    const existing = { introText: 'old', save: jest.fn().mockResolvedValue({ introText: 'new' }) };
    configModel.findOne.mockResolvedValue(existing);
    await service.updateConfig({ introText: 'new' });
    expect(existing.introText).toBe('new');
    expect(existing.save).toHaveBeenCalled();
  });
});
