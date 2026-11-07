import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://central-gateway-server.onrender.com/api/v1';

async function handler(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const targetPath = path.join('/');
  const searchParams = request.nextUrl.search;
  const targetUrl = `${BACKEND_URL}/${targetPath}${searchParams}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    // Exclude host and connection headers
    if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  // Inject server-side GATEWAY_SECRET_KEY if available and client did not supply one
  if (!headers.get('authorization') && process.env.GATEWAY_SECRET_KEY) {
    headers.set('authorization', `Bearer ${process.env.GATEWAY_SECRET_KEY}`);
  }

  let body: BodyInit | undefined = undefined;
  if (!['GET', 'HEAD'].includes(request.method)) {
    body = await request.text();
  }

  try {
    const backendRes = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    });

    const responseBody = await backendRes.text();
    const contentType = backendRes.headers.get('content-type') || 'application/json';

    return new NextResponse(responseBody, {
      status: backendRes.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        statusCode: 502,
        message: `Failed to connect to backend gateway at ${BACKEND_URL}: ${errorMsg}`,
      },
      { status: 502 },
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
