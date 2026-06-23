'use client';

import { useEffect, useRef, useState } from 'react';
import type { FeedGroup } from '@/lib/types';
import type { ComposerAttachment } from '@/lib/composer-attachments';
import { createFileAttachment } from '@/lib/composer-attachments';
import { parseMediaUrl } from '@/lib/parse-media-url';
import { GroupChip } from './GroupChip';
import { AttachmentPreview } from './AttachmentPreview';

type Props = {
  userInitials: string;
  groups: FeedGroup[];
  fixedGroupId?: string | null;
  onSubmit: (body: string, groupIds: string[], attachments: ComposerAttachment[]) => Promise<void>;
};

export function PostComposer({ userInitials, groups, fixedGroupId, onSubmit }: Props) {
  const [body, setBody] = useState('');
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(fixedGroupId ? [fixedGroupId] : []),
  );
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [showLinkRow, setShowLinkRow] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const targetGroupIds = fixedGroupId ? [fixedGroupId] : Array.from(selected);
  const fixedGroup = fixedGroupId ? groups.find(g => g.id === fixedGroupId) : null;

  useEffect(() => {
    if (fixedGroupId) {
      setSelected(new Set([fixedGroupId]));
    }
  }, [fixedGroupId]);

  function toggleGroup(id: string) {
    if (fixedGroupId) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const next = [...attachments];
    Array.from(files).forEach(file => {
      next.push(createFileAttachment(file));
    });
    setAttachments(next);
  }

  function addLink() {
    const parsed = parseMediaUrl(linkUrl);
    if (!parsed) {
      setMessage('Paste a valid link (YouTube, Vimeo, Spotify, Apple Music, or any URL).');
      setTimeout(() => setMessage(''), 4000);
      return;
    }
    setAttachments(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        kind: 'url',
        attachmentType: parsed.attachmentType,
        url: parsed.url,
        metadata: parsed.metadata,
        label:
          parsed.attachmentType === 'embed'
            ? `${parsed.metadata.source === 'vimeo' ? 'Vimeo' : 'YouTube'} video`
            : parsed.attachmentType === 'music'
              ? `${parsed.metadata.source === 'spotify' ? 'Spotify' : 'Apple Music'} link`
              : (parsed.metadata.domain as string) || 'Link',
      },
    ]);
    setLinkUrl('');
    setShowLinkRow(false);
  }

  function removeAttachment(id: string) {
    setAttachments(prev => {
      const removed = prev.find(a => a.id === id);
      if (removed?.kind === 'file' && removed.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return prev.filter(a => a.id !== id);
    });
  }

  async function handleSubmit() {
    const hasContent = body.trim().length > 0 || attachments.length > 0;
    if (!hasContent || targetGroupIds.length === 0) return;
    setSubmitting(true);
    setMessage('');
    try {
      await onSubmit(body.trim(), targetGroupIds, attachments);
      attachments.forEach(att => {
        if (att.kind === 'file' && att.previewUrl) URL.revokeObjectURL(att.previewUrl);
      });
      setBody('');
      setAttachments([]);
      setShowLinkRow(false);
      setLinkUrl('');
      setSelected(fixedGroupId ? new Set([fixedGroupId]) : new Set());
      setMessage('Submitted for review — your group admin will see it shortly.');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not submit post');
    } finally {
      setSubmitting(false);
    }
  }

  const hasContent = body.trim().length > 0 || attachments.length > 0;
  const canSubmit = hasContent && targetGroupIds.length > 0 && !submitting;

  return (
    <div className="bg-white border border-line rounded-xl p-4 mb-4">
      <div className="flex gap-3">
        <div className="w-[38px] h-[38px] rounded-full bg-accent-soft text-accent font-semibold text-[13px] flex items-center justify-center shrink-0">
          {userInitials}
        </div>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Say something with your group(s)…"
          rows={2}
          className="flex-1 border-0 bg-transparent focus:outline-none resize-none text-sm leading-relaxed placeholder:text-ink-muted min-h-[22px]"
        />
      </div>

      <AttachmentPreview attachments={attachments} onRemove={removeAttachment} />

      {showLinkRow && (
        <div className="flex flex-wrap items-center gap-2 ml-[50px] mt-2 mb-3 p-2 border border-accent bg-accent-soft rounded-md">
          <span className="text-[11px] font-medium text-accent whitespace-nowrap">Paste a link:</span>
          <input
            type="url"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addLink();
              }
            }}
            placeholder="YouTube, Vimeo, Spotify, Apple Music, or any URL…"
            className="flex-1 min-w-[180px] text-xs border border-line rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={addLink}
            className="text-xs font-medium bg-accent text-white px-3 py-1.5 rounded-md hover:bg-accent-hover"
          >
            Attach
          </button>
          <button
            type="button"
            onClick={() => {
              setShowLinkRow(false);
              setLinkUrl('');
            }}
            className="text-xs text-ink-soft px-2"
          >
            ✕
          </button>
        </div>
      )}

      {!fixedGroupId && (
        <div className="flex flex-wrap gap-2 pb-3 mb-3 border-b border-line-soft pl-[50px]">
          <span className="text-[11px] text-ink-muted font-medium self-center mr-1">Post to:</span>
          {groups.map(g => (
            <GroupChip
              key={g.id}
              group={g}
              selected={selected.has(g.id)}
              onClick={() => toggleGroup(g.id)}
            />
          ))}
        </div>
      )}

      {fixedGroup && (
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-line-soft pl-[50px]">
          <span className="text-[11px] text-ink-muted font-medium">Posting to:</span>
          <GroupChip group={fixedGroup} selected />
        </div>
      )}

      <input
        ref={mediaInputRef}
        type="file"
        accept="image/*,video/*,audio/*"
        multiple
        className="hidden"
        onChange={e => {
          addFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={e => {
          addFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 pl-[50px]">
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Add photo, video, or audio"
            onClick={() => mediaInputRef.current?.click()}
            className="w-8 h-8 rounded-md flex items-center justify-center text-ink-soft border border-transparent hover:bg-cream-soft hover:text-ink hover:border-line"
          >
            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" aria-hidden="true">
              <rect x="2" y="2.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
              <circle cx="5.5" cy="6" r="1.2" fill="currentColor" />
              <path
                d="M2 10.5l3.5-3 3 3 2-2 3.5 3.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </button>
          <button
            type="button"
            title="Add YouTube, Vimeo, Spotify, or other link"
            onClick={() => setShowLinkRow(open => !open)}
            className={`w-8 h-8 rounded-md flex items-center justify-center border border-transparent hover:bg-cream-soft hover:text-ink hover:border-line ${
              showLinkRow ? 'bg-accent-soft text-accent border-accent' : 'text-ink-soft'
            }`}
          >
            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" aria-hidden="true">
              <path
                d="M6.5 8h3M7 5.5H4.5a2.5 2.5 0 000 5H7M9 10.5h2.5a2.5 2.5 0 000-5H9"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            title="Add PDF"
            onClick={() => pdfInputRef.current?.click()}
            className="w-8 h-8 rounded-md flex items-center justify-center text-ink-soft border border-transparent hover:bg-cream-soft hover:text-ink hover:border-line"
          >
            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" aria-hidden="true">
              <path
                d="M3.5 1.5h6L13 5v8.5a1 1 0 01-1 1H3.5a1 1 0 01-1-1v-11a1 1 0 011-1z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <path d="M9.5 1.5V5h3.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="w-2" />
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-ink-muted">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="text-pending" aria-hidden="true">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
              <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            Will be reviewed by admin before posting
          </div>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="bg-accent text-white font-medium text-[13px] px-[18px] py-2 rounded-md hover:bg-accent-hover disabled:bg-ink-muted disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting…' : 'Submit for review'}
        </button>
      </div>
      {message && (
        <div
          className={`mt-2 ml-[50px] text-xs rounded p-2 ${
            message.includes('Could not') ||
            message.includes('valid') ||
            message.includes('Error') ||
            message.includes('upload')
              ? 'text-red-700 bg-red-50 border border-red-200'
              : 'text-success bg-success-soft border border-success/20'
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
