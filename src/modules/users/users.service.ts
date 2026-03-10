import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(userData: Partial<User>): Promise<UserDocument> {
    return this.userModel.create(userData);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email });
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id);
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { refreshToken });
  }

  async findAll(
    query: any = {},
    page = 1,
    limit = 20,
  ): Promise<{ users: UserDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const filter: any = { isActive: true, ...query };

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-password -refreshToken')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.userModel.countDocuments(filter),
    ]);

    return { users, total };
  }

  async update(
    id: string,
    updateData: Partial<User>,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .select('-password -refreshToken');
  }

  async softDelete(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { isActive: false });
  }

  async countUsers(filter: any = {}): Promise<number> {
    return this.userModel.countDocuments({ isActive: true, ...filter });
  }

  async getActiveUsersCount(sinceDays = 7): Promise<number> {
    const since = new Date();
    since.setDate(since.getDate() - sinceDays);
    return this.userModel.countDocuments({
      isActive: true,
      updatedAt: { $gte: since },
    });
  }
}
