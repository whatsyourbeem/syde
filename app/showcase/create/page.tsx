import { ProjectRegistrationForm } from "@/components/showcase/project-registration-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ShowcaseCreatePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/showcase");
  }

  return <ProjectRegistrationForm />;
}
