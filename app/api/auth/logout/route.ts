import { NextResponse } from 'next/server';
import { deleteSessionCookie } from '@/lib/session';

export async function POST() {
  try {
    await deleteSessionCookie();

    return NextResponse.json({
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
