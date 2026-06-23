export type ParsedMediaUrl = {
  attachmentType: 'embed' | 'music' | 'link';
  url: string;
  metadata: Record<string, unknown>;
};

export function parseMediaUrl(raw: string): ParsedMediaUrl | null {
  const u = raw.trim();
  if (!u) return null;

  let m = u.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
  );
  if (m) {
    return {
      attachmentType: 'embed',
      url: u,
      metadata: {
        source: 'youtube',
        videoId: m[1],
        thumbUrl: `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`,
        title: 'YouTube video',
      },
    };
  }

  m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) {
    return {
      attachmentType: 'embed',
      url: u,
      metadata: {
        source: 'vimeo',
        videoId: m[1],
        title: 'Vimeo video',
      },
    };
  }

  m = u.match(/open\.spotify\.com\/(track|album|playlist|episode)\/([A-Za-z0-9]+)/);
  if (m) {
    return {
      attachmentType: 'music',
      url: u,
      metadata: {
        source: 'spotify',
        kind: m[1],
        spotifyId: m[2],
        title: `Spotify ${m[1]}`,
      },
    };
  }

  m = u.match(/music\.apple\.com\/[a-z]{2}\/(album|playlist|song)\/([^/]+)/i);
  if (m) {
    return {
      attachmentType: 'music',
      url: u,
      metadata: {
        source: 'apple',
        kind: m[1],
        title: decodeURIComponent(m[2].replace(/-/g, ' ')),
      },
    };
  }

  if (/^https?:\/\//.test(u)) {
    let domain = '';
    try {
      domain = new URL(u).hostname.replace(/^www\./, '');
    } catch {
      domain = u;
    }
    return {
      attachmentType: 'link',
      url: u,
      metadata: { domain, title: domain || u },
    };
  }

  return null;
}
