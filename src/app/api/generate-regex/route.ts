import { z } from "zod";
import { GeneratorFormResponse } from "@/models";
import { generateRegexWithAIUseCase } from "@/use-cases/use-cases";

export const runtime = "edge";

const formDataSchema = z.object({
  description: z.string().refine((val) => val.trim() !== "", {
    message: "Description cannot be empty or spaces only",
  }),
  shouldMatch: z
    .string()
    .refine((val) => val.trim() !== "", {
      message: "Should Match examples cannot be empty spaces",
    })
    .transform((val) => val.split(",")),
  shouldNotMatch: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(",") : [])),
  info: z
    .string()
    .optional()
    .refine((val) => !val || val.trim() !== "", {
      message: "Info cannot be empty spaces",
    }),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();

    const data = {
      description: formData.get("description") as string,
      shouldMatch: formData.get("shouldMatch") as string,
      shouldNotMatch: formData.get("shouldNotMatch") as string,
      info: formData.get("info") as string,
    };

    const validatedData = formDataSchema.parse(data);

    const result = await generateRegexWithAIUseCase({
      description: validatedData.description,
      shouldMatch: validatedData.shouldMatch,
      shouldNotMatch: validatedData.shouldNotMatch,
      info: validatedData.info,
    });

    return Response.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const response: GeneratorFormResponse = {
        success: false,
        errors: error.errors.map((e) => `${e.message}`),
      };
      return Response.json(response);
    } else {
      const response: GeneratorFormResponse = {
        success: false,
        errors: ["Something went wrong"],
      };
      return Response.json(response);
    }
  }
}
