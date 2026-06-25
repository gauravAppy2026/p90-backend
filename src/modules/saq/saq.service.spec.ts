import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { SaqService } from './saq.service';
import { SaqQuestion } from './schemas/saq-question.schema';
import { SaqResponse } from './schemas/saq-response.schema';
import { SaqWebResponse } from './schemas/saq-web-response.schema';
import { CLINICAL_SAQ_QUESTIONS } from './clinical-saq.seed';

describe('SaqService', () => {
  let service: SaqService;
  let questions: any;
  let responses: any;
  let webResponses: any;

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
    webResponses = {
      findOne: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockResolvedValue(null),
      findOneAndUpdate: jest.fn().mockResolvedValue({}),
      find: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaqService,
        { provide: getModelToken(SaqQuestion.name), useValue: questions },
        { provide: getModelToken(SaqResponse.name), useValue: responses },
        { provide: getModelToken(SaqWebResponse.name), useValue: webResponses },
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
    webResponses.findById.mockResolvedValue(null);
    await expect(service.getResponse('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
  });

  it('submitWebResponse upserts by normalised email and stamps submittedAt', async () => {
    await service.submitWebResponse({
      name: '  Jane Doe  ',
      email: 'Jane@Example.COM',
      answers: { q1: 'A' },
    });
    const [filter, update] = webResponses.findOneAndUpdate.mock.calls[0];
    expect(filter).toEqual({ respondentEmail: 'jane@example.com' });
    expect(update.$set.respondentName).toBe('Jane Doe');
    expect(update.$set.answers).toEqual({ q1: 'A' });
    expect(update.$set.submittedAt).toBeInstanceOf(Date);
    expect(update.$set.source).toBe('web');
  });

  it('clinical seed is a large, fully audience-tagged set', () => {
    expect(CLINICAL_SAQ_QUESTIONS.length).toBeGreaterThan(100);
    expect(CLINICAL_SAQ_QUESTIONS.every((q) => q.audience === 'clinical')).toBe(true);
    expect(CLINICAL_SAQ_QUESTIONS.every((q) => q.text && q.section)).toBe(true);
  });

  it('listActive("clinical") filters to the clinical audience', async () => {
    await service.listActive('clinical');
    expect(questions.find).toHaveBeenCalledWith({ isActive: true, audience: 'clinical' });
  });

  it('listActive() defaults to basic (excludes clinical)', async () => {
    await service.listActive();
    expect(questions.find).toHaveBeenCalledWith({ isActive: true, audience: { $ne: 'clinical' } });
  });

  it('listResponses filters by an exact answer when questionId + value given', async () => {
    await service.listResponses({ questionId: 'q9', value: 'Current' });
    expect(responses.find).toHaveBeenCalledWith({ 'answers.q9': 'Current' });
    expect(webResponses.find).toHaveBeenCalledWith({ 'answers.q9': 'Current' });
  });

  it('listResponses matches any non-empty answer when only questionId given', async () => {
    await service.listResponses({ questionId: 'q9' });
    expect(responses.find).toHaveBeenCalledWith({
      'answers.q9': { $exists: true, $nin: ['', null] },
    });
  });

  it('seeds the clinical set when none exist', async () => {
    questions.countDocuments.mockResolvedValueOnce(25).mockResolvedValueOnce(0);
    await service.onModuleInit();
    const seededSets = questions.insertMany.mock.calls.map((c: any[]) => c[0]);
    const clinical = seededSets.find((s: any[]) => s?.[0]?.audience === 'clinical');
    expect(clinical).toBeTruthy();
    expect(clinical.length).toBe(CLINICAL_SAQ_QUESTIONS.length);
  });

  it('getResponse falls back to a web response when no app response exists', async () => {
    responses.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });
    webResponses.findById.mockResolvedValue({
      _id: 'web1',
      respondentName: 'Web Person',
      respondentEmail: 'web@example.com',
      answers: { q1: 'B' },
      submittedAt: new Date(),
    });
    const res = await service.getResponse('507f1f77bcf86cd799439011');
    expect(res.source).toBe('web');
    expect(res.name).toBe('Web Person');
    expect(res.detailId).toBe('web1');
  });
});
