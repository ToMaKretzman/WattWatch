import webpush from 'web-push';
import nodemailer from 'nodemailer';

interface NotificationPreferences {
  email: boolean;
  webPush: boolean;
  reminderFrequency: 'daily' | 'weekly' | 'monthly';
  highConsumptionThreshold: number;
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  data?: any;
}

class NotificationService {
  private static instance: NotificationService;
  private webPushKeys: { publicKey: string; privateKey: string };
  private emailTransporter: nodemailer.Transporter;

  private constructor() {
    // Web Push Konfiguration
    this.webPushKeys = webpush.generateVAPIDKeys();
    webpush.setVapidDetails(
      'mailto:your-email@example.com',
      this.webPushKeys.publicKey,
      this.webPushKeys.privateKey
    );

    // E-Mail Konfiguration
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async sendWebPushNotification(
    subscription: PushSubscription,
    payload: NotificationPayload
  ): Promise<void> {
    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify(payload)
      );
    } catch (error) {
      console.error('Fehler beim Senden der Web-Push-Benachrichtigung:', error);
      throw error;
    }
  }

  public async sendEmailNotification(
    to: string,
    payload: NotificationPayload
  ): Promise<void> {
    try {
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject: payload.title,
        text: payload.body,
        html: `<h1>${payload.title}</h1><p>${payload.body}</p>`,
      });
    } catch (error) {
      console.error('Fehler beim Senden der E-Mail-Benachrichtigung:', error);
      throw error;
    }
  }

  public async scheduleReadingReminder(
    userId: string,
    preferences: NotificationPreferences
  ): Promise<void> {
    // Implementierung der Erinnerungslogik
    // TODO: Cron-Job oder ähnliches für regelmäßige Erinnerungen
  }

  public async checkHighConsumption(
    userId: string,
    currentConsumption: number,
    preferences: NotificationPreferences
  ): Promise<void> {
    if (currentConsumption > preferences.highConsumptionThreshold) {
      // Benachrichtigung über hohen Verbrauch senden
      const payload: NotificationPayload = {
        title: 'Hoher Verbrauch festgestellt',
        body: `Ihr aktueller Verbrauch von ${currentConsumption} kWh liegt über dem festgelegten Schwellenwert von ${preferences.highConsumptionThreshold} kWh.`,
      };

      // TODO: Benutzereinstellungen abrufen und entsprechende Benachrichtigungen senden
    }
  }

  public getWebPushPublicKey(): string {
    return this.webPushKeys.publicKey;
  }
}

export const notificationService = NotificationService.getInstance(); 