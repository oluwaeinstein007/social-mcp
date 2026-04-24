import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getPinterestService } from "../../services/pinterest-service.js";

const createPinParams = z.object({
	boardId: z.string().min(1).describe("The ID of the board to pin to"),
	title: z.string().min(1).describe("The title of the pin"),
	description: z.string().describe("The description of the pin"),
	imageUrl: z.string().url().describe("Publicly accessible URL of the image"),
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
				params.imageUrl,
			);
			return `Pin created successfully!\n\nPin ID: ${pin.id}\nTitle: ${pin.title ?? params.title}${pin.link ? `\nLink: ${pin.link}` : ""}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error creating Pinterest pin: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
