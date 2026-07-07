import { createHash, createHmac } from "node:crypto";
import nodemailer from "nodemailer";
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

export interface SESAccountStatus {
	sandboxMode: boolean;
	max24HourSend: number;
	maxSendRate: number;
	sentLast24Hours: number;
}

export interface EmailAttachment {
	filename: string;
	/** Base64-encoded file contents. */
	content: string;
	contentType?: string;
}

export interface EmailMessage {
	to: string | string[];
	subject: string;
	text: string;
	html?: string;
	cc?: string | string[];
	bcc?: string | string[];
	replyTo?: string;
	headers?: Record<string, string>;
	attachments?: EmailAttachment[];
}

function toArray(value: string | string[]): string[] {
	return Array.isArray(value) ? value : [value];
}

function joinAddresses(value?: string | string[]): string | undefined {
	if (!value) return undefined;
	return toArray(value).join(", ");
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

function sesSigningKey(
	secretKey: string,
	dateStamp: string,
	region: string,
): Buffer {
	const kDate = hmacSha256(`AWS4${secretKey}`, dateStamp);
	const kRegion = hmacSha256(kDate, region);
	const kService = hmacSha256(kRegion, "ses");
	return hmacSha256(kService, "aws4_request");
}

// Builds a raw MIME message so SES can send attachments (the v2 "Simple" content
// type has no attachment support). Bcc is deliberately left out of the headers —
// Destination.BccAddresses handles delivery without exposing the address to other recipients.
function buildRawMimeMessage(
	from: string,
	to: string[],
	message: EmailMessage,
): string {
	const boundaryMixed = `mixed_${Date.now()}_${Math.random().toString(36).slice(2)}`;
	const boundaryAlt = `alt_${Date.now()}_${Math.random().toString(36).slice(2)}`;

	const lines: string[] = [
		`From: ${from}`,
		`To: ${to.join(", ")}`,
		`Subject: ${message.subject}`,
	];
	if (message.replyTo) lines.push(`Reply-To: ${message.replyTo}`);
	if (message.cc) lines.push(`Cc: ${toArray(message.cc).join(", ")}`);
	for (const [name, value] of Object.entries(message.headers ?? {})) {
		lines.push(`${name}: ${value}`);
	}
	lines.push(
		"MIME-Version: 1.0",
		`Content-Type: multipart/mixed; boundary="${boundaryMixed}"`,
		"",
		`--${boundaryMixed}`,
		`Content-Type: multipart/alternative; boundary="${boundaryAlt}"`,
		"",
		`--${boundaryAlt}`,
		'Content-Type: text/plain; charset="UTF-8"',
		"Content-Transfer-Encoding: 7bit",
		"",
		message.text,
	);
	if (message.html) {
		lines.push(
			`--${boundaryAlt}`,
			'Content-Type: text/html; charset="UTF-8"',
			"Content-Transfer-Encoding: 7bit",
			"",
			message.html,
		);
	}
	lines.push(`--${boundaryAlt}--`);

	for (const attachment of message.attachments ?? []) {
		lines.push(
			`--${boundaryMixed}`,
			`Content-Type: ${attachment.contentType ?? "application/octet-stream"}; name="${attachment.filename}"`,
			"Content-Transfer-Encoding: base64",
			`Content-Disposition: attachment; filename="${attachment.filename}"`,
			"",
			attachment.content.replace(/(.{76})/g, "$1\n"),
		);
	}
	lines.push(`--${boundaryMixed}--`, "");

	return Buffer.from(lines.join("\r\n"), "utf8").toString("base64");
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

	// Signs and sends an SES v2 REST API request with AWS Signature V4.
	private async sesRequest(method: "GET" | "POST", path: string, body: string) {
		const {
			sesAccessKeyId,
			sesSecretAccessKey = "",
			sesRegion = "us-east-1",
		} = this.creds;
		const region = sesRegion;
		const host = `email.${region}.amazonaws.com`;

		const now = new Date();
		const amzDate = now
			.toISOString()
			.replace(/[:-]/g, "")
			.replace(/\.\d{3}/, "");
		const dateStamp = amzDate.slice(0, 8);
		const bodyHash = sha256Hex(body);
		const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-amz-date:${amzDate}\n`;
		const signedHeaders = "content-type;host;x-amz-date";
		const canonicalRequest = [
			method,
			path,
			"",
			canonicalHeaders,
			signedHeaders,
			bodyHash,
		].join("\n");
		const credentialScope = `${dateStamp}/${region}/ses/aws4_request`;
		const stringToSign = [
			"AWS4-HMAC-SHA256",
			amzDate,
			credentialScope,
			sha256Hex(canonicalRequest),
		].join("\n");
		const signingKey = sesSigningKey(sesSecretAccessKey, dateStamp, region);
		const signature = createHmac("sha256", signingKey)
			.update(stringToSign, "utf8")
			.digest("hex");
		const authorization = `AWS4-HMAC-SHA256 Credential=${sesAccessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

		return fetch(`https://${host}${path}`, {
			method,
			headers: {
				"Content-Type": "application/json",
				"X-Amz-Date": amzDate,
				Authorization: authorization,
			},
			...(method === "GET" ? {} : { body }),
		});
	}

	// SES-only: sandbox mode and 24h send quota, straight from the same GetAccount
	// call verify() makes — lets a caller check quota before a bulk send instead of
	// discovering it mid-batch as a wall of per-recipient throttling errors.
	async getSESAccountStatus(): Promise<SESAccountStatus> {
		if (this.creds.mailer !== "ses") {
			throw new Error("getSESAccountStatus() is only available for mailer=ses");
		}
		const response = await this.sesRequest("GET", "/v2/email/account", "");
		const body = await response.text();
		if (!response.ok) {
			throw new Error(`SES error (${response.status}): ${body}`);
		}
		const data = JSON.parse(body) as {
			ProductionAccessEnabled?: boolean;
			SendQuota?: {
				Max24HourSend?: number;
				MaxSendRate?: number;
				SentLast24Hours?: number;
			};
		};
		return {
			sandboxMode: data.ProductionAccessEnabled !== true,
			max24HourSend: data.SendQuota?.Max24HourSend ?? 0,
			maxSendRate: data.SendQuota?.MaxSendRate ?? 0,
			sentLast24Hours: data.SendQuota?.SentLast24Hours ?? 0,
		};
	}

	// Verifies credentials. SMTP: opens a connection. SES: signs a GetAccount call
	// (free, read-only). No-op for SendGrid/Mailgun (no free verify endpoint).
	async verify(): Promise<void> {
		if (this.creds.mailer === "smtp") {
			const transporter = this.createSMTPTransporter();
			await transporter.verify();
		} else if (this.creds.mailer === "ses") {
			const response = await this.sesRequest("GET", "/v2/email/account", "");
			if (!response.ok) {
				const error = await response.text();
				throw new Error(`SES error (${response.status}): ${error}`);
			}
		}
	}

	async send(message: EmailMessage): Promise<void> {
		switch (this.creds.mailer) {
			case "smtp":
				return this.sendViaSMTP(message);
			case "sendgrid":
				return this.sendViaSendGrid(message);
			case "mailgun":
				return this.sendViaMailgun(message);
			case "ses":
				return this.sendViaSES(message);
		}
	}

	private async sendViaSMTP(message: EmailMessage) {
		const transporter = this.createSMTPTransporter();
		await transporter.sendMail({
			from: this.fromHeader(),
			to: joinAddresses(message.to),
			cc: joinAddresses(message.cc),
			bcc: joinAddresses(message.bcc),
			replyTo: message.replyTo,
			subject: message.subject,
			text: message.text,
			html: message.html,
			headers: message.headers,
			attachments: message.attachments?.map((attachment) => ({
				filename: attachment.filename,
				content: attachment.content,
				encoding: "base64" as const,
				contentType: attachment.contentType,
			})),
		});
	}

	private async sendViaSendGrid(message: EmailMessage) {
		const recipients = toArray(message.to);
		const ccList = message.cc
			? toArray(message.cc).map((email) => ({ email }))
			: undefined;
		const bccList = message.bcc
			? toArray(message.bcc).map((email) => ({ email }))
			: undefined;
		const personalizations = recipients.map((email) => ({
			to: [{ email }],
			...(ccList ? { cc: ccList } : {}),
			...(bccList ? { bcc: bccList } : {}),
		}));

		const body: Record<string, unknown> = {
			personalizations,
			from: {
				email: this.creds.fromAddress,
				...(this.creds.fromName ? { name: this.creds.fromName } : {}),
			},
			subject: message.subject,
			content: [
				{ type: "text/plain", value: message.text },
				...(message.html ? [{ type: "text/html", value: message.html }] : []),
			],
			...(message.replyTo ? { reply_to: { email: message.replyTo } } : {}),
			...(message.headers ? { headers: message.headers } : {}),
			...(message.attachments
				? {
						attachments: message.attachments.map((attachment) => ({
							content: attachment.content,
							filename: attachment.filename,
							type: attachment.contentType,
							disposition: "attachment",
						})),
					}
				: {}),
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

	private async sendViaMailgun(message: EmailMessage) {
		const { mailgunApiKey, mailgunDomain } = this.creds;
		const formData = new FormData();
		formData.append("from", this.fromHeader());
		formData.append("to", joinAddresses(message.to) ?? "");
		if (message.cc) formData.append("cc", joinAddresses(message.cc) ?? "");
		if (message.bcc) formData.append("bcc", joinAddresses(message.bcc) ?? "");
		if (message.replyTo) formData.append("h:Reply-To", message.replyTo);
		formData.append("subject", message.subject);
		formData.append("text", message.text);
		if (message.html) formData.append("html", message.html);
		for (const [name, value] of Object.entries(message.headers ?? {})) {
			formData.append(`h:${name}`, value);
		}
		for (const attachment of message.attachments ?? []) {
			const buffer = Buffer.from(attachment.content, "base64");
			formData.append(
				"attachment",
				new Blob([buffer], {
					type: attachment.contentType || "application/octet-stream",
				}),
				attachment.filename,
			);
		}

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

	private async sendViaSES(message: EmailMessage) {
		const toAddresses = toArray(message.to);
		const destination: Record<string, unknown> = { ToAddresses: toAddresses };
		if (message.cc) destination.CcAddresses = toArray(message.cc);
		if (message.bcc) destination.BccAddresses = toArray(message.bcc);

		const content = message.attachments?.length
			? {
					Raw: {
						Data: buildRawMimeMessage(this.fromHeader(), toAddresses, message),
					},
				}
			: {
					Simple: {
						Subject: { Data: message.subject, Charset: "UTF-8" },
						Body: {
							Text: { Data: message.text, Charset: "UTF-8" },
							...(message.html
								? { Html: { Data: message.html, Charset: "UTF-8" } }
								: {}),
						},
						...(message.headers
							? {
									Headers: Object.entries(message.headers).map(
										([Name, Value]) => ({
											Name,
											Value,
										}),
									),
								}
							: {}),
					},
				};

		const body = JSON.stringify({
			FromEmailAddress: this.fromHeader(),
			Destination: destination,
			Content: content,
			...(message.replyTo ? { ReplyToAddresses: [message.replyTo] } : {}),
		});

		const response = await this.sesRequest(
			"POST",
			"/v2/email/outbound-emails",
			body,
		);
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
