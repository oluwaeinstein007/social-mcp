import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getPinterestService } from "../../services/pinterest-service.js";

const deletePinParams = z.object({
	pinId: z.string().min(1).describe("The ID of the pin to delete"),
});

type DeletePinParams = z.infer<typeof deletePinParams>;

export const deletePinTool = {
	name: "PINTEREST_DELETE_PIN",
	description: "Delete a Pinterest pin by ID",
	parameters: deletePinParams,
	execute: async (params: DeletePinParams) => {
		try {
			await getPinterestService().deletePin(params.pinId);
			return `Pin ${params.pinId} deleted successfully.`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error deleting Pinterest pin: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
