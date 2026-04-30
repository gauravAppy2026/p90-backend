import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { SaqService } from './saq.service';
import { SaqQuestion } from './schemas/saq-question.schema';
import { SaqResponse } from './schemas/saq-response.schema';

describe('SaqService', () => {
  let service: SaqService;
  let questions: any;
  let responses: any;

  beforeEach(async () => {
    questions = {
      countDocuments: jest.fn().mockResolvedValue(25),
      insertMany: jest.fn(),
      find: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };
    responses = {
      findOne: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      }),
      findOneAndUpdate: jest.fn(),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue([]),
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaqService,
        { provide: getModelToken(SaqQuestion.name), useValue: questions },
        { provide: getModelToken(SaqResponse.name), useValue: responses },
      ],
    }).compile();

    service = module.get(SaqService);
  });

  it('seeds 25 default questions when collection is empty', async () => {
    questions.countDocuments.mockResolvedValue(0);
    await service.onModuleInit();
    expect(questions.insertMany).toHaveBeenCalled();
    const seeded = questions.insertMany.mock.calls[0][0];
    expect(seeded.length).toBe(25);
    // Verify all sections present
    const sections = new Set(seeded.map((q: any) => q.section));
    expect(sections.has('Goals & Vision')).toBe(true);
    expect(sections.has('Diet & Nutrition')).toBe(true);
    expect(sections.has('Sleep & Energy')).toBe(true);
    expect(sections.has('Movement')).toBe(true);
    expect(sections.has('Health & Symptoms')).toBe(true);
    expect(sections.has('Medical Context')).toBe(true);
  });

  it('does not seed when questions already exist', async () => {
    questions.countDocuments.mockResolvedValue(25);
    await service.onModuleInit();
    expect(questions.insertMany).not.toHaveBeenCalled();
  });

  it('saveMyResponse upserts as draft when submitted is false/missing', async () => {
    responses.findOneAndUpdate.mockResolvedValue({ submitted: false });
    await service.saveMyResponse('507f1f77bcf86cd799439011', { answers: { q1: 'A' } });
    const call = responses.findOneAndUpdate.mock.calls[0][1];
    expect(call.$set.answers).toEqual({ q1: 'A' });
    expect(call.$set.submitted).toBeUndefined();
  });

  it('saveMyResponse stamps submittedAt when submitted=true', async () => {
    responses.findOneAndUpdate.mockResolvedValue({ submitted: true });
    await service.saveMyResponse('507f1f77bcf86cd799439011', {
      answers: { q1: 'A' },
      submitted: true,
    });
    const call = responses.findOneAndUpdate.mock.calls[0][1];
    expect(call.$set.submitted).toBe(true);
    expect(call.$set.submittedAt).toBeInstanceOf(Date);
  });

  it('updateQuestion throws when not found', async () => {
    questions.findByIdAndUpdate.mockResolvedValue(null);
    await expect(service.updateQuestion('nope', { text: 'x' })).rejects.toThrow(NotFoundException);
  });

  it('deleteQuestion throws when not found', async () => {
    questions.findByIdAndDelete.mockResolvedValue(null);
    await expect(service.deleteQuestion('nope')).rejects.toThrow(NotFoundException);
  });

  it('getResponse throws when no response exists', async () => {
    responses.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });
    await expect(service.getResponse('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
  });
});
