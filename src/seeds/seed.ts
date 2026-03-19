import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../modules/users/users.service';
import { ProgramService } from '../modules/program/program.service';
import { ChecklistService } from '../modules/checklist/checklist.service';
import { UserRole } from '../modules/users/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const programService = app.get(ProgramService);
  const checklistService = app.get(ChecklistService);
  const configService = app.get(ConfigService);

  // 1. Create admin user
  const adminEmail = configService.get<string>('admin.email') || 'admin@p90.com';
  const existingAdmin = await usersService.findByEmail(adminEmail);

  if (!existingAdmin) {
    const adminPass = configService.get<string>('admin.password') || 'Admin@123456';
    const hashedPassword = await bcrypt.hash(adminPass, 10);
    await usersService.create({
      email: adminEmail,
      password: hashedPassword,
      name: configService.get<string>('admin.name') || 'Lara',
      role: UserRole.ADMIN,
      consentStatus: true,
      consentDate: new Date(),
    });
    console.log(`Admin user created: ${adminEmail}`);
  } else {
    console.log('Admin user already exists');
  }

  // 2. Seed 30 days of content
  const sampleLessons = [
    { day: 1, title: 'Welcome & Foundation', summary: 'Today we begin your wellness journey. This lesson covers the fundamentals of the P90 program and sets your intentions for the next 30 days.', tips: ['Find a quiet, comfortable space', 'Set an intention for your journey', 'Trust the process'] },
    { day: 2, title: 'Understanding Your Body', summary: "Learn to listen to your body's signals and understand how the P90 technology interacts with your nervous system.", tips: ['Pay attention to subtle sensations', 'Keep a relaxed posture', 'Breathe naturally'] },
    { day: 3, title: 'Building the Habit', summary: 'Consistency is the foundation of transformation. Today we focus on establishing your daily P90 routine.', tips: ['Choose the same time each day', 'Set a gentle reminder', 'Start with just 10 minutes'] },
    { day: 4, title: 'Nutrition Basics', summary: 'Fuel your body for optimal recovery and energy. Learn the basics of nutrition that complement your P90 program.', tips: ['Hydrate first thing in the morning', 'Eat whole, unprocessed foods', 'Prepare your smoothie ingredients ahead'] },
    { day: 5, title: 'Mindfulness Introduction', summary: 'Combining mindfulness with your P90 sessions amplifies the benefits. Learn simple breathing techniques.', tips: ['Focus on your breath', 'Let go of judgments', 'Even 2 minutes counts'] },
  ];

  for (const lesson of sampleLessons) {
    try {
      await programService.createDayContent({
        dayNumber: lesson.day,
        title: lesson.title,
        summary: lesson.summary,
        tips: lesson.tips,
        textContent: lesson.summary,
        isPublished: true,
        order: lesson.day,
      });
      console.log(`Created Day ${lesson.day} content`);
    } catch (e) {
      // Likely duplicate, skip
      console.log(`Day ${lesson.day} content already exists`);
    }
  }

  // Create placeholder content for remaining days
  for (let day = 6; day <= 30; day++) {
    try {
      await programService.createDayContent({
        dayNumber: day,
        title: `Day ${day} - Coming Soon`,
        summary: `Day ${day} content will be added by the admin.`,
        tips: ['Stay consistent', 'Listen to your body'],
        isPublished: false,
        order: day,
      });
      console.log(`Created placeholder for Day ${day}`);
    } catch (e) {
      console.log(`Day ${day} already exists`);
    }
  }

  // 3. Seed checklist config items
  const checklistItems = [
    { key: 'p90Session', label: 'P90 Session', description: 'Complete your daily device session', icon: 'flash-outline', order: 1 },
    { key: 'morningSmoothie', label: 'Morning Smoothie', description: 'Nutrient-packed start to your day', icon: 'cafe-outline', order: 2 },
    { key: 'waterIntake', label: 'Water Intake', description: 'Stay hydrated throughout the day', icon: 'water-outline', order: 3 },
    { key: 'vitaminsMinerals', label: 'Vitamins & Minerals', description: 'Take your daily supplements', icon: 'medical-outline', order: 4 },
    { key: 'movement', label: 'Movement', description: '30 minutes of gentle movement', icon: 'walk-outline', order: 5 },
    { key: 'mindfulness', label: 'Mindfulness', description: '10 minutes of meditation or breathwork', icon: 'leaf-outline', order: 6 },
  ];

  for (const item of checklistItems) {
    try {
      await checklistService.createConfig({ ...item, isActive: true });
      console.log(`Created checklist item: ${item.label}`);
    } catch (e) {
      console.log(`Checklist item "${item.label}" already exists`);
    }
  }

  console.log('Seed completed!');
  await app.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
