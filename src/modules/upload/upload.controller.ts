import {
  BadRequestException,
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UploadService } from './upload.service';

// Verify actual file signature instead of trusting the client-supplied
// Content-Type (which is trivially spoofable).
function isImageByMagicBytes(buf: Buffer): boolean {
  if (!buf || buf.length < 12) return false;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  // GIF87a / GIF89a
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return true;
  // WebP: "RIFF" .... "WEBP"
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return true;
  // BMP
  if (buf[0] === 0x42 && buf[1] === 0x4d) return true;
  // HEIC/HEIF: ftyp box at bytes 4..7, brand at 8..11 includes "heic"/"heix"/"mif1"
  if (buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) return true;
  return false;
}

@Controller('api/upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only image files are allowed'), false);
        }
      },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Only image files are allowed');
    }
    if (!isImageByMagicBytes(file.buffer)) {
      throw new BadRequestException('File content is not a valid image');
    }
    return this.uploadService.uploadFile(file);
  }
}
