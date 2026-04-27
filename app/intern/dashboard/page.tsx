import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/intern/login");
  }

  const role = session.user.role.toUpperCase();

  if (role === "STUDENT") {
    redirect("/intern/student");
  } else {
    redirect("/intern/admin");
  }
}
