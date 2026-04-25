import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import {
	EmailService,
	getEmailService,
} from "../../services/email-service.js";

const sendBulkEmailParams = z.object({
	// ── Inline credentials (all optional — omit to use env var config) ──────
	mailer: z
		.enum(["smtp", "sendgrid", "mailgun"])
		.optional()
		.describe(
			"Mail driver. Required when not configured via env vars (MAIL_MAILER).",
		),
	fromAddress: z
		.string()
		.email()
		.optional()
		.describe("Sender email address. Required when passing inline credentials."),
	fromName: z.string().optional().describe("Sender display name."),
	// SMTP
	smtpHost: z
		.string()
		.optional()
		.describe("SMTP server hostname. Required when mailer=smtp."),
	smtpPort: z
		.number()
		.optional()
		.describe("SMTP port (default 587). Used when mailer=smtp."),
	smtpUsername: z
		.string()
		.optional()
		.describe("SMTP auth username. Required when mailer=smtp."),
	smtpPassword: z
		.string()
		.optional()
		.describe("SMTP auth password. Required when mailer=smtp."),
	smtpEncryption: z
		.enum(["tls", "ssl", "none"])
		.optional()
		.describe("SMTP encryption (default tls). Used when mailer=smtp."),
	// SendGrid
	sendgridApiKey: z
		.string()
		.optional()
		.describe("SendGrid API key. Required when mailer=sendgrid."),
	// Mailgun
	mailgunApiKey: z
		.string()
		.optional()
		.describe("Mailgun API key. Required when mailer=mailgun."),
	mailgunDomain: z
		.string()
		.optional()
		.describe("Mailgun sending domain. Required when mailer=mailgun."),

	// ── Message ──────────────────────────────────────────────────────────────
	recipients: z
		.array(z.string().email())
		.min(1)
		.describe("List of recipient email addresses."),
	subject: z.string().min(1).describe("Email subject line."),
	text: z.string().min(1).describe("Plain-text body of the email."),
	html: z
		.string()
		.optional()
		.describe("Optional HTML body. Falls back to text if omitted."),
});

type SendBulkEmailParams = z.infer<typeof sendBulkEmailParams>;

export const sendBulkEmailTool = {
	name: "EMAIL_SEND_BULK",
	description:
		"Send the same email to multiple recipients. Credentials can be passed inline per call (for per-org or per-user accounts) or omitted to use the server's env var configuration.",
	parameters: sendBulkEmailParams,
	execute: async (params: SendBulkEmailParams) => {
		try {
			const service =
				params.mailer && params.fromAddress
					? new EmailService({
							mailer: params.mailer,
							fromAddress: params.fromAddress,
							fromName: params.fromName,
							smtpHost: params.smtpHost,
							smtpPort: params.smtpPort,
							smtpUsername: params.smtpUsername,
							smtpPassword: params.smtpPassword,
							smtpEncryption: params.smtpEncryption,
							sendgridApiKey: params.sendgridApiKey,
							mailgunApiKey: params.mailgunApiKey,
							mailgunDomain: params.mailgunDomain,
						})
					: getEmailService();

			await service.send(
				params.recipients,
				params.subject,
				params.text,
				params.html,
			);
			return `Email sent successfully to ${params.recipients.length} recipient(s): ${params.recipients.join(", ")}.`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error sending bulk email: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
