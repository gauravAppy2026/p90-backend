import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
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
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

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
  private readonly logger = new Logger(ParticipantsService.name);

  constructor(
    @InjectModel(User.name) private users: Model<UserDocument>,
    @InjectModel(UserProgress.name) private progress: Model<UserProgressDocument>,
    @InjectModel(DailyTracker.name) private trackers: Model<DailyTrackerDocument>,
    private readonly config: ConfigService,
    private readonly subscriptions: SubscriptionsService,
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

  // --- Outreach (admin-triggered from the dashboard) ----------------------

  // Gentle re-engagement email to a participant who may have gone quiet.
  async sendNudge(userId: string): Promise<{ sent: boolean }> {
    const user = await this.users.findById(userId).select('name email');
    if (!user) throw new NotFoundException('Participant not found');

    const firstName = (user.name || 'there').split(' ')[0];
    const html = wrapEmail(`
      <h2 style="color:#292524;margin:0 0 12px;">We're cheering you on, ${esc(firstName)} 🌿</h2>
      <p style="color:#44403c;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Just a gentle nudge from the NUMA team — your wellness journey is waiting for you whenever you're ready.
        Even a few minutes with the device and a quick check-in today keeps your momentum going.
      </p>
      <p style="color:#44403c;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Open the app, log how you're feeling, and pick up right where you left off. Small steps, real change.
      </p>
      <p style="color:#78716c;font-size:13px;margin:24px 0 0;">With care,<br/>The NUMA Team</p>
    `);

    const sent = await this.sendEmail(user.email, user.name, "Your NUMA journey is waiting 🌿", html);
    return { sent };
  }

  // Mint a single unlock code for this participant and email it to them as
  // a "you've earned free access" invite. Records the recipient on the code.
  async inviteToFreeAccess(
    adminId: string,
    userId: string,
    product: 'all-in' | '30-day-recharge' = '30-day-recharge',
  ): Promise<{ sent: boolean; code: string }> {
    const user = await this.users.findById(userId).select('name email');
    if (!user) throw new NotFoundException('Participant not found');

    const [codeDoc] = await this.subscriptions.generateCodes({
      count: 1,
      createdBy: adminId,
      product,
      notes: `Free-access invite → ${user.email}`,
    });
    const code = codeDoc.code;

    const firstName = (user.name || 'there').split(' ')[0];
    const productLabel =
      product === 'all-in' ? 'the NUMA Plus experience' : 'the 30-Day Recharge program';
    const html = wrapEmail(`
      <h2 style="color:#292524;margin:0 0 12px;">A gift for you, ${esc(firstName)} 🎁</h2>
      <p style="color:#44403c;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Your dedication to tracking your journey has truly stood out — thank you for being part of the NUMA community.
        We'd love for you to keep going, on us.
      </p>
      <p style="color:#44403c;font-size:15px;line-height:1.6;margin:0 0 8px;">
        Here is your free-access code for ${esc(productLabel)}:
      </p>
      <div style="text-align:center;margin:16px 0 20px;">
        <span style="display:inline-block;background:#f5f5f4;border:1px dashed #a8a29e;border-radius:12px;padding:14px 28px;font-size:24px;letter-spacing:4px;font-weight:700;color:#292524;">${esc(code)}</span>
      </div>
      <p style="color:#44403c;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Open the NUMA app, go to <strong>Redeem Code</strong>, and enter it to unlock your access.
      </p>
      <p style="color:#78716c;font-size:13px;margin:24px 0 0;">With gratitude,<br/>The NUMA Team</p>
    `);

    const sent = await this.sendEmail(
      user.email,
      user.name,
      "You've earned free access to NUMA 🎁",
      html,
    );
    return { sent, code };
  }

  // Brevo HTTP send — mirrors the support mailer. Best-effort: logs and
  // returns false on failure rather than throwing.
  private async sendEmail(
    to: string,
    toName: string,
    subject: string,
    html: string,
  ): Promise<boolean> {
    const apiKey = this.config.get<string>('BREVO_API_KEY');
    const senderEmail =
      this.config.get<string>('BREVO_SMTP_USER') || 'noreply@p90app.com';
    const replyTo = this.config.get<string>('SUPPORT_EMAIL') || senderEmail;

    if (!apiKey) {
      this.logger.log(`[Outreach] (no BREVO key) to ${to} — ${subject}`);
      return false;
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'The NUMA Team', email: senderEmail },
          to: [{ email: to, name: toName }],
          replyTo: { email: replyTo },
          subject,
          htmlContent: html,
        }),
      });
      if (!response.ok) {
        const errBody = await response.text();
        this.logger.error(`Brevo outreach email failed ${response.status}: ${errBody}`);
        return false;
      }
      return true;
    } catch (err) {
      this.logger.error(`Brevo outreach email error: ${String(err)}`);
      return false;
    }
  }
}

// Minimal HTML escaping for values interpolated into outreach emails.
function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Shared email shell.
function wrapEmail(inner: string): string {
  return `<div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:560px;margin:0 auto;padding:32px 20px;">${inner}</div>`;
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
