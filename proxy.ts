import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js 16 proxy (replaces middleware.ts).
 * Runs on the Node.js runtime — edge runtime is NOT supported here.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Shotstack callback is a server-to-server caller; handle OPTIONS preflight first,
  // then pass POST through with permissive CORS headers.
  if (pathname.startsWith('/api/webhooks/')) {
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }
    const response = NextResponse.next()
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/webhooks/:path*'],
}
