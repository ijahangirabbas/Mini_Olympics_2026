import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { cookies } from 'next/headers';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionToken);

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      userId: session.adminUserId,
      role: session.role,
      username: session.username,
      displayName: session.displayName,
      permissions: session.permissions,
      permissionDetails: session.permissionDetails,
      assignedGames: session.assignedGames,
      assignedGameIds: session.assignedGameIds,
      assignedGender: session.assignedGender,
      defaultPage: session.defaultPage,
      impersonatedBy: session.impersonatedBy,
    });
  } catch (error: any) {
    console.error('Session verification error:', error);
    return NextResponse.json(
      { authenticated: false, error: error.message },
      { status: 500 }
    );
  }
}
