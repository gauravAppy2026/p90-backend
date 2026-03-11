import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as path from 'path';

@Injectable()
export class UploadService {
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get('r2.bucketName') || 'p90-uploads';
    this.publicUrl = this.configService.get('r2.publicUrl') || '';

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: this.configService.get('r2.endpoint') || '',
      credentials: {
        accessKeyId: this.configService.get('r2.accessKeyId') || '',
        secretAccessKey: this.configService.get('r2.secretAccessKey') || '',
      },
    });
  }

  async uploadFile(
    file: Express.Multer.File,
  ): Promise<{ fileUrl: string; fileName: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const ext = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${ext}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return {
      fileUrl: `${this.publicUrl}/${fileName}`,
      fileName: file.originalname,
    };
  }
}
