import { Test, TestingModule } from '@nestjs/testing';
import { ResourcesService } from './resources.service';
import { getModelToken } from '@nestjs/mongoose';
import { Resource } from './schemas/resource.schema';
import { NotFoundException } from '@nestjs/common';

describe('ResourcesService', () => {
  let service: ResourcesService;
  let model: any;

  beforeEach(async () => {
    model = {
      find: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourcesService,
        { provide: getModelToken(Resource.name), useValue: model },
      ],
    }).compile();

    service = module.get<ResourcesService>(ResourcesService);
  });

  it('should find active resources', async () => {
    model.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([{ title: 'Guide' }]) });
    const result = await service.findActive();
    expect(result).toHaveLength(1);
  });

  it('should filter by category', async () => {
    model.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });
    await service.findActive('wellness');
    expect(model.find).toHaveBeenCalledWith({ isActive: true, category: 'wellness' });
  });

  it('should create a resource', async () => {
    model.create.mockResolvedValue({ title: 'New Resource' });
    const result = await service.create({ title: 'New Resource' });
    expect(result.title).toBe('New Resource');
  });

  it('should update a resource', async () => {
    model.findByIdAndUpdate.mockResolvedValue({ title: 'Updated' });
    const result = await service.update('r-id', { title: 'Updated' });
    expect(result.title).toBe('Updated');
  });

  it('should throw NotFoundException on update of non-existent resource', async () => {
    model.findByIdAndUpdate.mockResolvedValue(null);
    await expect(service.update('bad-id', { title: 'x' })).rejects.toThrow(NotFoundException);
  });
});
