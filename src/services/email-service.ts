import nodemailer from "nodemailer";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";

export class EmailService {
	private mailer: string;

	constructor() {
		const { mailer, fromAddress, smtp, sendgrid, mailgun } = config.email;

		if (!fromAddress) {
			throw new CredentialsError("Email", ["MAIL_FROM_ADDRESS", "MAIL_MAILER"]);
		}

		this.mailer = mailer;

		if (mailer === "smtp") {
			if (!smtp.host || !smtp.username || !smtp.password) {
				throw new CredentialsError("Email (SMTP)", [
					"MAIL_HOST",
					"MAIL_USERNAME",
					"MAIL_PASSWORD",
				]);
			}
		} else if (mailer === "sendgrid") {
			if (!sendgrid.apiKey) {
				throw new CredentialsError("Email (SendGrid)", ["SENDGRID_API_KEY"]);
			}
		} else if (mailer === "mailgun") {
			if (!mailgun.apiKey || !mailgun.domain) {
				throw new CredentialsError("Email (Mailgun)", [
					"MAILGUN_API_KEY",
					"MAILGUN_DOMAIN",
				]);
			}
		} else {
			throw new Error(
				`Unsupported MAIL_MAILER: "${mailer}". Supported values: smtp, sendgrid, mailgun`,
			);
		}
	}

	async send(
		to: string | string[],
		subject: string,
		text: string,
		html?: string,
	): Promise<void> {
		switch (this.mailer) {
			case "smtp":
				return this.sendViaSMTP(to, subject, text, html);
			case "sendgrid":
				return this.sendViaSendGrid(to, subject, text, html);
			case "mailgun":
				return this.sendViaMailgun(to, subject, text, html);
		}
	}

	private fromHeader(): string {
		const { fromName, fromAddress } = config.email;
		return fromName ? `"${fromName}" <${fromAddress}>` : fromAddress;
	}

	private async sendViaSMTP(
		to: string | string[],
		subject: string,
		text: string,
		html?: string,
	) {
		const { host, port, username, password, encryption } = config.email.smtp;

		const transporter = nodemailer.createTransport({
			host,
			port,
			secure: encryption === "ssl",
			requireTLS: encryption === "tls",
			auth: { user: username, pass: password },
		});

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
				email: config.email.fromAddress,
				...(config.email.fromName ? { name: config.email.fromName } : {}),
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
				Authorization: `Bearer ${config.email.sendgrid.apiKey}`,
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
		const { apiKey, domain } = config.email.mailgun;
		const formData = new FormData();
		formData.append("from", this.fromHeader());
		formData.append("to", Array.isArray(to) ? to.join(",") : to);
		formData.append("subject", subject);
		formData.append("text", text);
		if (html) formData.append("html", html);

		const credentials = Buffer.from(`api:${apiKey}`).toString("base64");
		const response = await fetch(
			`https://api.mailgun.net/v3/${domain}/messages`,
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

let _instance: EmailService | undefined;
export function getEmailService(): EmailService {
	if (!_instance) _instance = new EmailService();
	return _instance;
}
