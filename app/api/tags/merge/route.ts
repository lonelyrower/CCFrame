import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST merge tags (admin only)
export async function POST(request: NextRequest) {
  try {
    const { from, to } = await request.json();

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Both "from" and "to" tag names are required' },
        { status: 400 }
      );
    }

    // Find or create the target tag
    const toTag = await prisma.tag.upsert({
      where: { name: to },
      update: {},
      create: { name: to },
    });

    // Find the source tag
    const fromTag = await prisma.tag.findUnique({
      where: { name: from },
      include: { photos: true },
    });

    if (!fromTag) {
      return NextResponse.json(
        { error: `Tag "${from}" not found` },
        { status: 404 }
      );
    }

    // Update all photo tags to point to the new tag
    await prisma.$transaction(async (tx) => {
      // Update all photo-tag relationships
      for (const photoTag of fromTag.photos) {
        // Check if the photo already has the target tag
        const existing = await tx.photoTag.findUnique({
          where: {
            photoId_tagId: {
              photoId: photoTag.photoId,
              tagId: toTag.id,
            },
          },
        });

        if (!existing) {
          // Create new relation with target tag
          await tx.photoTag.create({
            data: {
              photoId: photoTag.photoId,
              tagId: toTag.id,
            },
          });
        }

        // Delete old relation
        await tx.photoTag.delete({
          where: {
            photoId_tagId: {
              photoId: photoTag.photoId,
              tagId: fromTag.id,
            },
          },
        });
      }

      // Delete the source tag
      await tx.tag.delete({
        where: { id: fromTag.id },
      });
    });

    return NextResponse.json({
      message: `Successfully merged "${from}" into "${to}"`,
    });
  } catch (error) {
    console.error('Error merging tags:', error);
    return NextResponse.json(
      { error: 'Failed to merge tags' },
      { status: 500 }
    );
  }
}
