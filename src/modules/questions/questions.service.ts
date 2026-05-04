import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Question,
  QuestionDocument,
  QuestionStatus,
} from './schemas/question.schema';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectModel(Question.name)
    private questionModel: Model<QuestionDocument>,
  ) {}

  async create(userId: string, data: Partial<Question>): Promise<QuestionDocument> {
    return this.questionModel.create({
      ...data,
      userId: new Types.ObjectId(userId),
      status: QuestionStatus.PENDING,
    });
  }

  async getPublicFaqs(): Promise<QuestionDocument[]> {
    return this.questionModel
      .find({
        isPublic: true,
        status: { $in: [QuestionStatus.ANSWERED, QuestionStatus.ARCHIVED] },
      })
      .sort({ createdAt: -1 });
  }

  async getMyQuestions(userId: string): Promise<QuestionDocument[]> {
    return this.questionModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 });
  }

  // --- Admin ---

  async findAll(
    status?: string,
    page = 1,
    limit = 50,
  ): Promise<{ questions: QuestionDocument[]; total: number }> {
    const filter: any = {};
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [questions, total] = await Promise.all([
      this.questionModel
        .find(filter)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.questionModel.countDocuments(filter),
    ]);

    return { questions, total };
  }

  async answer(
    id: string,
    adminId: string,
    data: { answer: string; isPublic?: boolean },
  ): Promise<QuestionDocument> {
    const question = await this.questionModel.findById(id);
    if (!question) throw new NotFoundException('Question not found');

    question.answer = data.answer;
    question.status = QuestionStatus.ANSWERED;
    question.isPublic = data.isPublic || false;
    question.answeredBy = new Types.ObjectId(adminId);
    question.answeredAt = new Date();

    return question.save();
  }

  async updateStatus(id: string, status: string): Promise<QuestionDocument> {
    const question = await this.questionModel.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );
    if (!question) throw new NotFoundException('Question not found');
    return question;
  }
}
