import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Testimonial,
  TestimonialDocument,
} from './schemas/testimonial.schema';

@Injectable()
export class TestimonialsService {
  constructor(
    @InjectModel(Testimonial.name)
    private testimonialModel: Model<TestimonialDocument>,
  ) {}

  async create(
    userId: string,
    data: Partial<Testimonial>,
  ): Promise<TestimonialDocument> {
    return this.testimonialModel.create({
      ...data,
      userId: new Types.ObjectId(userId),
      status: 'pending',
    });
  }

  async getApproved(): Promise<TestimonialDocument[]> {
    return this.testimonialModel
      .find({ status: 'approved' })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });
  }

  // --- Admin ---

  async findAll(
    status?: string,
    page = 1,
    limit = 50,
  ): Promise<{ testimonials: TestimonialDocument[]; total: number }> {
    const filter: any = {};
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [testimonials, total] = await Promise.all([
      this.testimonialModel
        .find(filter)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.testimonialModel.countDocuments(filter),
    ]);

    return { testimonials, total };
  }

  async review(
    id: string,
    adminId: string,
    status: 'approved' | 'rejected',
  ): Promise<TestimonialDocument> {
    const testimonial = await this.testimonialModel.findByIdAndUpdate(
      id,
      {
        status,
        reviewedBy: new Types.ObjectId(adminId),
        reviewedAt: new Date(),
      },
      { new: true },
    );
    if (!testimonial) throw new NotFoundException('Testimonial not found');
    return testimonial;
  }
}
