import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import {
  UserProgress,
  UserProgressDocument,
} from '../program/schemas/user-progress.schema';
import {
  DailyTracker,
  DailyTrackerDocument,
} from '../tracker/schemas/daily-tracker.schema';

export interface ParticipantRow {
  userId: string;
  name: string;
  email: string;
  gender: string;
  age: string;
  chiefComplaint: string;
  trackerDays: number;
  notesCount: number;
  photoCount: number;
  okToContact: boolean;
  dataOptIn: boolean;
  currentDay: number;
  currentMonth: number;
  completionPercentage: number;
  lastTrackerDate: string;
  joinedAt: Date | undefined;
}

interface ListFilters {
  search?: string;
  gender?: string;
  minTrackerDays?: number;
  okToContact?: boolean;
  sortBy?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface TrackerStats {
  trackerDays: number;
  notesCount: number;
  photoCount: number;
  lastTrackerDate: string;
}

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectModel(User.name) private users: Model<UserDocument>,
    @InjectModel(UserProgress.name) private progress: Model<UserProgressDocument>,
    @InjectModel(DailyTracker.name) private trackers: Model<DailyTrackerDocument>,
  ) {}

  // One aggregation pass over DailyTracker → per-user stats.
  private async trackerStatsByUser(): Promise<Map<string, TrackerStats>> {
    const rows = await this.trackers.aggregate([
      {
        $group: {
          _id: '$userId',
          trackerDays: { $sum: 1 },
          notesCount: {
            $sum: { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$notes', ''] } }, 0] }, 1, 0] },
          },
          photoCount: {
            $sum: { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$photoUrl', ''] } }, 0] }, 1, 0] },
          },
          lastTrackerDate: { $max: '$date' },
        },
      },
    ]);
    const map = new Map<string, TrackerStats>();
    rows.forEach((r: any) => {
      map.set(String(r._id), {
        trackerDays: r.trackerDays || 0,
        notesCount: r.notesCount || 0,
        photoCount: r.photoCount || 0,
        lastTrackerDate: r.lastTrackerDate || '',
      });
    });
    return map;
  }

  // Cross-user participant table. Joins User + UserProgress + tracker
  // stats in memory — fine at launch scale; move to a single $lookup
  // aggregation if the dataset grows large.
  async list(filters: ListFilters): Promise<{ participants: ParticipantRow[]; total: number }> {
    const [users, progressDocs, stats] = await Promise.all([
      this.users.find({ role: UserRole.USER }).select('name email createdAt'),
      this.progress.find(),
      this.trackerStatsByUser(),
    ]);

    const progressByUser = new Map<string, UserProgressDocument>();
    progressDocs.forEach((p) => progressByUser.set(String(p.userId), p));

    let rows: ParticipantRow[] = users.map((u) => {
      const p = progressByUser.get(String(u._id));
      const s = stats.get(String(u._id));
      const demo = (p?.demographics || {}) as Record<string, string>;
      return {
        userId: String(u._id),
        name: u.name,
        email: u.email,
        gender: demo.sex || '',
        age: demo.age || '',
        chiefComplaint: demo.chiefComplaint || '',
        trackerDays: s?.trackerDays || 0,
        notesCount: s?.notesCount || 0,
        photoCount: s?.photoCount || 0,
        okToContact: !!p?.okToContact,
        dataOptIn: !!p?.dataOptIn,
        currentDay: p?.currentDay || 0,
        currentMonth: p?.currentMonth || 1,
        completionPercentage: p?.completionPercentage || 0,
        lastTrackerDate: s?.lastTrackerDate || '',
        joinedAt: (u as any).createdAt,
      };
    });

    // Filters
    if (filters.search) {
      const t = filters.search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.name?.toLowerCase().includes(t) ||
          r.email?.toLowerCase().includes(t) ||
          r.chiefComplaint?.toLowerCase().includes(t),
      );
    }
    if (filters.gender) {
      rows = rows.filter((r) => r.gender === filters.gender);
    }
    if (filters.minTrackerDays != null) {
      rows = rows.filter((r) => r.trackerDays >= filters.minTrackerDays!);
    }
    if (filters.okToContact != null) {
      rows = rows.filter((r) => r.okToContact === filters.okToContact);
    }

    // Sort
    const sortBy = filters.sortBy || 'trackerDays';
    const dir = filters.order === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      const av = (a as any)[sortBy];
      const bv = (b as any)[sortBy];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av ?? '').localeCompare(String(bv ?? '')) * dir;
    });

    const total = rows.length;
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(200, filters.limit || 25));
    const paged = rows.slice((page - 1) * limit, (page - 1) * limit + limit);
    return { participants: paged, total };
  }

  // Longitudinal research export: ONE ROW PER TRACKER-DAY, joined with
  // the participant's demographics. This is the "global lived-experience"
  // dataset — every daily log across every participant.
  async exportTrackerCsv(): Promise<string> {
    const [trackerDocs, users, progressDocs] = await Promise.all([
      this.trackers.find().sort({ userId: 1, date: 1 }),
      this.users.find().select('name email'),
      this.progress.find(),
    ]);

    const userById = new Map<string, UserDocument>();
    users.forEach((u) => userById.set(String(u._id), u));
    const progressByUser = new Map<string, UserProgressDocument>();
    progressDocs.forEach((p) => progressByUser.set(String(p.userId), p));

    const headers = [
      'Email',
      'Name',
      'Gender',
      'Age',
      'Chief Complaint',
      'Ok To Contact',
      'Date',
      'Day',
      'Energy',
      'Body Comfort',
      'Mindset',
      'Pen Test',
      'Custom Trackers',
      'Notes',
      'Photo URL',
    ];

    const lines = [headers.map(csvCell).join(',')];
    for (const t of trackerDocs) {
      const u = userById.get(String(t.userId));
      const p = progressByUser.get(String(t.userId));
      const demo = (p?.demographics || {}) as Record<string, string>;
      const custom = t.customTrackers
        ? JSON.stringify(Object.fromEntries(t.customTrackers as any))
        : '';
      lines.push(
        [
          u?.email || '',
          u?.name || '',
          demo.sex || '',
          demo.age || '',
          demo.chiefComplaint || '',
          p?.okToContact ? 'Yes' : 'No',
          t.date || '',
          t.dayNumber ?? '',
          t.energyLevel ?? '',
          t.bodyComfort ?? '',
          t.mindset ?? '',
          t.penTest ?? '',
          custom,
          t.notes || '',
          t.photoUrl || '',
        ]
          .map(csvCell)
          .join(','),
      );
    }
    return lines.join('\n');
  }
}

// RFC-4180-ish CSV cell escaping: wrap in quotes + double internal
// quotes when the value contains a comma, quote, or newline.
function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
