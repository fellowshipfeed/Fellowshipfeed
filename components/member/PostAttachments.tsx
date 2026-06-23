import type { FeedPost } from '@/lib/types';

type Attachment = FeedPost['attachments'][number];

export function PostAttachments({ attachments }: { attachments: Attachment[] }) {
  if (!attachments.length) return null;

  const images = attachments.filter(a => a.type === 'image');
  const others = attachments.filter(a => a.type !== 'image');

  return (
    <div className="mb-3.5 space-y-2">
      {images.length > 0 && (
        <div
          className={`grid gap-2 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}
        >
          {images.map(img => (
            <a
              key={img.id}
              href={img.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border border-line overflow-hidden bg-cream-soft aspect-[16/10]"
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </a>
          ))}
        </div>
      )}
      {others.map(att => (
        <AttachmentBlock key={att.id} attachment={att} />
      ))}
    </div>
  );
}

function AttachmentBlock({ attachment }: { attachment: Attachment }) {
  const name = (attachment.metadata?.name as string) ?? attachment.url;
  const title = (attachment.metadata?.title as string) ?? name;
  const source = attachment.metadata?.source as string | undefined;

  if (attachment.type === 'pdf') {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 border border-line rounded-lg p-3.5 bg-cream-soft hover:bg-white hover:border-ink-muted transition-colors"
      >
        <div className="w-10 h-12 rounded bg-red-50 text-red-700 flex flex-col items-center justify-center text-[10px] font-bold shrink-0">
          PDF
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-ink truncate">{name}</div>
          <div className="text-xs text-ink-muted">Tap to view</div>
        </div>
      </a>
    );
  }

  if (attachment.type === 'embed') {
    const thumb = attachment.metadata?.thumbUrl as string | undefined;
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block border border-line rounded-lg overflow-hidden hover:border-ink-muted transition-colors"
      >
        <div className="aspect-video bg-ink relative flex items-center justify-center">
          {thumb ? (
            <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80" />
          ) : null}
          <div className="relative z-10 w-12 h-12 rounded-full bg-white/95 text-ink flex items-center justify-center">
            ▶
          </div>
        </div>
        <div className="px-3 py-2 text-xs text-ink-soft bg-cream-soft">
          {source === 'vimeo' ? 'Vimeo' : 'YouTube'} · {title}
        </div>
      </a>
    );
  }

  if (attachment.type === 'music') {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 border border-line rounded-lg p-3 bg-cream-soft hover:bg-white transition-colors"
      >
        <div
          className={`w-10 h-10 rounded flex items-center justify-center text-white shrink-0 ${
            source === 'spotify' ? 'bg-[#1DB954]' : source === 'apple' ? 'bg-[#FA243C]' : 'bg-purple-600'
          }`}
        >
          ♪
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-ink truncate">{title}</div>
          <div className="text-xs text-ink-muted truncate">{attachment.url}</div>
        </div>
      </a>
    );
  }

  if (attachment.type === 'video') {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block border border-line rounded-lg overflow-hidden aspect-video bg-ink text-white flex items-center justify-center hover:border-ink-muted"
      >
        ▶ Video
      </a>
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 border border-line rounded-lg px-3 py-2.5 bg-cream-soft hover:bg-white text-sm text-accent"
    >
      ↗ {(attachment.metadata?.domain as string) ?? title}
    </a>
  );
}
