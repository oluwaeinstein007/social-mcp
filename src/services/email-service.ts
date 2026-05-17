import nodemailer from "nodemailer";
import { createHash, createHmac } from "crypto";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";

export interface EmailCredentials {
	mailer: "smtp" | "sendgrid" | "mailgun" | "ses";
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
	sesAccessKeyId?: string;
	sesSecretAccessKey?: string;
	sesRegion?: string;
}

function credentialsFromConfig(): EmailCredentials {
	const { mailer, fromAddress, fromName, smtp, sendgrid, mailgun, ses } =
		config.email;
	return {
		mailer: mailer as "smtp" | "sendgrid" | "mailgun" | "ses",
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
		sesAccessKeyId: ses.accessKeyId || undefined,
		sesSecretAccessKey: ses.secretAccessKey || undefined,
		sesRegion: ses.region || undefined,
	};
}

// ── AWS Sig V4 helpers ────────────────────────────────────────────────────────

function sha256Hex(data: string): string {
	return createHash("sha256").update(data, "utf8").digest("hex");
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
	return createHmac("sha256", key).update(data, "utf8").digest();
}

function sesSigningKey(secretKey: string, dateStamp: string, region: string): Buffer {
	const kDate = hmacSha256(`AWS4${secretKey}`, dateStamp);
	const kRegion = hmacSha256(kDate, region);
	const kService = hmacSha256(kRegion, "ses");
	return hmacSha256(kService, "aws4_request");
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
			sesAccessKeyId,
			sesSecretAccessKey,
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
		} else if (mailer === "ses") {
			if (!sesAccessKeyId || !sesSecretAccessKey) {
				throw new CredentialsError("Email (Amazon SES)", [
					"SES_ACCESS_KEY_ID",
					"SES_SECRET_ACCESS_KEY",
				]);
			}
		} else {
			throw new Error(
				`Unsupported mailer: "${mailer}". Supported: smtp, sendgrid, mailgun, ses`,
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

	// Verifies the SMTP connection. No-op for SendGrid/Mailgun/SES (no free verify endpoint).
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
			case "ses":
				return this.sendViaSES(to, subject, text, html);
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

	private async sendViaSES(
		to: string | string[],
		subject: string,
		text: string,
		html?: string,
	) {
		const { sesAccessKeyId, sesSecretAccessKey = "", sesRegion = "us-east-1", fromAddress, fromName } = this.creds;
		const region = sesRegion;
		const host = `email.${region}.amazonaws.com`;
		const path = "/v2/email/outbound-emails";

		const toAddresses = Array.isArray(to) ? to : [to];
		const body = JSON.stringify({
			FromEmailAddress: fromName ? `"${fromName}" <${fromAddress}>` : fromAddress,
			Destination: { ToAddresses: toAddresses },
			Content: {
				Simple: {
					Subject: { Data: subject, Charset: "UTF-8" },
					Body: {
						Text: { Data: text, Charset: "UTF-8" },
						...(html ? { Html: { Data: html, Charset: "UTF-8" } } : {}),
					},
				},
			},
		});

		const now = new Date();
		const amzDate = now.toISOString().replace(/[:-]/g, "").replace(/\.\d{3}/, "");
		const dateStamp = amzDate.slice(0, 8);
		const bodyHash = sha256Hex(body);
		const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-amz-date:${amzDate}\n`;
		const signedHeaders = "content-type;host;x-amz-date";
		const canonicalRequest = ["POST", path, "", canonicalHeaders, signedHeaders, bodyHash].join("\n");
		const credentialScope = `${dateStamp}/${region}/ses/aws4_request`;
		const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256Hex(canonicalRequest)].join("\n");
		const signingKey = sesSigningKey(sesSecretAccessKey, dateStamp, region);
		const signature = createHmac("sha256", signingKey).update(stringToSign, "utf8").digest("hex");
		const authorization = `AWS4-HMAC-SHA256 Credential=${sesAccessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

		const response = await fetch(`https://${host}${path}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Amz-Date": amzDate,
				Authorization: authorization,
			},
			body,
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`SES error (${response.status}): ${error}`);
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
