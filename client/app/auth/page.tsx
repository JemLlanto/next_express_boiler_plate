import { redirect } from "next/navigation";

export default function Home() {
  // Redirecting user in the login page
  redirect("/auth/login");
}
