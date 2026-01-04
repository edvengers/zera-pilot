import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_GEMINI_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GOOGLE_GEMINI_KEY is not set" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const systemPrompt =
      "You are a Supportive School Counselor. Keep responses short (max 2 sentences), empathetic, and lower-case (to match the 'hacker' aesthetic).";

    const fullPrompt = `${systemPrompt}\n\nUser message: ${message}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ reply: text });
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
