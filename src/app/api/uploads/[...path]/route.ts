import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const UPLOAD_BASE = path.resolve(process.cwd(), "public", "uploads");

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;

  // Validate each segment to prevent path traversal
  for (const segment of segments) {
    if (
      segment.includes("..") ||
      segment.includes("\\") ||
      segment.includes("/") ||
      segment.includes("\x00")
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  const relPath = segments.join(path.sep);
  const resolvedPath = path.resolve(UPLOAD_BASE, relPath);

  // Ensure resolved path is inside UPLOAD_BASE
  if (!resolvedPath.startsWith(UPLOAD_BASE + path.sep) && resolvedPath !== UPLOAD_BASE) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Check file exists and is not a symlink
  let stat: fs.Stats;
  try {
    stat = fs.lstatSync(resolvedPath);
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }

  if (stat.isSymbolicLink() || stat.isDirectory()) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Determine content type by extension
  const ext = path.extname(resolvedPath).toLowerCase();
  const contentTypeMap: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
  };
  const contentType = contentTypeMap[ext] ?? "application/octet-stream";

  const buffer = fs.readFileSync(resolvedPath);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(stat.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Last-Modified": stat.mtime.toUTCString(),
    },
  });
}
