// Cloudflare Pages middleware: runs for every request before static file
// serving. We use it to return 404 for paths that exist in the deploy
// bucket but should never be publicly readable — internal docs, planning
// artifacts, repo metadata. CF Pages' _redirects file does not support
// status 404, so this middleware is the supported path.

const BLOCKED = [
  /^\/CLAUDE\.md$/i,
  /^\/HANDOFF\.md$/i,
  /^\/README(\.md)?$/i,
  /^\/\.gitignore$/i,
  /^\/\.git(\/|$)/i,
  /^\/distribution(\/|$)/i,
  /^\/docs(\/|$)/i,
  /^\/\.claude(\/|$)/i,
  /^\/\.wrangler(\/|$)/i,
  /^\/\.env(\.|$)/i,
  /^\/wrangler\.toml$/i,
  /^\/package(-lock)?\.json$/i,
];

export const onRequest = async ({ request, next }) => {
  const url = new URL(request.url);
  if (BLOCKED.some((re) => re.test(url.pathname))) {
    return new Response("Not Found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }
  return next();
};
