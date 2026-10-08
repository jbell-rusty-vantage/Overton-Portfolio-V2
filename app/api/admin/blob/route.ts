import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { getAdmin } from "@/lib/auth/session";
import { MAX_UPLOAD_BYTES, isAllowedBlobPathname } from "@/lib/media";

// Presigned client uploads for the admin console.
//
// The browser calls uploadPresigned(..., { handleUploadUrl: "/api/admin/blob" }).
// The SDK POSTs { type: "blob.generate-presigned-url", payload: { pathname, multipart } }
// here; we check the admin session, mint a short-lived delegation token scoped to
// that pathname (OIDC auth on Vercel, no BLOB_READ_WRITE_TOKEN needed) and return
// a presigned URL. The browser then PUTs the file straight to Blob, so large files
// never pass through a Function. After it resolves, the uploader registers the
// MediaAsset row via a Server Action (no onUploadCompleted callback: it can't reach
// localhost and we don't need it).

const TOKEN_TTL_MS = 15 * 60_000;

export async function POST(request: Request) {
  let body: HandleUploadPresignedBody;
  try {
    body = (await request.json()) as HandleUploadPresignedBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.type === "blob.generate-presigned-url") {
    const admin = await getAdmin();
    if (!admin || admin.mustChangePassword) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname) => {
        if (!isAllowedBlobPathname(pathname)) {
          throw new Error(`Pathname not allowed: ${pathname}`);
        }
        const validUntil = Date.now() + TOKEN_TTL_MS;
        const token = await issueSignedToken({
          pathname,
          operations: ["put"],
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          validUntil,
        });
        return {
          token,
          urlOptions: { addRandomSuffix: true, maximumSizeInBytes: MAX_UPLOAD_BYTES, validUntil },
        };
      },
    });
    return Response.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload signing failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
