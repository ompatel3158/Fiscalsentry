import { NextRequest, NextResponse } from 'next/server';
import { ActionItemPayload } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action }: { action: ActionItemPayload } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action payload required' }, { status: 400 });
    }

    const executedAt = new Date().toISOString();
    let resultData: Record<string, any> = {};

    switch (action.type) {
      case 'google_calendar':
        resultData = {
          service: 'Google Calendar API',
          eventId: 'gcal_evt_' + Math.random().toString(36).substring(2, 9),
          eventSummary: action.payload.summary || action.title,
          scheduledDate: action.deadlineDate || action.payload.date || '2026-09-15',
          status: 'CONFIRMED',
          link: 'https://calendar.google.com/calendar/r',
        };
        break;

      case 'google_tasks':
        resultData = {
          service: 'Google Tasks API',
          taskId: 'gtask_' + Math.random().toString(36).substring(2, 9),
          title: action.payload.title || action.title,
          notes: action.payload.notes || action.description,
          due: action.payload.due || '2026-08-30',
          status: 'ACTIVE',
        };
        break;

      case 'google_sheets':
        resultData = {
          service: 'Google Sheets API',
          spreadsheetId: 'sheet_' + Math.random().toString(36).substring(2, 9),
          sheetName: action.payload.sheetName || 'Financial Ledger',
          rowAppended: action.payload.rowValues || ['2026-08-24', action.title, 'DISPUTED'],
          updatedRange: 'Sheet1!A12:G12',
        };
        break;

      case 'google_drive':
        resultData = {
          service: 'Google Drive API',
          folderId: 'gdrive_fld_' + Math.random().toString(36).substring(2, 9),
          folderPath: action.payload.folderPath || '/FiscalSentry/Disputes/',
          permission: 'restricted_secure',
        };
        break;

      case 'gmail':
        resultData = {
          service: 'Gmail API',
          draftId: 'draft_' + Math.random().toString(36).substring(2, 9),
          to: action.payload.to || 'billing-disputes@provider.example',
          subject: action.payload.subject || action.title,
          status: 'DRAFT_CREATED',
        };
        break;

      case 'slack':
        resultData = {
          service: 'Slack Webhook & Bot',
          channel: action.payload.channel || '#financial-defense',
          messageTs: Date.now().toString(),
          interactiveButtons: ['Approve Settlement', 'Request Hospital Hearing'],
          status: 'DELIVERED',
        };
        break;

      case 'discord':
        resultData = {
          service: 'Discord Webhook',
          channel: action.payload.channel || 'financial-alerts',
          embedTitle: action.title,
          color: 0x10b981,
          status: 'DELIVERED',
        };
        break;

      case 'custom_webhook':
        resultData = {
          service: 'External ERP / Custom REST Webhook',
          endpoint: action.payload.endpoint || 'https://api.erp.example/accounting/v1/invoices',
          httpStatus: 200,
          responseBody: { success: true, transactionId: 'TXN-' + Math.random().toString(36).substring(2, 8).toUpperCase() },
        };
        break;

      case 'pdf_dispute':
      case 'pdf_po':
      case 'pdf_grant':
        resultData = {
          service: 'FiscalSentry PDF Engine',
          documentType: action.type,
          generatedFilename: `${action.type.replace('_', '-')}-${Date.now()}.pdf`,
          certifiedTimestamp: executedAt,
          status: 'READY_FOR_DOWNLOAD',
        };
        break;

      default:
        resultData = {
          service: 'Action Dispatcher',
          status: 'SUCCESS',
          details: action.payload,
        };
    }

    return NextResponse.json({
      success: true,
      actionId: action.id,
      status: 'completed',
      executedAt,
      resultData,
    });
  } catch (error: any) {
    console.error('[API /actions/execute] Error:', error);
    return NextResponse.json({ error: error.message || 'Action execution failed' }, { status: 500 });
  }
}
