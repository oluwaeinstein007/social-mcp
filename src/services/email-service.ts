import nodemailer from "nodemailer";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";

export interface EmailCredentials {
	mailer: "smtp" | "sendgrid" | "mailgun";
	fromAddress: string;
	fromName?: string;
	smtpHost?: string;
	smtpPort?: number;
	smtpUsername?: string;
	smtpPassword?: string;
	smtpEncryption?: "tls" | "ssl" | "none";
	sendgridApiKey?: string;
	mailgunApiKey?: string;
	mailgunDomain?: string;
}

function credentialsFromConfig(): EmailCredentials {
	const { mailer, fromAddress, fromName, smtp, sendgrid, mailgun } =
		config.email;
	return {
		mailer: mailer as "smtp" | "sendgrid" | "mailgun",
		fromAddress,
		fromName: fromName || undefined,
		smtpHost: smtp.host,
		smtpPort: smtp.port,
		smtpUsername: smtp.username,
		smtpPassword: smtp.password,
		smtpEncryption: smtp.encryption,
		sendgridApiKey: sendgrid.apiKey || undefined,
		mailgunApiKey: mailgun.apiKey || undefined,
		mailgunDomain: mailgun.domain || undefined,
	};
}

export class EmailService {
	private creds: EmailCredentials;

	constructor(credentials?: EmailCredentials) {
		this.creds = credentials ?? credentialsFromConfig();
		this.validateCredentials();
	}

	private validateCredentials() {
		const {
			mailer,
			fromAddress,
			smtpHost,
			smtpUsername,
			smtpPassword,
			sendgridApiKey,
			mailgunApiKey,
			mailgunDomain,
		} = this.creds;

		if (!fromAddress) {
			throw new CredentialsError("Email", ["MAIL_FROM_ADDRESS"]);
		}

		if (mailer === "smtp") {
			if (!smtpHost || !smtpUsername || !smtpPassword) {
				throw new CredentialsError("Email (SMTP)", [
					"MAIL_HOST",
					"MAIL_USERNAME",
					"MAIL_PASSWORD",
				]);
			}
		} else if (mailer === "sendgrid") {
			if (!sendgridApiKey) {
				throw new CredentialsError("Email (SendGrid)", ["SENDGRID_API_KEY"]);
			}
		} else if (mailer === "mailgun") {
			if (!mailgunApiKey || !mailgunDomain) {
				throw new CredentialsError("Email (Mailgun)", [
					"MAILGUN_API_KEY",
					"MAILGUN_DOMAIN",
				]);
			}
		} else {
			throw new Error(
				`Unsupported mailer: "${mailer}". Supported: smtp, sendgrid, mailgun`,
			);
		}
	}

	private fromHeader(): string {
		const { fromName, fromAddress } = this.creds;
		return fromName ? `"${fromName}" <${fromAddress}>` : fromAddress;
	}

	private createSMTPTransporter() {
		const { smtpHost, smtpPort, smtpUsername, smtpPassword, smtpEncryption } =
			this.creds;
		return nodemailer.createTransport({
			host: smtpHost,
			port: smtpPort ?? 587,
			secure: smtpEncryption === "ssl",
			requireTLS: smtpEncryption !== "ssl" && smtpEncryption !== "none",
			auth: { user: smtpUsername, pass: smtpPassword },
		});
	}

	// Verifies the SMTP connection. No-op for SendGrid/Mailgun (no free verify endpoint).
	async verify(): Promise<void> {
		if (this.creds.mailer === "smtp") {
			const transporter = this.createSMTPTransporter();
			await transporter.verify();
		}
	}

	async send(
		to: string | string[],
		subject: string,
		text: string,
		html?: string,
	): Promise<void> {
		switch (this.creds.mailer) {
			case "smtp":
				return this.sendViaSMTP(to, subject, text, html);
			case "sendgrid":
				return this.sendViaSendGrid(to, subject, text, html);
			case "mailgun":
				return this.sendViaMailgun(to, subject, text, html);
		}
	}

	private async sendViaSMTP(
		to: string | string[],
		subject: string,
		text: string,
		html?: string,
	) {
		const transporter = this.createSMTPTransporter();
		await transporter.sendMail({
			from: this.fromHeader(),
			to: Array.isArray(to) ? to.join(", ") : to,
			subject,
			text,
			html,
		});
	}

	private async sendViaSendGrid(
		to: string | string[],
		subject: string,
		text: string,
		html?: string,
	) {
		const recipients = Array.isArray(to) ? to : [to];
		const personalizations = recipients.map((email) => ({
			to: [{ email }],
		}));

		const body: Record<string, unknown> = {
			personalizations,
			from: {
				email: this.creds.fromAddress,
				...(this.creds.fromName ? { name: this.creds.fromName } : {}),
			},
			subject,
			content: [
				{ type: "text/plain", value: text },
				...(html ? [{ type: "text/html", value: html }] : []),
			],
		};

		const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.creds.sendgridApiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`SendGrid error (${response.status}): ${error}`);
		}
	}

	private async sendViaMailgun(
		to: string | string[],
		subject: string,
		text: string,
		html?: string,
	) {
		const { mailgunApiKey, mailgunDomain } = this.creds;
		const formData = new FormData();
		formData.append("from", this.fromHeader());
		formData.append("to", Array.isArray(to) ? to.join(",") : to);
		formData.append("subject", subject);
		formData.append("text", text);
		if (html) formData.append("html", html);

		const credentials = Buffer.from(`api:${mailgunApiKey}`).toString("base64");
		const response = await fetch(
			`https://api.mailgun.net/v3/${mailgunDomain}/messages`,
			{
				method: "POST",
				headers: { Authorization: `Basic ${credentials}` },
				body: formData,
			},
		);

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Mailgun error (${response.status}): ${error}`);
		}
	}
}

// Singleton for the env-var-based default configuration.
// When calling tools with per-org credentials, pass an EmailCredentials
// object directly to `new EmailService(credentials)` instead.
let _instance: EmailService | undefined;
export function getEmailService(): EmailService {
	if (!_instance) _instance = new EmailService();
	return _instance;
}
