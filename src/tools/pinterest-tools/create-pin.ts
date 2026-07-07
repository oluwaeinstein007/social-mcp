import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getPinterestService } from "../../services/pinterest-service.js";

const createPinParams = z.object({
	boardId: z.string().min(1).describe("The ID of the board to pin to"),
	title: z.string().min(1).describe("The title of the pin"),
	description: z.string().describe("The description of the pin"),
	image: z
		.string()
		.describe("A publicly accessible image URL, or base64-encoded image bytes"),
	imageContentType: z
		.string()
		.optional()
		.describe(
			"MIME type, required when `image` is base64-encoded bytes, e.g. image/jpeg",
		),
	link: z
		.string()
		.url()
		.optional()
		.describe("Destination URL when the pin is clicked"),
});

type CreatePinParams = z.infer<typeof createPinParams>;

export const createPinTool = {
	name: "PINTEREST_CREATE_PIN",
	description: "Create a new pin on a Pinterest board",
	parameters: createPinParams,
	execute: async (params: CreatePinParams) => {
		try {
			const pin = await getPinterestService().createPin(
				params.boardId,
				params.title,
				params.description,
				params.link ?? "",
				{ image: params.image, contentType: params.imageContentType },
			);
			return `Pin created successfully!\n\nPin ID: ${pin.id}\nTitle: ${pin.title ?? params.title}${pin.link ? `\nLink: ${pin.link}` : ""}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error creating Pinterest pin: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
