import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { prisma } from "./prisma";

// Use path.resolve to get an absolute, normalized base path
const UPLOAD_BASE = path.resolve(process.cwd(), "public", "uploads");
const TEMP_DIR = path.resolve(UPLOAD_BASE, "temp");

/**
 * Validates and resolves a file URL to a safe absolute path on disk.
 * Prevents path traversal by ensuring the resolved path is within UPLOAD_BASE.
 */
async function getSafePath(fileUrl: string): Promise<string> {
  // 1. Normalize: convert to relative path within uploads
  let relativePath = fileUrl;
  if (fileUrl.startsWith("/uploads/")) {
    relativePath = fileUrl.substring(9);
  } else if (fileUrl.startsWith("uploads/")) {
    relativePath = fileUrl.substring(8);
  }

  // 2. Reject suspicious characters/patterns (including null bytes and Windows paths)
  if (
    relativePath.includes("..") ||
    relativePath.includes("\\") ||
    relativePath.includes(":") ||
    relativePath.includes("\x00") ||
    relativePath.startsWith("/")
  ) {
    throw new Error("Invalid file path detected");
  }

  // 3. Resolve to absolute path
  const resolvedPath = path.resolve(UPLOAD_BASE, relativePath);

  // 4. Textual containment check: must be inside UPLOAD_BASE
  if (!resolvedPath.startsWith(UPLOAD_BASE)) {
    throw new Error("Path traversal attempt detected");
  }

  // 5. Symlink check: reject symlinks that could point outside UPLOAD_BASE
  try {
    const stat = await fs.lstat(resolvedPath);
    if (stat.isSymbolicLink()) {
      throw new Error("Symlinks are not permitted in upload paths");
    }
  } catch (e: any) {
    if (e.code !== "ENOENT") throw e;
    // File does not exist — safe to proceed (caller will handle ENOENT)
  }

  return resolvedPath;
}

/**
 * Ensures a directory exists
 */
async function ensureDir(dir: string) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * Atomic File Replacement Rule Implementation
 * 1. Save new file to temp
 * 2. Perform database update (via callback)
 * 3. If DB update succeeds, move temp to permanent and delete old file
 * 4. If DB update fails, delete temp and preserve old file
 */
export async function replaceFileAtomically<T>(
  newFile: File,
  oldFileUrl: string | null | undefined,
  subDir: string,
  dbUpdateCallback: (newFileUrl: string) => Promise<T>
): Promise<T> {
  const bytes = await newFile.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Validate subDir to prevent traversal during directory creation
  if (subDir.includes("..") || subDir.includes("/") || subDir.includes("\\")) {
    throw new Error("Invalid subdirectory name");
  }

  await ensureDir(TEMP_DIR);
  const targetDir = path.resolve(UPLOAD_BASE, subDir);
  await ensureDir(targetDir);

  const fileExtension = path.extname(newFile.name);
  // Ensure extension is safe (basic check)
  if (!/^\.[a-zA-Z0-9]+$/.test(fileExtension)) {
    throw new Error("Invalid file extension");
  }

  const tempFileName = `temp-${crypto.randomUUID()}${fileExtension}`;
  const tempPath = path.resolve(TEMP_DIR, tempFileName);

  // 1. Save to temp
  await fs.writeFile(tempPath, buffer);

  const permanentFileName = `${crypto.randomUUID()}${fileExtension}`;
  const permanentUrl = `/uploads/${subDir}/${permanentFileName}`;
  const permanentPath = path.resolve(targetDir, permanentFileName);

  try {
    // 2. Perform DB Update
    const result = await dbUpdateCallback(permanentUrl);

    // 3. Move from temp to permanent
    await fs.rename(tempPath, permanentPath);

    // 4. Delete old file only after success
    if (oldFileUrl) {
      try {
        const oldPath = await getSafePath(oldFileUrl);
        await fs.unlink(oldPath);
        console.log(`[STORAGE] Deleted old file: ${oldFileUrl}`);
      } catch (e: any) {
        console.warn(`[STORAGE] Failed to delete old file (orphaned or unsafe): ${oldFileUrl}`, e.message);
      }
    }

    return result;
  } catch (error) {
    // 5. Rollback: delete temp file if DB update fails
    try {
      await fs.unlink(tempPath);
    } catch (e) {
      console.error("[STORAGE] Failed to cleanup temp file on rollback:", e);
    }
    throw error;
  }
}

/**
 * Manual File Deletion with Ownership Check
 */
export async function deleteFileSafely(
  fileUrl: string,
  userId: string,
  dbDeleteCallback: () => Promise<void>
) {
  // 1. Verify ownership directly from DB
  const attachment = await prisma.attachment.findFirst({
    where: { fileUrl: fileUrl },
    select: { studentId: true }
  });

  const profile = await prisma.studentProfile.findFirst({
    where: { profilePictureUrl: fileUrl },
    select: { userId: true }
  });

  const record = attachment || profile;

  if (!record) {
    throw new Error("File not found");
  }

  const ownerId = attachment ? attachment.studentId : profile?.userId;

  if (ownerId !== userId) {
    throw new Error("Unauthorized");
  }

  // 2. Proceed with DB record deletion
  await dbDeleteCallback();

  // 3. Finally delete from disk using safe path validation
  try {
    const filePath = await getSafePath(fileUrl);
    await fs.unlink(filePath);
    console.log(`[STORAGE] Manually deleted file: ${fileUrl}`);
  } catch (e: any) {
    console.error(`[STORAGE] Error deleting file from disk: ${fileUrl}`, e.message);
  }
}

/**
 * Orphaned File Cleanup
 */
export async function cleanupOrphanedFiles() {
  console.log("[STORAGE] Starting orphaned file cleanup...");
  
  // 1. Clean temp files older than 24 hours
  await ensureDir(TEMP_DIR);
  const tempFiles = await fs.readdir(TEMP_DIR);
  const now = Date.now();
  for (const file of tempFiles) {
    const filePath = path.resolve(TEMP_DIR, file);
    const stats = await fs.stat(filePath);
    if (now - stats.mtimeMs > 24 * 60 * 60 * 1000) {
      await fs.unlink(filePath);
      console.log(`[STORAGE] Cleaned old temp file: ${file}`);
    }
  }

  // 2. Scan permanent uploads and verify DB reference
  const dirs = ["profiles", "internships"];
  for (const dir of dirs) {
    const fullDir = path.resolve(UPLOAD_BASE, dir);
    await ensureDir(fullDir);
    const files = await fs.readdir(fullDir);

    for (const file of files) {
      const url = `/uploads/${dir}/${file}`;
      
      // Check if referenced in Attachment or StudentProfile
      const attachment = await prisma.attachment.findFirst({ where: { fileUrl: url } });
      const profile = await prisma.studentProfile.findFirst({ where: { profilePictureUrl: url } });

      if (!attachment && !profile) {
        try {
          const filePath = path.resolve(fullDir, file);
          // Additional safety check before unlinking in bulk
          if (filePath.startsWith(UPLOAD_BASE)) {
            await fs.unlink(filePath);
            console.log(`[STORAGE] Deleted orphaned file: ${url}`);
          }
        } catch (e: any) {
          console.error(`[STORAGE] Error cleaning up orphaned file ${url}:`, e.message);
        }
      }
    }
  }
}
