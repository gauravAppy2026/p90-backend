import { Test, TestingModule } from '@nestjs/testing';
import { TestimonialsService } from './testimonials.service';
import { getModelToken } from '@nestjs/mongoose';
import { Testimonial } from './schemas/testimonial.schema';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

const userId = new Types.ObjectId().toString();
const adminId = new Types.ObjectId().toString();

describe('TestimonialsService', () => {
  let service: TestimonialsService;
  let model: any;

  beforeEach(async () => {
    model = {
      create: jest.fn(),
      find: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      countDocuments: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestimonialsService,
        { provide: getModelToken(Testimonial.name), useValue: model },
      ],
    }).compile();

    service = module.get<TestimonialsService>(TestimonialsService);
  });

  it('should create a testimonial with pending status', async () => {
    model.create.mockResolvedValue({ text: 'Great!', status: 'pending' });
    const result = await service.create(userId, { text: 'Great!' } as any);
    expect(result.status).toBe('pending');
  });

  it('should get approved testimonials', async () => {
    model.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([{ text: 'Good', status: 'approved' }]),
      }),
    });
    const result = await service.getApproved();
    expect(result).toHaveLength(1);
  });

  it('should find all with status filter', async () => {
    const chain = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    };
    model.find.mockReturnValue(chain);
    model.countDocuments.mockResolvedValue(0);
    const result = await service.findAll('pending');
    expect(result.testimonials).toHaveLength(0);
  });

  it('should review (approve) a testimonial', async () => {
    model.findByIdAndUpdate.mockResolvedValue({ status: 'approved' });
    const result = await service.review('t-id', adminId, 'approved');
    expect(result.status).toBe('approved');
  });

  it('should throw NotFoundException when reviewing non-existent testimonial', async () => {
    model.findByIdAndUpdate.mockResolvedValue(null);
    await expect(service.review('bad-id', adminId, 'approved')).rejects.toThrow(NotFoundException);
  });
});
