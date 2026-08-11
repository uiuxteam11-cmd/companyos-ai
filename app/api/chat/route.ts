import { google } from '@ai-sdk/google';
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from 'ai';
import { maskPII } from '@/lib/security';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No messages provided' }), { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    const lastUserText =
      lastMessage && lastMessage.role === 'user'
        ? lastMessage.parts
            .filter((part) => part.type === 'text')
            .map((part) => part.text)
            .join(' ')
        : '';

    const { maskedText } = maskPII(lastUserText);

    const sanitizedMessages = messages.map((message, index) => {
      if (index !== messages.length - 1 || message.role !== 'user') {
        return message;
      }

      return {
        ...message,
        parts: message.parts.map((part) =>
          part.type === 'text' ? { ...part, text: maskedText } : part,
        ),
      };
    });

    const isComplex =
      maskedText.length > 200 || /legal|contract|analyze|forecast/.test(maskedText.toLowerCase());
    const modelToUse = isComplex ? 'gemini-1.5-pro' : 'gemini-1.5-flash';

    const result = streamText({
      model: google(modelToUse),
      messages: await convertToModelMessages(sanitizedMessages),
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({ stream: result.stream }),
    });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
