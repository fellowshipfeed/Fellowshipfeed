import type { SupabaseClient } from '@supabase/supabase-js';

export type ComposerAttachment =
  | {
      id: string;
      kind: 'file';
      file: File;
      attachmentType: 'image' | 'video' | 'pdf' | 'music';
      previewUrl?: string;
      label: string;
      sizeLabel: string;
    }
  | {
      id: string;
      kind: 'url';
      attachmentType: 'embed' | 'music' | 'link';
      url: string;
      metadata: Record<string, unknown>;
      label: string;
    };

export function formatFileSize(bytes: number): string {
  const kb = bytes / 1024;
  if (kb > 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${Math.round(kb)} KB`;
}

export function fileAttachmentType(file: File): 'image' | 'video' | 'pdf' | 'music' {
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type.startsWith('audio/')) return 'music';
  if (file.type.startsWith('video/')) return 'video';
  return 'image';
}

export function createFileAttachment(file: File): ComposerAttachment {
  const attachmentType = fileAttachmentType(file);
  return {
    id: crypto.randomUUID(),
    kind: 'file',
    file,
    attachmentType,
    previewUrl: attachmentType === 'image' ? URL.createObjectURL(file) : undefined,
    label: file.name,
    sizeLabel: formatFileSize(file.size),
  };
}

export async function uploadPostAttachment(
  supabase: SupabaseClient,
  postId: string,
  orgId: string,
  file: File,
): Promise<string> {
  const safeName = file.name.replace(/[^\w.-]+/g, '_');
  const path = `${orgId}/${postId}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from('post-attachments').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('post-attachments').getPublicUrl(path);
  return data.publicUrl;
}

export async function saveAttachmentsForPost(
  supabase: SupabaseClient,
  postId: string,
  orgId: string,
  attachments: ComposerAttachment[],
): Promise<void> {
  for (const att of attachments) {
    if (att.kind === 'file') {
      const url = await uploadPostAttachment(supabase, postId, orgId, att.file);
      const { error } = await supabase.from('attachments').insert({
        post_id: postId,
        type: att.attachmentType,
        url,
        metadata: {
          name: att.file.name,
          size: att.file.size,
          sizeLabel: att.sizeLabel,
          mimeType: att.file.type,
        },
      });
      if (error) throw error;
    } else {
      const { error } = await supabase.from('attachments').insert({
        post_id: postId,
        type: att.attachmentType,
        url: att.url,
        metadata: att.metadata,
      });
      if (error) throw error;
    }
  }
}
