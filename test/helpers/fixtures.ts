import { Types } from 'mongoose';

export function createUserFixture(overrides: any = {}) {
  return {
    email: `user${Date.now()}@test.com`,
    password: 'hashedpassword',
    name: 'Test User',
    role: 'user',
    isActive: true,
    consentStatus: false,
    ...overrides,
  };
}

export function createDayContentFixture(overrides: any = {}) {
  return {
    dayNumber: 1,
    title: 'Day 1: Getting Started',
    videoUrl: 'https://example.com/video1.mp4',
    textContent: 'Welcome to day 1',
    summary: 'Day 1 summary',
    tips: ['Tip 1', 'Tip 2'],
    checklistItems: [
      { label: 'Morning Walk', description: 'Walk for 30 min', icon: 'walk' },
    ],
    reflectionPrompt: 'How do you feel today?',
    isPublished: true,
    ...overrides,
  };
}

export function createUserProgressFixture(userId: string, overrides: any = {}) {
  return {
    userId: new Types.ObjectId(userId),
    currentDay: 1,
    programStarted: true,
    startDate: new Date(),
    completedLessons: [],
    completionPercentage: 0,
    streakCount: 0,
    lastActiveDate: new Date(),
    ...overrides,
  };
}

export function createDailyChecklistFixture(userId: string, overrides: any = {}) {
  return {
    userId: new Types.ObjectId(userId),
    date: new Date().toISOString().split('T')[0],
    dayNumber: 1,
    items: { morningWalk: true, meditation: false },
    completionCount: 1,
    ...overrides,
  };
}

export function createDailyTrackerFixture(userId: string, overrides: any = {}) {
  return {
    userId: new Types.ObjectId(userId),
    date: new Date().toISOString().split('T')[0],
    mood: 7,
    energy: 6,
    sleep: 8,
    stress: 4,
    ...overrides,
  };
}

export function createTrackerCategoryFixture(overrides: any = {}) {
  return {
    name: 'Mood',
    icon: 'happy-outline',
    description: 'Track your daily mood',
    min: 1,
    max: 10,
    isActive: true,
    order: 0,
    ...overrides,
  };
}

export function createQuestionFixture(userId: string, overrides: any = {}) {
  return {
    userId: new Types.ObjectId(userId),
    question: 'How does this work?',
    status: 'pending',
    isPublic: false,
    ...overrides,
  };
}

export function createTestimonialFixture(userId: string, overrides: any = {}) {
  return {
    userId: new Types.ObjectId(userId),
    content: 'This program changed my life!',
    rating: 5,
    status: 'pending',
    ...overrides,
  };
}

export function createResourceFixture(overrides: any = {}) {
  return {
    title: 'Meditation Guide',
    description: 'A comprehensive guide to meditation',
    url: 'https://example.com/guide',
    type: 'article',
    category: 'mindfulness',
    isActive: true,
    order: 0,
    ...overrides,
  };
}

export function createProductFixture(overrides: any = {}) {
  return {
    name: 'Yoga Mat',
    description: 'Premium yoga mat',
    price: 49.99,
    imageUrl: 'https://example.com/mat.jpg',
    affiliateUrl: 'https://shop.com/mat',
    category: 'equipment',
    isActive: true,
    order: 0,
    ...overrides,
  };
}

export function createRetreatSettingsFixture(overrides: any = {}) {
  return {
    title: 'P90 Wellness Retreat',
    description: 'Join us for a transformative retreat',
    location: 'Bali, Indonesia',
    startDate: new Date('2025-06-01'),
    endDate: new Date('2025-06-07'),
    price: 2999,
    isActive: true,
    bookingUrl: 'https://example.com/book',
    discountCode: 'P90VIP',
    discountPercentage: 15,
    ...overrides,
  };
}

export function createClickEventFixture(userId: string, overrides: any = {}) {
  return {
    userId: new Types.ObjectId(userId),
    eventType: 'product_click',
    targetId: new Types.ObjectId().toString(),
    targetUrl: 'https://shop.com/product',
    ...overrides,
  };
}
