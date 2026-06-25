import {
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  SaqQuestion,
  SaqQuestionDocument,
} from './schemas/saq-question.schema';
import {
  SaqResponse,
  SaqResponseDocument,
} from './schemas/saq-response.schema';
import {
  SaqWebResponse,
  SaqWebResponseDocument,
} from './schemas/saq-web-response.schema';
import {
  CreateSaqQuestionDto,
  PublicSaqSubmitDto,
  SaveResponseDto,
  UpdateSaqQuestionDto,
} from './dto/saq.dto';
import { CLINICAL_SAQ_QUESTIONS } from './clinical-saq.seed';

type Audience = 'basic' | 'clinical';

// Unified row the admin sees, whether the response came from an app
// member (userId-keyed) or the public web form (email-keyed).
export interface AdminSaqResponse {
  _id: string;
  source: 'app' | 'web';
  name: string;
  email: string;
  detailId: string; // app: userId · web: web-response _id
  answers: Record<string, string>;
  submitted: boolean;
  submittedAt?: Date;
  updatedAt?: Date;
}

// 25 starter questions across 6 sections, derived from common functional-
// medicine intake forms. Admin can edit/add/remove via the admin UI.
const DEFAULT_QUESTIONS: Array<Omit<SaqQuestion, 'audience'> & { order: number }> = [
  // Goals & Vision
  { section: 'Goals & Vision', order: 1, type: 'long-text', text: 'What are your top 3 health goals for the next 30 days?', placeholder: 'e.g. better sleep, more energy, less back pain', required: true, options: [], helpText: '', isActive: true },
  { section: 'Goals & Vision', order: 2, type: 'long-text', text: 'What does "feeling great" look like for you?', placeholder: 'Describe a typical day at your best.', required: true, options: [], helpText: '', isActive: true },
  { section: 'Goals & Vision', order: 3, type: 'long-text', text: 'What is the biggest concern that brought you to this program?', required: true, options: [], helpText: '', placeholder: '', isActive: true },
  { section: 'Goals & Vision', order: 4, type: 'long-text', text: 'Where do you want to be one year from now?', required: false, options: [], helpText: '', placeholder: '', isActive: true },
  { section: 'Goals & Vision', order: 5, type: 'long-text', text: "What motivated you to choose the NUMA Plus program?", required: false, options: [], helpText: '', placeholder: '', isActive: true },

  // Diet
  { section: 'Diet & Nutrition', order: 10, type: 'dropdown', text: 'Which best describes your current diet?', options: ['Omnivore', 'Vegetarian', 'Vegan', 'Pescatarian', 'Keto / Low-carb', 'Raw / Living foods', 'Other'], required: true, helpText: '', placeholder: '', isActive: true },
  { section: 'Diet & Nutrition', order: 11, type: 'number', text: 'How many meals do you eat on a typical day?', required: false, options: [], helpText: '', placeholder: '3', isActive: true },
  { section: 'Diet & Nutrition', order: 12, type: 'number', text: 'About how many ounces of water do you drink per day?', required: false, options: [], helpText: 'Roughly — your best estimate.', placeholder: '64', isActive: true },
  { section: 'Diet & Nutrition', order: 13, type: 'short-text', text: 'Daily caffeine (coffee, tea, soda)?', required: false, options: [], placeholder: 'e.g. 2 cups coffee', helpText: '', isActive: true },
  { section: 'Diet & Nutrition', order: 14, type: 'long-text', text: 'Any food sensitivities, allergies, or foods you avoid?', required: false, options: [], helpText: '', placeholder: '', isActive: true },

  // Sleep & Energy
  { section: 'Sleep & Energy', order: 20, type: 'number', text: 'On average, how many hours do you sleep per night?', required: true, options: [], helpText: '', placeholder: '7', isActive: true },
  { section: 'Sleep & Energy', order: 21, type: 'scale-1-10', text: 'How would you rate your sleep quality? (1 = poor, 10 = excellent)', required: true, options: [], helpText: '', placeholder: '', isActive: true },
  { section: 'Sleep & Energy', order: 22, type: 'scale-1-10', text: 'How would you rate your daily energy? (1 = exhausted, 10 = vibrant)', required: true, options: [], helpText: '', placeholder: '', isActive: true },
  { section: 'Sleep & Energy', order: 23, type: 'scale-1-10', text: 'How would you rate your stress level? (1 = calm, 10 = overwhelmed)', required: true, options: [], helpText: '', placeholder: '', isActive: true },

  // Movement
  { section: 'Movement', order: 30, type: 'dropdown', text: 'How often do you exercise?', options: ['Daily', '3-5 times per week', '1-2 times per week', 'Rarely', 'Never'], required: true, helpText: '', placeholder: '', isActive: true },
  { section: 'Movement', order: 31, type: 'long-text', text: 'What kinds of movement do you currently enjoy?', placeholder: 'e.g. walking, yoga, weights, cycling', required: false, options: [], helpText: '', isActive: true },
  { section: 'Movement', order: 32, type: 'number', text: 'About how many hours per day do you spend sitting?', required: false, options: [], helpText: '', placeholder: '8', isActive: true },

  // Health & Symptoms
  { section: 'Health & Symptoms', order: 40, type: 'long-text', text: 'Are you experiencing any pain or physical discomfort? Where?', required: false, options: [], helpText: '', placeholder: '', isActive: true },
  { section: 'Health & Symptoms', order: 41, type: 'long-text', text: 'Any digestive issues you would like to address?', required: false, options: [], placeholder: 'e.g. bloating, constipation, reflux', helpText: '', isActive: true },
  { section: 'Health & Symptoms', order: 42, type: 'long-text', text: 'How would you describe your mood or mental wellbeing recently?', required: false, options: [], helpText: '', placeholder: '', isActive: true },
  { section: 'Health & Symptoms', order: 43, type: 'long-text', text: 'For women: anything to share about your cycle or hormonal symptoms?', required: false, options: [], helpText: 'Skip if not applicable.', placeholder: '', isActive: true },
  { section: 'Health & Symptoms', order: 44, type: 'long-text', text: 'Any other current symptoms or health concerns?', required: false, options: [], helpText: '', placeholder: '', isActive: true },

  // Medical context
  { section: 'Medical Context', order: 50, type: 'long-text', text: 'List any medications you currently take.', required: false, options: [], helpText: 'Include dose if known.', placeholder: '', isActive: true },
  { section: 'Medical Context', order: 51, type: 'long-text', text: 'List any supplements you take regularly.', required: false, options: [], helpText: '', placeholder: '', isActive: true },
  { section: 'Medical Context', order: 52, type: 'long-text', text: 'Any recent labs, diagnoses, or chronic conditions you are managing?', required: false, options: [], helpText: 'Optional but helpful for the consult.', placeholder: '', isActive: true },
];

@Injectable()
export class SaqService implements OnModuleInit {
  constructor(
    @InjectModel(SaqQuestion.name) private readonly questions: Model<SaqQuestionDocument>,
    @InjectModel(SaqResponse.name) private readonly responses: Model<SaqResponseDocument>,
    @InjectModel(SaqWebResponse.name)
    private readonly webResponses: Model<SaqWebResponseDocument>,
  ) {}

  async onModuleInit() {
    // Seed the basic in-app set if the collection is empty.
    const count = await this.questions.countDocuments();
    if (count === 0) {
      await this.questions.insertMany(DEFAULT_QUESTIONS as any[]);
    }
    // Seed the clinical (web / NUMA Plus) set if it isn't present yet.
    const clinicalCount = await this.questions.countDocuments({ audience: 'clinical' });
    if (clinicalCount === 0) {
      await this.questions.insertMany(CLINICAL_SAQ_QUESTIONS as any[]);
    }
  }

  // --- Public (member) ---

  // Questions for a given form. 'basic' = the in-app check-in (the original
  // set + anything not tagged clinical); 'clinical' = the full intake.
  async listActive(audience: Audience = 'basic') {
    const filter =
      audience === 'clinical'
        ? { isActive: true, audience: 'clinical' }
        : { isActive: true, audience: { $ne: 'clinical' } };
    return this.questions.find(filter).sort({ order: 1, section: 1 });
  }

  async getMyResponse(userId: string) {
    return this.responses.findOne({ userId: new Types.ObjectId(userId) });
  }

  async saveMyResponse(userId: string, dto: SaveResponseDto) {
    const set: any = { answers: dto.answers };
    if (dto.submitted) {
      set.submitted = true;
      set.submittedAt = new Date();
    }
    return this.responses.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $set: set },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  }

  // --- Public web form (no auth) ---

  // The public web Self-Assessment serves the clinical intake.
  async listActivePublic() {
    return this.listActive('clinical');
  }

  // Upsert by email so a re-submission from the same person updates their
  // existing record rather than creating a duplicate.
  async submitWebResponse(dto: PublicSaqSubmitDto) {
    await this.webResponses.findOneAndUpdate(
      { respondentEmail: dto.email.trim().toLowerCase() },
      {
        $set: {
          respondentName: dto.name.trim(),
          answers: dto.answers || {},
          submittedAt: new Date(),
          source: 'web',
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return { success: true };
  }

  // --- Admin ---

  async listAllQuestions() {
    // Sort by order (basic 1–99, clinical 1000+) so numbered clinical
    // sections stay in sequence rather than string-sorted ("10" before "2").
    return this.questions.find().sort({ order: 1, section: 1 });
  }

  async createQuestion(dto: CreateSaqQuestionDto) {
    return this.questions.create({
      ...dto,
      isActive: dto.isActive ?? true,
      required: dto.required ?? false,
      options: dto.options ?? [],
    });
  }

  async updateQuestion(id: string, dto: UpdateSaqQuestionDto) {
    const updated = await this.questions.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new NotFoundException('Question not found');
    return updated;
  }

  async deleteQuestion(id: string) {
    const deleted = await this.questions.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Question not found');
  }

  // Merged view: app-member responses + public web-form submissions,
  // normalised to a single shape and sorted newest-first. Optionally
  // filtered by a specific answer (the "searchable data" feature): pass a
  // questionId alone to match anyone who answered it, or with a value to
  // match an exact answer (e.g. questionId X = "Current").
  async listResponses(
    filter: { questionId?: string; value?: string } = {},
  ): Promise<AdminSaqResponse[]> {
    const query: any = {};
    if (filter.questionId) {
      const path = `answers.${filter.questionId}`;
      query[path] =
        filter.value != null && filter.value !== ''
          ? filter.value
          : { $exists: true, $nin: ['', null] };
    }

    const [appDocs, webDocs] = await Promise.all([
      this.responses
        .find(query)
        .sort({ submittedAt: -1, updatedAt: -1 })
        .populate('userId', 'email name'),
      this.webResponses.find(query).sort({ submittedAt: -1, updatedAt: -1 }),
    ]);

    const rows = [
      ...appDocs.map((d) => this.normalizeApp(d)),
      ...webDocs.map((d) => this.normalizeWeb(d)),
    ];
    rows.sort((a, b) => this.rowTime(b) - this.rowTime(a));
    return rows;
  }

  async getResponse(id: string): Promise<AdminSaqResponse> {
    const appDoc = await this.responses
      .findOne({ userId: new Types.ObjectId(id) })
      .populate('userId', 'email name');
    if (appDoc) return this.normalizeApp(appDoc);

    const webDoc = await this.webResponses.findById(id);
    if (webDoc) return this.normalizeWeb(webDoc);

    throw new NotFoundException('No response found');
  }

  private normalizeApp(d: any): AdminSaqResponse {
    const u = d.userId && typeof d.userId === 'object' ? d.userId : null;
    return {
      _id: String(d._id),
      source: 'app',
      name: u?.name || u?.email || '—',
      email: u?.email || '',
      detailId: u?._id ? String(u._id) : String(d.userId || ''),
      answers: d.answers || {},
      submitted: !!d.submitted,
      submittedAt: d.submittedAt,
      updatedAt: d.updatedAt,
    };
  }

  private normalizeWeb(d: any): AdminSaqResponse {
    return {
      _id: String(d._id),
      source: 'web',
      name: d.respondentName || '—',
      email: d.respondentEmail || '',
      detailId: String(d._id),
      answers: d.answers || {},
      submitted: true,
      submittedAt: d.submittedAt,
      updatedAt: d.updatedAt,
    };
  }

  private rowTime(r: AdminSaqResponse): number {
    const v = r.submittedAt || r.updatedAt;
    return v ? new Date(v).getTime() : 0;
  }

  // Research export: one row per respondent, one column per question in the
  // given form. Only includes respondents who answered at least one question
  // in that form, so a clinical export isn't padded with basic check-ins.
  async exportResponsesCsv(audience: Audience = 'clinical'): Promise<string> {
    const [questions, responses] = await Promise.all([
      this.listActive(audience),
      this.listResponses(),
    ]);
    const ids = questions.map((q) => String(q._id));
    const idSet = new Set(ids);
    const relevant = responses.filter((r) =>
      Object.keys(r.answers || {}).some((k) => idSet.has(k)),
    );

    const headers = [
      'Name',
      'Email',
      'Source',
      'Submitted At',
      ...questions.map((q) => `${q.section} — ${q.text}`),
    ];
    const lines = [headers.map(saqCsvCell).join(',')];
    for (const r of relevant) {
      const row = [
        r.name,
        r.email,
        r.source,
        r.submittedAt ? new Date(r.submittedAt).toISOString() : '',
        ...ids.map((id) => r.answers?.[id] ?? ''),
      ];
      lines.push(row.map(saqCsvCell).join(','));
    }
    return lines.join('\n');
  }
}

// RFC-4180-ish CSV cell escaping.
function saqCsvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
