import { getCurrentUser } from "@/src/lib/session";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/intern/login");
  }

  const role = user.role.toUpperCase();

  if (role === "STUDENT") {
    redirect("/intern/student");
  } else {
    redirect("/intern/admin");
  }
}
