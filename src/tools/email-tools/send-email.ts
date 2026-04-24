import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getEmailService } from "../../services/email-service.js";

const sendEmailParams = z.object({
	to: z.string().email().describe("Recipient email address"),
	subject: z.string().min(1).describe("Email subject line"),
	text: z.string().min(1).describe("Plain-text body of the email"),
	html: z
		.string()
		.optional()
		.describe("Optional HTML body (falls back to text if omitted)"),
});

type SendEmailParams = z.infer<typeof sendEmailParams>;

export const sendEmailTool = {
	name: "EMAIL_SEND",
	description:
		"Send a single email via the configured mail driver (smtp, sendgrid, or mailgun)",
	parameters: sendEmailParams,
	execute: async (params: SendEmailParams) => {
		try {
			await getEmailService().send(
				params.to,
				params.subject,
				params.text,
				params.html,
			);
			return `Email sent successfully to ${params.to}.`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error sending email: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
