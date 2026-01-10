import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { message, history, init, language } = body;

    if (!message && !init) {
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
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    let systemPrompt = "You are a Supportive School Counselor with a 'hacker' aesthetic. ";
    systemPrompt += "Rules: 1) Keep responses short (max 2 sentences). 2) Use all lower-case. 3) Be empathetic but casual. ";

    if (language === 'mandarin') {
      systemPrompt += "4) Speak in casual, culturally adapted Mandarin (Chinese). Be warm and friendly, not robotic. ";
    } else {
      systemPrompt += "4) Speak in casual English. ";
    }

    systemPrompt += "Your Goal: Help a student who is feeling overwhelmed. ";
    systemPrompt += "Strategy: First, validate their feelings. Then, actively ask specific investigating questions (Who, What, Where, When, Why, How) to get details about their situation. Don't be passive. Drill down into the problem while remaining supportive.";

    // Build context from history
    let context = "";
    if (history && Array.isArray(history)) {
      context = history.map(msg => {
        const roleLabel = msg.role === 'user' ? 'Student' : 'Counselor';
        return `${roleLabel}: ${msg.text}`;
      }).join("\n");
    }

    let fullPrompt;
    if (init) {
       fullPrompt = `${systemPrompt}\n\nThe student has just signaled that they are feeling OVERWHELMED. Initiate the conversation now with a supportive opening message that encourages them to open up.\n\nCounselor:`;
    } else {
       fullPrompt = `${systemPrompt}\n\nPrevious conversation:\n${context}\n\nStudent: ${message}\nCounselor:`;
    }

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ reply: text });
  } catch (error) {
    console.error("Error generating content:", error);
    // Return a generic, user-friendly error message to the client
    return NextResponse.json(
      { error: "Counselor currently unavailable." },
      { status: 500 }
    );
  }
}
