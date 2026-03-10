import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsService } from './questions.service';
import { getModelToken } from '@nestjs/mongoose';
import { Question } from './schemas/question.schema';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

const userId = new Types.ObjectId().toString();
const adminId = new Types.ObjectId().toString();

describe('QuestionsService', () => {
  let service: QuestionsService;
  let model: any;

  beforeEach(async () => {
    model = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      countDocuments: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionsService,
        { provide: getModelToken(Question.name), useValue: model },
      ],
    }).compile();

    service = module.get<QuestionsService>(QuestionsService);
  });

  it('should create a question', async () => {
    model.create.mockResolvedValue({ question: 'How?', status: 'pending' });
    const result = await service.create(userId, { question: 'How?' });
    expect(result.status).toBe('pending');
  });

  it('should get public FAQs', async () => {
    model.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([{ question: 'FAQ', isPublic: true }]) });
    const result = await service.getPublicFaqs();
    expect(result).toHaveLength(1);
  });

  it('should find all with status filter', async () => {
    const mockChain = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    };
    model.find.mockReturnValue(mockChain);
    model.countDocuments.mockResolvedValue(0);
    const result = await service.findAll('pending');
    expect(result.questions).toHaveLength(0);
  });

  it('should answer a question', async () => {
    const mockQuestion = {
      answer: '', status: 'pending', isPublic: false,
      save: jest.fn().mockImplementation(function() { return Promise.resolve(this); }),
    };
    model.findById.mockResolvedValue(mockQuestion);
    await service.answer('q-id', adminId, { answer: 'Answer here', isPublic: true });
    expect(mockQuestion.answer).toBe('Answer here');
    expect(mockQuestion.status).toBe('answered');
  });

  it('should throw NotFoundException when answering non-existent question', async () => {
    model.findById.mockResolvedValue(null);
    await expect(service.answer('bad-id', adminId, { answer: 'x' })).rejects.toThrow(NotFoundException);
  });

  it('should update question status', async () => {
    model.findByIdAndUpdate.mockResolvedValue({ status: 'archived' });
    const result = await service.updateStatus('q-id', 'archived');
    expect(result.status).toBe('archived');
  });
});
