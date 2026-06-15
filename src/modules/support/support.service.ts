import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ContactArgs {
  fromName: string;
  fromEmail: string;
  subject: string;
  message: string;
}

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(private configService: ConfigService) {}

  // Emails an in-app "Contact Support" request to the support inbox via
  // the same Brevo HTTP API used for password resets. Best-effort: a
  // Brevo failure is logged and surfaced to the caller so the UI can
  // show a retry, but it never throws an unhandled error.
  async sendContactRequest(args: ContactArgs): Promise<{ sent: boolean }> {
    const apiKey = this.configService.get<string>('BREVO_API_KEY');
    const senderEmail =
      this.configService.get<string>('BREVO_SMTP_USER') || 'noreply@p90app.com';
    // Where support requests land. Falls back to the sender address so
    // they at least reach a monitored mailbox until SUPPORT_EMAIL is set.
    const supportEmail =
      this.configService.get<string>('SUPPORT_EMAIL') || senderEmail;

    if (!apiKey) {
      this.logger.log(
        `[Support] (no BREVO key) from ${args.fromName} <${args.fromEmail}> — ${args.subject}: ${args.message}`,
      );
      return { sent: false };
    }

    const html = `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px;">
        <h2 style="color: #292524; margin: 0 0 4px;">New support request</h2>
        <p style="color: #78716c; font-size: 13px; margin: 0 0 20px;">via the NUMA app</p>
        <table style="width: 100%; font-size: 14px; color: #44403c; border-collapse: collapse;">
          <tr><td style="padding: 4px 0; width: 90px; color: #78716c;">From</td><td style="padding: 4px 0;">${args.fromName} &lt;${args.fromEmail}&gt;</td></tr>
          <tr><td style="padding: 4px 0; color: #78716c;">Subject</td><td style="padding: 4px 0;">${args.subject}</td></tr>
        </table>
        <div style="background: #f5f5f4; border-radius: 12px; padding: 16px 20px; margin-top: 16px; color: #292524; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${args.message}</div>
      </div>
    `;

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'NUMA Support', email: senderEmail },
        to: [{ email: supportEmail }],
        replyTo: { email: args.fromEmail, name: args.fromName },
        subject: `[Support] ${args.subject}`,
        htmlContent: html,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      this.logger.error(`Brevo support email failed ${response.status}: ${errBody}`);
      return { sent: false };
    }
    return { sent: true };
  }
}
