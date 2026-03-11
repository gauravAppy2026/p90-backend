import { Controller, Post, Get } from '@nestjs/common';
import { UsersService } from '../modules/users/users.service';
import { ProgramService } from '../modules/program/program.service';
import { UserRole } from '../modules/users/schemas/user.schema';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Controller('api/seed')
export class SeedController {
  constructor(
    private usersService: UsersService,
    private programService: ProgramService,
    private configService: ConfigService,
  ) {}

  @Get('run')
  async runSeed() {
    const results: string[] = [];

    // 1. Create admin user
    const adminEmail =
      this.configService.get<string>('admin.email') || 'admin@p90.com';
    const existingAdmin = await this.usersService.findByEmail(adminEmail);

    if (!existingAdmin) {
      const adminPass =
        this.configService.get<string>('admin.password') || 'Admin@123456';
      const hashedPassword = await bcrypt.hash(adminPass, 10);
      await this.usersService.create({
        email: adminEmail,
        password: hashedPassword,
        name: this.configService.get<string>('admin.name') || 'Lara',
        role: UserRole.ADMIN,
        consentStatus: true,
        consentDate: new Date(),
      });
      results.push(`Admin user created: ${adminEmail}`);
    } else {
      results.push('Admin user already exists');
    }

    // 2. Seed program content
    const sampleLessons = [
      { day: 1, title: 'Welcome & Foundation', summary: 'Today we begin your wellness journey.', tips: ['Find a quiet space', 'Set an intention', 'Trust the process'] },
      { day: 2, title: 'Understanding Your Body', summary: 'Learn to listen to your body\'s signals.', tips: ['Pay attention to sensations', 'Keep relaxed posture', 'Breathe naturally'] },
      { day: 3, title: 'Building the Habit', summary: 'Consistency is the foundation of transformation.', tips: ['Same time each day', 'Set a reminder', 'Start with 10 minutes'] },
      { day: 4, title: 'Nutrition Basics', summary: 'Fuel your body for optimal recovery.', tips: ['Hydrate morning', 'Eat whole foods', 'Prep ingredients'] },
      { day: 5, title: 'Mindfulness Introduction', summary: 'Combining mindfulness with P90 amplifies benefits.', tips: ['Focus on breath', 'Let go of judgments', '2 minutes counts'] },
    ];

    for (const lesson of sampleLessons) {
      try {
        await this.programService.createDayContent({
          dayNumber: lesson.day,
          title: lesson.title,
          summary: lesson.summary,
          tips: lesson.tips,
          textContent: lesson.summary,
          isPublished: true,
          order: lesson.day,
        });
        results.push(`Created Day ${lesson.day} content`);
      } catch {
        results.push(`Day ${lesson.day} already exists`);
      }
    }

    for (let day = 6; day <= 30; day++) {
      try {
        await this.programService.createDayContent({
          dayNumber: day,
          title: `Day ${day} - Coming Soon`,
          summary: `Day ${day} content will be added by the admin.`,
          tips: ['Stay consistent', 'Listen to your body'],
          isPublished: false,
          order: day,
        });
        results.push(`Created placeholder Day ${day}`);
      } catch {
        results.push(`Day ${day} already exists`);
      }
    }

    return { message: 'Seed completed!', results };
  }
}
