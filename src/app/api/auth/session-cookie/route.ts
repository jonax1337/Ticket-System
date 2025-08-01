import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { rememberMe } = await request.json()
    
    const response = NextResponse.json({ success: true })
    
    // Get all cookies from the request
    const cookies = request.cookies.getAll()
    
    // Find the session cookie
    const sessionCookie = cookies.find(cookie => 
      cookie.name.includes('next-auth.session-token') || 
      cookie.name.includes('__Secure-next-auth.session-token')
    )
    
    if (sessionCookie) {
      // Set cookie with appropriate expiration
      const cookieOptions = {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: rememberMe ? 30 * 24 * 60 * 60 : undefined // 30 days or session
      }
      
      response.cookies.set(sessionCookie.name, sessionCookie.value, cookieOptions)
    }
    
    return response
  } catch (error) {
    console.error('Session cookie error:', error)
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }
}