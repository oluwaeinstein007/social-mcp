import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getEmailService } from "../../services/email-service.js";

const sendBulkEmailParams = z.object({
	recipients: z
		.array(z.string().email())
		.min(1)
		.describe("List of recipient email addresses"),
	subject: z.string().min(1).describe("Email subject line"),
	text: z.string().min(1).describe("Plain-text body of the email"),
	html: z
		.string()
		.optional()
		.describe("Optional HTML body (falls back to text if omitted)"),
});

type SendBulkEmailParams = z.infer<typeof sendBulkEmailParams>;

export const sendBulkEmailTool = {
	name: "EMAIL_SEND_BULK",
	description:
		"Send the same email to multiple recipients via the configured mail driver (smtp, sendgrid, or mailgun)",
	parameters: sendBulkEmailParams,
	execute: async (params: SendBulkEmailParams) => {
		try {
			await getEmailService().send(
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
