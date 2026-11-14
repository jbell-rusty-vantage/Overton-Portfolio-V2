/** No fragment in Location: browsers carry old selected-card fragments across the redirect. */
export function GET() {
  return new Response(null, { status: 308, headers: { Location: "/?from=projects" } });
}
