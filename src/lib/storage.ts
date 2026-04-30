import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { prisma } from "./prisma";

const UPLOAD_BASE = path.join(process.cwd(), "public", "uploads");
const TEMP_DIR = path.join(UPLOAD_BASE, "temp");

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

  await ensureDir(TEMP_DIR);
  const targetDir = path.join(UPLOAD_BASE, subDir);
  await ensureDir(targetDir);

  const fileExtension = path.extname(newFile.name);
  const tempFileName = `temp-${crypto.randomUUID()}${fileExtension}`;
  const tempPath = path.join(TEMP_DIR, tempFileName);

  // 1. Save to temp
  await fs.writeFile(tempPath, buffer);

  const permanentFileName = `${crypto.randomUUID()}${fileExtension}`;
  const permanentUrl = `/uploads/${subDir}/${permanentFileName}`;
  const permanentPath = path.join(targetDir, permanentFileName);

  try {
    // 2. Perform DB Update
    const result = await dbUpdateCallback(permanentUrl);

    // 3. Move from temp to permanent
    await fs.rename(tempPath, permanentPath);

    // 4. Delete old file only after success
    if (oldFileUrl) {
      const oldPath = path.join(process.cwd(), "public", oldFileUrl);
      try {
        await fs.unlink(oldPath);
        console.log(`[STORAGE] Deleted old file: ${oldFileUrl}`);
      } catch (e) {
        console.warn(`[STORAGE] Failed to delete old file (orphaned): ${oldFileUrl}`, e);
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
  // First check in Attachment model
  const attachment = await prisma.attachment.findFirst({
    where: { fileUrl: fileUrl },
    select: { studentId: true }
  });

  // Then check in StudentProfile model (profile picture)
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

  // 3. Finally delete from disk
  const filePath = path.join(process.cwd(), "public", fileUrl);
  try {
    await fs.unlink(filePath);
    console.log(`[STORAGE] Manually deleted file: ${fileUrl}`);
  } catch (e) {
    console.error(`[STORAGE] Error deleting file from disk: ${fileUrl}`, e);
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
    const filePath = path.join(TEMP_DIR, file);
    const stats = await fs.stat(filePath);
    if (now - stats.mtimeMs > 24 * 60 * 60 * 1000) {
      await fs.unlink(filePath);
      console.log(`[STORAGE] Cleaned old temp file: ${file}`);
    }
  }

  // 2. Scan permanent uploads and verify DB reference
  const dirs = ["profiles", "internships"];
  for (const dir of dirs) {
    const fullDir = path.join(UPLOAD_BASE, dir);
    await ensureDir(fullDir);
    const files = await fs.readdir(fullDir);

    for (const file of files) {
      const url = `/uploads/${dir}/${file}`;
      
      // Check if referenced in Attachment or StudentProfile
      const attachment = await prisma.attachment.findFirst({ where: { fileUrl: url } });
      const profile = await prisma.studentProfile.findFirst({ where: { profilePictureUrl: url } });

      if (!attachment && !profile) {
        await fs.unlink(path.join(fullDir, file));
        console.log(`[STORAGE] Deleted orphaned file: ${url}`);
      }
    }
  }
}
