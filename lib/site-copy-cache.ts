import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db';
import { DEFAULT_HOME_COPY_SELECTED } from '@/lib/constants';
import { DEFAULT_THEME_ID, resolveThemeId } from '@/lib/themes';

type CachedSiteCopy = {
  homeCopy: string;
  themeColor: string | null;
  themePreset: string;
};

const DEFAULT_SITE_COPY: CachedSiteCopy = {
  homeCopy: DEFAULT_HOME_COPY_SELECTED,
  themeColor: null,
  themePreset: DEFAULT_THEME_ID,
};

function shouldSkipDbRead() {
  return process.env.NEXT_PHASE === 'phase-production-build';
}

const fetchSiteCopy = unstable_cache(
  async () =>
    prisma.siteCopy.findUnique({
      where: { id: 1 },
      select: {
        homeCopy: true,
        themeColor: true,
        themePreset: true,
      },
    }),
  ['site-copy'],
  {
    revalidate: 300,
    tags: ['site-copy'],
  }
);

export async function getCachedSiteCopy(): Promise<CachedSiteCopy> {
  if (shouldSkipDbRead()) {
    return DEFAULT_SITE_COPY;
  }

  try {
    const siteCopy = await fetchSiteCopy();
    return {
      homeCopy: siteCopy?.homeCopy || DEFAULT_HOME_COPY_SELECTED,
      themeColor: siteCopy?.themeColor || null,
      themePreset:
        resolveThemeId(siteCopy?.themePreset, siteCopy?.themeColor) || DEFAULT_THEME_ID,
    };
  } catch {
    return DEFAULT_SITE_COPY;
  }
}
