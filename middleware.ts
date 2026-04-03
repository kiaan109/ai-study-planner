import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const isConfigured = SUPABASE_URL.startsWith('https://') && !SUPABASE_URL.includes('your-project');

export async function middleware(request: NextRequest) {
  if (!isConfigured) return NextResponse.next();

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  const isAuthPage  = request.nextUrl.pathname.startsWith('/login') ||
                      request.nextUrl.pathname.startsWith('/signup');
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard') ||
                      request.nextUrl.pathname.startsWith('/subjects')  ||
                      request.nextUrl.pathname.startsWith('/notes')     ||
                      request.nextUrl.pathname.startsWith('/timer')     ||
                      request.nextUrl.pathname.startsWith('/progress')  ||
                      request.nextUrl.pathname.startsWith('/planner')   ||
                      request.nextUrl.pathname.startsWith('/settings');

  if (!user && isDashboard) return NextResponse.redirect(new URL('/login', request.url));
  if (user && isAuthPage)   return NextResponse.redirect(new URL('/dashboard', request.url));

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
};
