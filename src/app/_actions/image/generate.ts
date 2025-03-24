"use server";

import { env } from "@/env";
import Together from "together-ai";
import { db } from "@/server/db";
import { auth } from "@/server/auth";

const together = new Together({ apiKey: env.TOGETHER_AI_API_KEY });

export type ImageModelList =
  | "black-forest-labs/FLUX1.1-pro"
  | "black-forest-labs/FLUX.1-schnell"
  | "black-forest-labs/FLUX.1-schnell-Free"
  | "black-forest-labs/FLUX.1-pro"
  | "black-forest-labs/FLUX.1-dev";

export async function generateImageAction(
  prompt: string,
  model: ImageModelList = "black-forest-labs/FLUX.1-schnell-Free"
) {
  // TODO Impelement next-auth
  // Get the current session
  const session = await auth();

  // Check if user is authenticated
  if (!session?.user?.id) {
    throw new Error("You must be logged in to generate images");
  }

  try {
    console.log(`Generating image with model: ${model}`);

    // Generate the image using Together AI
    const response = (await together.images.create({
      model: model,
      prompt: prompt,
      width: 1024,
      height: 768,
      steps: model.includes("schnell") ? 4 : 28, // Fewer steps for schnell models
      n: 1,
    })) as unknown as {
      id: string;
      model: string;
      object: string;
      data: {
        url: string;
      }[];
    };

    const imageUrl = response.data[0]?.url;

    if (!imageUrl) {
      throw new Error("Failed to generate image");
    }

    console.log(`Generated image URL: ${imageUrl}`);

    // Store in database
    const generatedImage = await db.generatedImage.create({
      data: {
        url: imageUrl,
        prompt: prompt,
        userId: session.user.id,
      },
    });

    return {
      success: true,
      image: generatedImage,
    };
  } catch (error) {
    console.error("Error generating image:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate image",
    };
  }
}
