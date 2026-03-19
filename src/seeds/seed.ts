import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../modules/users/users.service';
import { ProgramService } from '../modules/program/program.service';
import { ChecklistService } from '../modules/checklist/checklist.service';
import { ResourcesService } from '../modules/resources/resources.service';
import { UserRole } from '../modules/users/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const programService = app.get(ProgramService);
  const checklistService = app.get(ChecklistService);
  const resourcesService = app.get(ResourcesService);
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

  // 4. Seed default resources
  const defaultResources = [
    // Learning
    { title: 'The Body Electric', description: 'Robert O. Becker\'s groundbreaking research on bioelectricity and the body\'s natural healing currents.', url: 'https://www.amazon.com/Body-Electric-Electromagnetism-Foundation-Life/dp/0688069711', type: 'book', category: 'learning', isFeatured: true, order: 1 },
    { title: 'Energy Medicine: The Scientific Basis', description: 'James Oschman explores the scientific evidence behind energy healing and biofield therapies.', url: 'https://www.amazon.com/Energy-Medicine-Scientific-James-Oschman/dp/0443067295', type: 'book', category: 'learning', isFeatured: false, order: 2 },
    { title: 'How PEMF Therapy Works', description: 'Comprehensive article explaining pulsed electromagnetic field therapy and its mechanisms.', url: 'https://www.pemf.com/what-is-pemf/', type: 'article', category: 'learning', isFeatured: false, order: 3 },
    // Wellness
    { title: 'The Healing Power of Frequency', description: 'Understanding how specific frequencies interact with the body to promote recovery and wellness.', url: 'https://pubmed.ncbi.nlm.nih.gov/34262567/', type: 'article', category: 'wellness', isFeatured: true, order: 4 },
    { title: 'Breath: The New Science of a Lost Art', description: 'James Nestor reveals the science behind ancient breathing practices and their health benefits.', url: 'https://www.amazon.com/Breath-New-Science-Lost-Art/dp/0735213615', type: 'book', category: 'wellness', isFeatured: false, order: 5 },
    { title: 'Daily Wellness Routine Guide', description: 'Video guide on building an effective daily wellness routine with device sessions.', url: 'https://www.youtube.com/watch?v=wellness-routine', type: 'video', category: 'wellness', isFeatured: false, order: 6 },
    // Devices
    { title: 'Understanding Your P90 Device', description: 'Official guide to getting the most out of your P90 device settings and session protocols.', url: 'https://p90wellness.com/device-guide', type: 'article', category: 'devices', isFeatured: true, order: 7 },
    { title: 'Device Maintenance & Care', description: 'Tips for maintaining your device for optimal performance and longevity.', url: 'https://p90wellness.com/maintenance', type: 'article', category: 'devices', isFeatured: false, order: 8 },
    // Nutrition
    { title: 'Anti-Inflammatory Diet Guide', description: 'Complete guide to foods that reduce inflammation and support your body\'s healing process.', url: 'https://www.health.harvard.edu/staying-healthy/foods-that-fight-inflammation', type: 'article', category: 'nutrition', isFeatured: true, order: 9 },
    { title: 'The Wahls Protocol', description: 'Dr. Terry Wahls\' research-backed approach to using food as medicine for cellular health.', url: 'https://www.amazon.com/Wahls-Protocol-Autoimmune-Conditions-Principles/dp/1583335544', type: 'book', category: 'nutrition', isFeatured: false, order: 10 },
    { title: 'Smoothie Recipes for Recovery', description: 'Nutrient-dense smoothie recipes designed to complement your P90 program.', url: 'https://p90wellness.com/smoothie-recipes', type: 'article', category: 'nutrition', isFeatured: false, order: 11 },
    // Mindfulness
    { title: 'Meditation for Beginners', description: '10-minute guided meditation designed for P90 users to enhance session effectiveness.', url: 'https://www.youtube.com/watch?v=meditation-guide', type: 'video', category: 'mindfulness', isFeatured: true, order: 12 },
    { title: 'The Relaxation Response', description: 'Dr. Herbert Benson\'s classic on how relaxation techniques trigger the body\'s healing mechanisms.', url: 'https://www.amazon.com/Relaxation-Response-Herbert-Benson/dp/0380006766', type: 'book', category: 'mindfulness', isFeatured: false, order: 13 },
    { title: 'Body Scan Meditation Practice', description: 'Guided body scan technique to increase awareness during and after device sessions.', url: 'https://www.youtube.com/watch?v=body-scan', type: 'video', category: 'mindfulness', isFeatured: false, order: 14 },
  ];

  for (const resource of defaultResources) {
    try {
      await resourcesService.create(resource as any);
      console.log(`Created resource: ${resource.title}`);
    } catch (e) {
      console.log(`Resource "${resource.title}" already exists or failed`);
    }
  }

  console.log('Seed completed!');
  await app.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
