import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';

const mockSend = jest.fn().mockResolvedValue({});

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
  PutObjectCommand: jest.fn(),
}));

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(async () => {
    mockSend.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                'r2.endpoint': 'https://test.r2.cloudflarestorage.com',
                'r2.accessKeyId': 'test-key',
                'r2.secretAccessKey': 'test-secret',
                'r2.bucketName': 'p90-uploads',
                'r2.publicUrl': 'https://pub-test.r2.dev',
              };
              return config[key] || '';
            }),
          },
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
  });

  it('should throw BadRequestException if no file provided', async () => {
    await expect(service.uploadFile(null as any)).rejects.toThrow(BadRequestException);
  });

  it('should upload file to R2 and return public URL', async () => {
    const file = { originalname: 'photo.jpg', buffer: Buffer.from('test'), mimetype: 'image/jpeg' } as Express.Multer.File;
    const result = await service.uploadFile(file);
    expect(result.fileUrl).toContain('https://pub-test.r2.dev/');
    expect(result.fileName).toBe('photo.jpg');
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('should generate unique filenames', async () => {
    const file1 = { originalname: 'a.jpg', buffer: Buffer.from('1'), mimetype: 'image/jpeg' } as Express.Multer.File;
    const file2 = { originalname: 'a.jpg', buffer: Buffer.from('2'), mimetype: 'image/jpeg' } as Express.Multer.File;
    const r1 = await service.uploadFile(file1);
    const r2 = await service.uploadFile(file2);
    expect(r1.fileUrl).not.toBe(r2.fileUrl);
  });
});
