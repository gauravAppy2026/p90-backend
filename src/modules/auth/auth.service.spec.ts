import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let configService: jest.Mocked<Partial<ConfigService>>;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      updateRefreshToken: jest.fn(),
      update: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-token'),
    };
    configService = {
      get: jest.fn().mockReturnValue('test-secret'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const dto = { email: 'test@test.com', password: 'Pass123!', name: 'Test' };
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      usersService.findByEmail!.mockResolvedValue(null);
      usersService.create!.mockResolvedValue({
        _id: 'user-id', email: dto.email, name: dto.name, role: 'user',
      } as any);

      const result = await service.register(dto);
      expect(result.message).toBe('Registration successful');
      expect(result.data.user.email).toBe(dto.email);
      expect(result.data.accessToken).toBe('mock-token');
    });

    it('should throw ConflictException for duplicate email', async () => {
      usersService.findByEmail!.mockResolvedValue({ _id: 'existing' } as any);
      await expect(service.register({ email: 'dup@test.com', password: 'Pass123!', name: 'Test' }))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const mockUser = { _id: 'user-id', email: 'test@test.com', password: 'hashed', name: 'Test', role: 'user', isActive: true };

    it('should login with valid credentials', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');

      const result = await service.login({ email: 'test@test.com', password: 'Pass123!' });
      expect(result.message).toBe('Login successful');
      expect(result.data.accessToken).toBe('mock-token');
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.login({ email: 'test@test.com', password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      usersService.findByEmail!.mockResolvedValue({ ...mockUser, isActive: false } as any);
      await expect(service.login({ email: 'test@test.com', password: 'Pass123!' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      usersService.findByEmail!.mockResolvedValue(null);
      await expect(service.login({ email: 'noone@test.com', password: 'Pass123!' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should refresh tokens successfully', async () => {
      usersService.findById!.mockResolvedValue({ _id: 'user-id', email: 'test@test.com', refreshToken: 'hashed-refresh' } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed');

      const result = await service.refresh('user-id', 'valid-refresh');
      expect(result.message).toBe('Token refreshed');
    });

    it('should throw if user not found', async () => {
      usersService.findById!.mockResolvedValue(null);
      await expect(service.refresh('bad-id', 'token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if token does not match', async () => {
      usersService.findById!.mockResolvedValue({ _id: 'user-id', refreshToken: 'hashed' } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.refresh('user-id', 'wrong-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should clear refresh token', async () => {
      usersService.updateRefreshToken!.mockResolvedValue(undefined);
      const result = await service.logout('user-id');
      expect(result.message).toBe('Logged out successfully');
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith('user-id', null);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      usersService.findById!.mockResolvedValue({
        _id: 'user-id', email: 'test@test.com', name: 'Test', role: 'user',
        goals: 'Be healthy', consentStatus: true, consentDate: new Date(),
      } as any);
      const result = await service.getProfile('user-id');
      expect(result.email).toBe('test@test.com');
    });

    it('should throw if user not found', async () => {
      usersService.findById!.mockResolvedValue(null);
      await expect(service.getProfile('bad-id')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('updateProfile', () => {
    it('should filter to only allowed fields', async () => {
      usersService.update!.mockResolvedValue({} as any);
      await service.updateProfile('user-id', { name: 'New', goals: 'New Goals', email: 'hack@test.com' });
      expect(usersService.update).toHaveBeenCalledWith('user-id', { name: 'New', goals: 'New Goals' });
    });
  });

  describe('recordConsent', () => {
    it('should update consent status', async () => {
      usersService.update!.mockResolvedValue({} as any);
      await service.recordConsent('user-id');
      expect(usersService.update).toHaveBeenCalledWith('user-id', expect.objectContaining({
        consentStatus: true,
        consentDate: expect.any(Date),
      }));
    });
  });
});
