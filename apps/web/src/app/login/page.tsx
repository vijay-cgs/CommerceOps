import { redirect } from "next/navigation";
import { AuthForm } from "../../components/auth/auth-form";
import { getAuthContext } from "../../lib/auth";

export default async function LoginPage() {
  if (await getAuthContext()) {
    redirect("/");
  }

  return <AuthForm mode="login" />;
}
