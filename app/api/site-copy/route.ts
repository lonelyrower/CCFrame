import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { DEFAULT_HOME_COPY_SELECTED } from '@/lib/constants';
import { DEFAULT_THEME_ID, resolveThemeId } from '@/lib/themes';

// GET site copy
export async function GET() {
  try {
    const siteCopy = await prisma.siteCopy.findUnique({
      where: { id: 1 },
    });

    return NextResponse.json({
      homeCopy: siteCopy?.homeCopy || DEFAULT_HOME_COPY_SELECTED,
      themeColor: siteCopy?.themeColor || null,
      themePreset: resolveThemeId(siteCopy?.themePreset, siteCopy?.themeColor) || DEFAULT_THEME_ID,
    });
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
