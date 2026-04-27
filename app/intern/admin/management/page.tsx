import AdminManagementClient from "./AdminManagementClient";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AdminManagementPage() {
  const session = await getSession();
  
  // Allow SUPER_ADMIN and ADMIN, but redirect non-admin roles
  if (!session || (session.user?.role !== "SUPER_ADMIN" && session.user?.role !== "ADMIN")) {
    redirect("/intern/admin");
  }
  
  const currentUserEmail = session?.user?.email || "";
  const userRole = session?.user?.role || "ADMIN";

  return <AdminManagementClient currentUserEmail={currentUserEmail} userRole={userRole} />;
}
