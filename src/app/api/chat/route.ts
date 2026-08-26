import { NextRequest, NextResponse } from 'next/server';
import { generateChatResponse } from '@/lib/gemini';
import { retrieveRelevantKnowledge, indexNewDocument } from '@/lib/rag';
import { ChatMessage, MediaAttachment } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      messages,
      activeAudit,
      attachments,
      preferredModel,
    }: {
      messages: ChatMessage[];
      activeAudit?: any;
      attachments?: MediaAttachment[];
      preferredModel?: string;
    } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];

    // Check if user attached new media/file to index
    if (attachments && attachments.length > 0) {
      attachments.forEach((att) => {
        indexNewDocument(`Attached Document: ${att.name}`, `User attached ${att.type} file: ${att.name}`, 'past_invoice');
      });
    }

    // Retrieve relevant statutory & historical RAG context
    const ragSources = retrieveRelevantKnowledge(lastMessage.content, activeAudit?.category);

    const { text, auditGenerated } = await generateChatResponse(
      messages,
      ragSources,
      activeAudit,
      preferredModel || 'gemini-3.1-flash-lite'
    );

    return NextResponse.json({
      success: true,
      text,
      ragSources,
      auditGenerated,
    });
  } catch (error: any) {
    console.error('[API /chat] Error:', error);
    return NextResponse.json({ error: error.message || 'Chat generation failed' }, { status: 500 });
  }
}
