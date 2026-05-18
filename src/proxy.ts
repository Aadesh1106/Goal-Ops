// ============================================================
// GoalOps Enterprise — Next.js Middleware (Auth Guard)
// ============================================================
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { PROTECTED_ROUTES, AUTH_ROUTES, ROLE_DASHBOARD_MAP } from '@/lib/constants';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // ── Redirect unauthenticated users away from protected routes ──
  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // ── Redirect authenticated users away from auth routes ──
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  if (isAuthRoute && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      // User has a session but no profile (e.g. database wiped). 
      // Allow them to stay on the auth page they requested (login or register) so they can fix it.
      const response = NextResponse.next();
      
      // Clear Supabase auth cookies so their broken session is removed for the next request
      const allCookies = request.cookies.getAll();
      allCookies.forEach(cookie => {
        if (cookie.name.includes('supabase')) {
          response.cookies.delete(cookie.name);
        }
      });
      return response;
    }

    const role = (profile?.role ?? 'employee') as keyof typeof ROLE_DASHBOARD_MAP;
    const url = request.nextUrl.clone();
    url.pathname = ROLE_DASHBOARD_MAP[role];
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
