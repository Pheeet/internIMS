import { getCurrentUser } from "./session";

/**
 * Ensures that the current user is authenticated and has an admin role.
 * Throws an error if the user is not an admin.
 */
export async function requireAdminUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized: Please log in.");
  }

  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new Error("Forbidden: Admin access required.");
  }

  return user;
}

/**
 * Ensures that the current user is authenticated and has the SUPER_ADMIN role.
 * Throws an error if the user is not a super admin.
 */
export async function requireSuperAdminUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized: Please log in.");
  }

  if (user.role !== "SUPER_ADMIN") {
    throw new Error("Forbidden: Super Admin access required.");
  }

  return user;
}

/**
 * Ensures that the current user is authenticated.
 */
export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized: Please log in.");
  }

  return user;
}
