"use server";

// 서버 액션이 반환할 객체의 타입을 정의
type ActionResult = {
  error?: string;
  success?: boolean;
};

export async function submitApplication(
  meetupId: string
): Promise<ActionResult> {
  try {
    console.log(`서버: ${meetupId} 모임 신청 처리 시작`);

    // 여기에 DB 저장 로직을 구현합니다.
    // ...

    // 예시: 특정 조건(정원 마감 등)에 따라 에러를 반환할 수 있습니다.
    const isFull = false; // 실제로는 DB를 조회해야 합니다.
    if (isFull) {
      return { error: "정원이 마감되었습니다." };
    }

    // 성공적으로 처리되었을 경우
    console.log("서버: 신청 정보 저장 완료");
    return { success: true };
  } catch (e) {
    // DB 연결 실패 등 예상치 못한 서버 에러가 발생했을 경우
    console.error("서버 액션 에러:", e);
    return { error: "서버에서 알 수 없는 오류가 발생했습니다." };
  }
}
