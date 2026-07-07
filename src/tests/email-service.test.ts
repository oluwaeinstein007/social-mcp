import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CredentialsError } from "../lib/errors.js";
import { EmailService } from "../services/email-service.js";

const sesCreds = {
	mailer: "ses" as const,
	fromAddress: "sender@example.com",
	sesAccessKeyId: "AKIAEXAMPLE",
	sesSecretAccessKey: "secret",
	sesRegion: "us-east-1",
};

describe("EmailService credential validation", () => {
	it("throws CredentialsError when SES keys are missing", () => {
		expect(
			() =>
				new EmailService({
					mailer: "ses",
					fromAddress: "sender@example.com",
				}),
		).toThrow(CredentialsError);
	});

	it("accepts valid SES credentials", () => {
		expect(() => new EmailService(sesCreds)).not.toThrow();
	});
});

describe("EmailService SES verify()", () => {
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("signs a GET to /v2/email/account and resolves on success", async () => {
		fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
		const service = new EmailService(sesCreds);

		await expect(service.verify()).resolves.toBeUndefined();

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe("https://email.us-east-1.amazonaws.com/v2/email/account");
		expect(init.method).toBe("GET");
		expect(init.body).toBeUndefined();
		expect(init.headers.Authorization).toContain("AWS4-HMAC-SHA256");
		expect(init.headers.Authorization).toContain(sesCreds.sesAccessKeyId);
	});

	it("throws when the credentials are rejected", async () => {
		fetchMock.mockResolvedValue(new Response("access denied", { status: 403 }));
		const service = new EmailService(sesCreds);

		await expect(service.verify()).rejects.toThrow(/SES error \(403\)/);
	});
});

describe("EmailService SES getSESAccountStatus()", () => {
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("reports sandbox mode and quota from GetAccount", async () => {
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({
					ProductionAccessEnabled: false,
					SendQuota: {
						Max24HourSend: 200,
						MaxSendRate: 1,
						SentLast24Hours: 42,
					},
				}),
				{ status: 200 },
			),
		);
		const service = new EmailService(sesCreds);

		await expect(service.getSESAccountStatus()).resolves.toEqual({
			sandboxMode: true,
			max24HourSend: 200,
			maxSendRate: 1,
			sentLast24Hours: 42,
		});
	});

	it("reports production access when enabled", async () => {
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({ ProductionAccessEnabled: true, SendQuota: {} }),
				{ status: 200 },
			),
		);
		const service = new EmailService(sesCreds);

		const status = await service.getSESAccountStatus();
		expect(status.sandboxMode).toBe(false);
	});

	it("rejects for non-SES mailers", async () => {
		const service = new EmailService({
			mailer: "smtp",
			fromAddress: "sender@example.com",
			smtpHost: "smtp.example.com",
			smtpUsername: "user",
			smtpPassword: "pass",
		});
		await expect(service.getSESAccountStatus()).rejects.toThrow(
			/only available for mailer=ses/,
		);
	});
});

describe("EmailService SES send()", () => {
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("uses Simple content with Cc/Bcc/ReplyTo/Headers when there are no attachments", async () => {
		const service = new EmailService(sesCreds);
		await service.send({
			to: "a@example.com",
			cc: "cc@example.com",
			bcc: "bcc@example.com",
			replyTo: "reply@example.com",
			headers: { "X-Campaign-Id": "42" },
			subject: "Hi",
			text: "Hello",
			html: "<p>Hello</p>",
		});

		const [, init] = fetchMock.mock.calls[0];
		const body = JSON.parse(init.body);
		expect(body.Destination).toEqual({
			ToAddresses: ["a@example.com"],
			CcAddresses: ["cc@example.com"],
			BccAddresses: ["bcc@example.com"],
		});
		expect(body.ReplyToAddresses).toEqual(["reply@example.com"]);
		expect(body.Content.Simple.Headers).toEqual([
			{ Name: "X-Campaign-Id", Value: "42" },
		]);
		expect(body.Content.Raw).toBeUndefined();
	});

	it("switches to Raw MIME content when attachments are present, without leaking Bcc into headers", async () => {
		const service = new EmailService(sesCreds);
		await service.send({
			to: "a@example.com",
			bcc: "bcc@example.com",
			subject: "Hi",
			text: "Hello",
			attachments: [
				{
					filename: "note.txt",
					content: Buffer.from("hello world").toString("base64"),
					contentType: "text/plain",
				},
			],
		});

		const [, init] = fetchMock.mock.calls[0];
		const body = JSON.parse(init.body);
		expect(body.Content.Simple).toBeUndefined();
		expect(body.Destination.BccAddresses).toEqual(["bcc@example.com"]);

		const raw = Buffer.from(body.Content.Raw.Data, "base64").toString("utf8");
		expect(raw).toContain('filename="note.txt"');
		expect(raw).toContain("Content-Disposition: attachment");
		expect(raw).not.toContain("bcc@example.com");
	});
});
