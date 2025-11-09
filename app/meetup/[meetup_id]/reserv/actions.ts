"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type FormState = {
  error?: string;
  success?: boolean;
};

export async function createMeetupParticipant(
  meetup_id: string,
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const username = formData.get("이름") as string;
  const mobile = formData.get("휴대폰 번호") as string;
  const depositor = formData.get("입금자명") as string;
  const story = formData.get("모임에서 나누고 싶은 이야기") as string;

  if (!username || !mobile || !depositor) {
    return { error: "필수 입력 필드를 모두 채워주세요." };
  }

  const { error } = await supabase.from("meetup_participants").insert({
    meetup_id: meetup_id,
    user_id: user.id,
    username,
    mobile,
    depositor,
    story,
    status: "PENDING",
  });

  if (error) {
    console.error("Meetup participant insert error:", error);
    if (error.code === '23505') { // Unique constraint violation
        return { error: "이미 해당 모임에 신청하셨습니다." };
    }
    return { error: "신청 처리 중 오류가 발생했습니다. 다시 시도해 주세요." };
  }

  revalidatePath(`/meetup/${meetup_id}`);
  // 성공 시 리디렉션은 page.tsx에서 useEffect를 사용하여 처리하는 것이 더 나은 사용자 경험을 제공할 수 있습니다.
  // 여기서는 상태만 반환하고, 리디렉션은 클라이언트에서 처리하도록 합니다.
  // redirect(`/meetup/${meetup_id}/reserv/success`);
  return { success: true };
}
