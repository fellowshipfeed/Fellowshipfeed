import type { ComposerAttachment } from '@/lib/composer-attachments';

type Props = {
  attachments: ComposerAttachment[];
  onRemove: (id: string) => void;
};

export function AttachmentPreview({ attachments, onRemove }: Props) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 ml-[50px] mt-2 mb-3 p-2 border border-dashed border-line rounded-md bg-cream-soft">
      {attachments.map(att => (
        <div
          key={att.id}
          className="flex items-center gap-2 bg-white border border-line rounded-md px-2 py-1.5 max-w-[280px] min-w-0"
        >
          <AttachmentThumb attachment={att} />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-ink truncate">{att.label}</div>
            {'sizeLabel' in att && (
              <div className="text-[11px] text-ink-muted">{att.sizeLabel}</div>
            )}
            {att.kind === 'url' && (
              <div className="text-[11px] text-ink-muted truncate">{att.url}</div>
            )}
          </div>
          <button
            type="button"
            onClick={() => onRemove(att.id)}
            className="text-ink-muted hover:text-red-700 text-sm leading-none px-1"
            aria-label={`Remove ${att.label}`}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

function AttachmentThumb({ attachment }: { attachment: ComposerAttachment }) {
  if (attachment.kind === 'file') {
    if (attachment.previewUrl) {
      return (
        <img
          src={attachment.previewUrl}
          alt=""
          className="w-9 h-9 rounded object-cover shrink-0"
        />
      );
    }
    const bg =
      attachment.attachmentType === 'pdf'
        ? 'bg-red-50 text-red-700'
        : attachment.attachmentType === 'music'
          ? 'bg-purple-50 text-purple-700'
          : 'bg-accent-soft text-accent';
    return (
      <div className={`w-9 h-9 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${bg}`}>
        {attachment.attachmentType === 'pdf' ? 'PDF' : attachment.attachmentType === 'music' ? '♪' : '▶'}
      </div>
    );
  }

  const source = attachment.metadata.source as string | undefined;
  if (attachment.attachmentType === 'embed') {
    const thumb = attachment.metadata.thumbUrl as string | undefined;
    if (thumb) {
      return <img src={thumb} alt="" className="w-9 h-9 rounded object-cover shrink-0" />;
    }
    return (
      <div className="w-9 h-9 rounded bg-ink text-white flex items-center justify-center shrink-0 text-xs">
        ▶
      </div>
    );
  }

  if (attachment.attachmentType === 'music') {
    const color = source === 'spotify' ? 'bg-[#1DB954] text-white' : 'bg-[#FA243C] text-white';
    return (
      <div className={`w-9 h-9 rounded flex items-center justify-center shrink-0 ${color}`}>
        ♪
      </div>
    );
  }

  return (
    <div className="w-9 h-9 rounded bg-cream-soft text-ink-muted flex items-center justify-center shrink-0">
      ↗
    </div>
  );
}
