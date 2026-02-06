import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { getCachedSiteCopy } from '@/lib/site-copy-cache';

// GET site copy
export async function GET() {
  try {
    const siteCopy = await getCachedSiteCopy();

    return NextResponse.json(siteCopy);
  } catch (error) {
    console.error('Error fetching site copy:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site copy' },
      { status: 500 }
    );
  }
}

// PUT update site copy (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { homeCopy, themeColor, themePreset } = await request.json();

    const updateData: { homeCopy?: string; themeColor?: string | null; themePreset?: string | null } = {};
    if (homeCopy !== undefined) updateData.homeCopy = homeCopy;
    if (themeColor !== undefined) updateData.themeColor = themeColor || null;
    if (themePreset !== undefined) updateData.themePreset = themePreset || null;

    const siteCopy = await prisma.siteCopy.upsert({
      where: { id: 1 },
      update: updateData,
      create: {
        id: 1,
        homeCopy: homeCopy || '',
        themeColor: themeColor || null,
        themePreset: themePreset || null,
      },
    });
    revalidateTag('site-copy', 'max');

    return NextResponse.json({
      message: 'Site copy updated successfully',
      homeCopy: siteCopy.homeCopy,
      themeColor: siteCopy.themeColor,
      themePreset: siteCopy.themePreset,
    });
  } catch (error) {
    console.error('Error updating site copy:', error);
    return NextResponse.json(
      { error: 'Failed to update site copy' },
      { status: 500 }
    );
  }
}
