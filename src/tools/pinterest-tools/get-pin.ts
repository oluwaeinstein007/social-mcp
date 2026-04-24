import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getPinterestService } from "../../services/pinterest-service.js";

const getPinParams = z.object({
	pinId: z.string().min(1).describe("The ID of the pin to retrieve"),
});

type GetPinParams = z.infer<typeof getPinParams>;

export const getPinTool = {
	name: "PINTEREST_GET_PIN",
	description: "Get details of a specific Pinterest pin by ID",
	parameters: getPinParams,
	execute: async (params: GetPinParams) => {
		try {
			const pin = await getPinterestService().getPin(params.pinId);
			const lines = [
				`Pin ID: ${pin.id}`,
				pin.title ? `Title: ${pin.title}` : null,
				pin.description ? `Description: ${pin.description}` : null,
				pin.link ? `Link: ${pin.link}` : null,
				pin.board_id ? `Board ID: ${pin.board_id}` : null,
				pin.created_at ? `Created: ${pin.created_at}` : null,
			].filter(Boolean);
			return lines.join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error fetching Pinterest pin: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
