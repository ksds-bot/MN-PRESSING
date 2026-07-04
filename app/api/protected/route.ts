import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Récupérer les informations utilisateur du middleware
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: 'User information not found' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: 'Access granted to protected route',
      user: {
        id: userId,
        email: userEmail,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');
    const body = await request.json();

    return NextResponse.json({
      message: 'Data received and processed',
      user: {
        id: userId,
        email: userEmail,
      },
      data: body,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 400 }
    );
  }
}
