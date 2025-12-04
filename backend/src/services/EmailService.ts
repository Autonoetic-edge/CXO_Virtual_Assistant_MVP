import config from '../config';
import logger from '../utils/logger';

// SendGrid types (mock implementation if sendgrid not installed)
interface EmailMessage {
  to: string;
  from: {
    email: string;
    name: string;
  };
  subject: string;
  text?: string;
  html?: string;
}

export class EmailService {
  private fromEmail: string;
  private fromName: string;
  private apiKey: string;

  constructor() {
    this.apiKey = config.email.sendgrid.apiKey;
    this.fromEmail = config.email.sendgrid.fromEmail;
    this.fromName = config.email.sendgrid.fromName;
  }

  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
    if (!this.apiKey) {
      logger.warn('SendGrid API key not configured. Email not sent.');
      return false;
    }

    try {
      // In production, use @sendgrid/mail
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(this.apiKey);
      // await sgMail.send(msg);

      const msg: EmailMessage = {
        to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject,
        text: text || html.replace(/<[^>]*>/g, ''),
        html,
      };

      logger.info(`Email would be sent to ${to}: ${subject}`);
      logger.debug('Email content:', msg);

      // Simulate sending (in production, use actual SendGrid)
      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  async sendMorningBriefing(to: string, briefingData: any): Promise<boolean> {
    const { content } = briefingData;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .section { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .section h3 { color: #667eea; margin-top: 0; }
          .task { padding: 10px; border-left: 3px solid #667eea; margin-bottom: 10px; background: #f8fafc; }
          .priority-high { border-left-color: #ef4444; }
          .priority-urgent { border-left-color: #dc2626; }
          .reminder { padding: 10px; background: #fef3c7; border-radius: 4px; margin-bottom: 10px; }
          .motivational { font-style: italic; color: #6b7280; padding: 15px; background: #f3e8ff; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; color: #9ca3af; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Good Morning! ☀️</h1>
          <p>${content.greeting}</p>
        </div>
        <div class="content">
          <div class="section">
            <h3>📋 Today's Summary</h3>
            <p>${content.summary}</p>
          </div>

          ${content.tasks?.length > 0 ? `
          <div class="section">
            <h3>✅ Tasks for Today</h3>
            ${content.tasks.map((task: any) => `
              <div class="task ${task.priority === 'high' ? 'priority-high' : task.priority === 'urgent' ? 'priority-urgent' : ''}">
                <strong>${task.title}</strong>
                ${task.due_date ? `<br><small>Due: ${new Date(task.due_date).toLocaleDateString()}</small>` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}

          ${content.reminders?.length > 0 ? `
          <div class="section">
            <h3>⏰ Reminders</h3>
            ${content.reminders.map((reminder: any) => `
              <div class="reminder">
                <strong>${reminder.title}</strong>
                <br><small>${new Date(reminder.remind_at).toLocaleString()}</small>
              </div>
            `).join('')}
          </div>
          ` : ''}

          ${content.events?.length > 0 ? `
          <div class="section">
            <h3>📅 Today's Events</h3>
            ${content.events.map((event: any) => `
              <div class="task">
                <strong>${event.title}</strong>
                <br><small>${new Date(event.start_time).toLocaleTimeString()} - ${new Date(event.end_time).toLocaleTimeString()}</small>
                ${event.location ? `<br><small>📍 ${event.location}</small>` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}

          ${content.motivationalMessage ? `
          <div class="section">
            <div class="motivational">
              💡 ${content.motivationalMessage}
            </div>
          </div>
          ` : ''}

          ${content.actionItems?.length > 0 ? `
          <div class="section">
            <h3>🎯 Action Items</h3>
            <ul>
              ${content.actionItems.map((item: string) => `<li>${item}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
        </div>
        <div class="footer">
          <p>CXO Virtual Assistant - Your AI-powered productivity partner</p>
          <p>Have a productive day!</p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(to, `Good Morning! Your Daily Briefing - ${new Date().toLocaleDateString()}`, html);
  }

  async sendEveningSummary(to: string, summaryData: any): Promise<boolean> {
    const { content } = summaryData;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #1e3a8a 0%, #581c87 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .section { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .section h3 { color: #1e3a8a; margin-top: 0; }
          .completed { padding: 10px; border-left: 3px solid #22c55e; margin-bottom: 10px; background: #f0fdf4; }
          .pending { padding: 10px; border-left: 3px solid #f59e0b; margin-bottom: 10px; background: #fffbeb; }
          .motivational { font-style: italic; color: #6b7280; padding: 15px; background: #dbeafe; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; color: #9ca3af; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Evening Summary 🌙</h1>
          <p>${content.greeting}</p>
        </div>
        <div class="content">
          <div class="section">
            <h3>📊 Today's Recap</h3>
            <p>${content.summary}</p>
          </div>

          ${content.tasks?.filter((t: any) => t.status === 'completed').length > 0 ? `
          <div class="section">
            <h3>✅ Completed Today</h3>
            ${content.tasks.filter((t: any) => t.status === 'completed').map((task: any) => `
              <div class="completed">
                <strong>✓ ${task.title}</strong>
              </div>
            `).join('')}
          </div>
          ` : ''}

          ${content.tasks?.filter((t: any) => t.status !== 'completed').length > 0 ? `
          <div class="section">
            <h3>📋 Carried Forward</h3>
            ${content.tasks.filter((t: any) => t.status !== 'completed').map((task: any) => `
              <div class="pending">
                ${task.title}
              </div>
            `).join('')}
          </div>
          ` : ''}

          ${content.motivationalMessage ? `
          <div class="section">
            <div class="motivational">
              🌟 ${content.motivationalMessage}
            </div>
          </div>
          ` : ''}
        </div>
        <div class="footer">
          <p>CXO Virtual Assistant - Your AI-powered productivity partner</p>
          <p>Rest well and recharge for tomorrow!</p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(to, `Your Day in Review - ${new Date().toLocaleDateString()}`, html);
  }

  async sendReminderNotification(to: string, reminder: any): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .container { background: #fef3c7; padding: 30px; border-radius: 8px; border-left: 5px solid #f59e0b; }
          h2 { color: #d97706; margin-top: 0; }
          .footer { text-align: center; padding: 20px; color: #9ca3af; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>⏰ Reminder</h2>
          <h3>${reminder.title}</h3>
          ${reminder.description ? `<p>${reminder.description}</p>` : ''}
          <p><strong>Scheduled for:</strong> ${new Date(reminder.remind_at).toLocaleString()}</p>
        </div>
        <div class="footer">
          <p>CXO Virtual Assistant</p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(to, `Reminder: ${reminder.title}`, html);
  }
}

export const emailService = new EmailService();
