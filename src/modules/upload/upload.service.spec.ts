import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';

jest.mock('fs');

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('/tmp/uploads') },
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
  });

  it('should throw BadRequestException if no file provided', async () => {
    await expect(service.uploadFile(null as any)).rejects.toThrow(BadRequestException);
  });

  it('should upload file and return URL', async () => {
    (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);
    const file = { originalname: 'photo.jpg', buffer: Buffer.from('test') } as Express.Multer.File;
    const result = await service.uploadFile(file);
    expect(result.fileUrl).toContain('/uploads/');
    expect(result.fileName).toBe('photo.jpg');
  });

  it('should generate unique filenames', async () => {
    (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);
    const file1 = { originalname: 'a.jpg', buffer: Buffer.from('1') } as Express.Multer.File;
    const file2 = { originalname: 'a.jpg', buffer: Buffer.from('2') } as Express.Multer.File;
    const r1 = await service.uploadFile(file1);
    const r2 = await service.uploadFile(file2);
    expect(r1.fileUrl).not.toBe(r2.fileUrl);
  });
});
