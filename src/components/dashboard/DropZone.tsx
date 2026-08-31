'use client';

import React, { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { auditFinancialDocument } from '@/lib/gemini';
import { UploadCloud, FileText, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export function DropZone() {
  const { addNewAudit } = useApp();
  const { userProfile } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    const activeModel = userProfile?.preferredModel || 'gemini-3.7-flash';
    toast.loading(`Gemini 3.7 Flash analyzing ${file.name}...`, { id: 'upload-audit' });

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        let auditResult;

        try {
          const res = await fetch('/api/audit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              documentText: `Uploaded file: ${file.name}`,
              filename: file.name,
              mimeType: file.type || 'application/pdf',
              mediaBase64: base64Data,
              preferredModel: activeModel,
            }),
          });
          const contentType = res.headers.get('content-type');
          if (res.ok && contentType && contentType.includes('application/json')) {
            const data = await res.json();
            auditResult = data.audit;
          } else {
            throw new Error('Fallback to client audit');
          }
        } catch (_) {
          auditResult = await auditFinancialDocument(
            `Uploaded file: ${file.name}`,
            base64Data,
            file.type || 'application/pdf',
            activeModel
          );
        }

        addNewAudit(auditResult);
        toast.success(`Audit Complete for ${file.name}!`, {
          id: 'upload-audit',
          description: `Identified $${auditResult.potentialRecoveryAmount.toLocaleString()} in potential recovery/savings.`,
        });
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error(`Upload error: ${err.message}`, { id: 'upload-audit' });
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-[#09090b] border border-black/[0.06] dark:border-white/[0.08] p-5 space-y-3 shadow-xs">
      <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#86868b] flex items-center gap-1.5">
          <UploadCloud className="w-3.5 h-3.5 text-emerald-500" />
          Multimodal Document Dropzone
        </h3>
        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">
          Gemini 3.7 Flash
        </span>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 scale-[1.01]'
            : 'border-black/10 dark:border-white/10 hover:border-emerald-500/60 hover:bg-black/[0.01] dark:hover:bg-white/[0.01]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.csv,.txt"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#1d1d1f] dark:text-white">
              {isUploading ? 'Gemini 3.7 Flash Analyzing Document...' : 'Drop statement, bill, or quote here'}
            </div>
            <div className="text-[11px] text-[#86868b] mt-0.5">
              Supports PDF, PNG, JPG, CSV statements with zero-knowledge 14-day vault encryption
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
