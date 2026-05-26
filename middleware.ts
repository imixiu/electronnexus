import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const pageParam = searchParams.get("page");

  // Redirect /{category}?page=N to /{category}/page/N (301)
  if (pageParam) {
    const page = parseInt(pageParam, 10);
    if (page <= 1) {
      // ?page=1 or ?page=0 → redirect to clean /{category}
      const url = request.nextUrl.clone();
      url.searchParams.delete("page");
      return NextResponse.redirect(url, 301);
    }
    if (page > 1) {
      // ?page=N → redirect to /{category}/page/N
      const url = request.nextUrl.clone();
      url.searchParams.delete("page");
      url.pathname = `${pathname}/page/${page}`;
      return NextResponse.redirect(url, 301);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Match category pages only (not API routes, static files, etc.)
  matcher: ["/smartphones/:path*", "/laptopspcs/:path*", "/audio/:path*", "/smarthome/:path*", "/wearables/:path*", "/gaming/:path*", "/more/:path*"],
};
