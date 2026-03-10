import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';

describe('UsersService', () => {
  let service: UsersService;
  let model: any;

  beforeEach(async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    model = {
      create: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      find: jest.fn().mockReturnValue(mockQuery),
      findByIdAndUpdate: jest.fn().mockReturnValue({ select: jest.fn().mockReturnThis() }),
      countDocuments: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: model },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should create a user', async () => {
    const userData = { email: 'test@test.com', password: 'hashed', name: 'Test' };
    model.create.mockResolvedValue({ _id: 'id', ...userData });
    const result = await service.create(userData);
    expect(result.email).toBe('test@test.com');
  });

  it('should find user by email', async () => {
    model.findOne.mockResolvedValue({ email: 'test@test.com' });
    const result = await service.findByEmail('test@test.com');
    expect(result?.email).toBe('test@test.com');
  });

  it('should return null for non-existent email', async () => {
    model.findOne.mockResolvedValue(null);
    const result = await service.findByEmail('noone@test.com');
    expect(result).toBeNull();
  });

  it('should find user by id', async () => {
    model.findById.mockResolvedValue({ _id: 'id', email: 'test@test.com' });
    const result = await service.findById('id');
    expect(result?._id).toBe('id');
  });

  it('should soft delete a user', async () => {
    model.findByIdAndUpdate.mockResolvedValue({});
    await service.softDelete('user-id');
    expect(model.findByIdAndUpdate).toHaveBeenCalledWith('user-id', { isActive: false });
  });

  it('should findAll with pagination', async () => {
    const mockUsers = [{ name: 'User 1' }];
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(mockUsers),
    };
    model.find.mockReturnValue(mockQuery);
    model.countDocuments.mockResolvedValue(1);

    const result = await service.findAll({}, 1, 20);
    expect(result.users).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('should exclude password from findAll results', async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([]),
    };
    model.find.mockReturnValue(mockQuery);
    model.countDocuments.mockResolvedValue(0);

    await service.findAll();
    expect(mockQuery.select).toHaveBeenCalledWith('-password -refreshToken');
  });
});
