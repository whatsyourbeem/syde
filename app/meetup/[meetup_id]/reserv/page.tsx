import ReservInput from "@/components/meetup/reserv/reserv-input";
import ReservBtn from "@/components/meetup/reserv/reserv-btn";
import ReservHeader from "@/components/meetup/reserv/reserv-header";

export default async function MeetupReservPage() {
  return (
    <div className="w-full max-w-lg mx-auto text-[#23292F] max-sm">
      <ReservHeader />
      <div className="w-full flex flex-col border-white border-t-[0.5px]  px-5 py-4 gap-9">
        <div className="w-full h-[75px] justify-center flex flex-col gap-1 leading-loose align-middle [hanging-punctuation:first]">
          <h2 className="text-2xl font-semibold">우리, 함께, SYDE! ✨</h2>
          <p className="text-base font-semibold">
            번호를 남기시면 문자로 챙겨드릴게요 💌
          </p>
        </div>
        <div className="flex flex-col justify-center gap-5">
          <ReservInput
            name="이름"
            placeholder="{닉네임}"
            description="이 이름으로 이름 스티커를 드릴거에요."
          />
          <ReservInput
            name="휴대폰 번호"
            placeholder="문자 안내를 받을 번호예요 📱"
            description="모임 안내 외 용도로 사용되지 않아요. 😌"
          />
          <ReservInput
            name="입금자명"
            placeholder="입금 확인을 위해 정확히 입력해주세요."
            description="참가비를 계좌이체하시면, 호스트가 확인 후 확정해드려요."
          />
          <ReservInput
            className="h-14 pb-[22px]"
            name="모임에서 나누고 싶은 이야기"
            placeholder="궁금한 것, 요즘 고민 등 자유롭게 적어주세요. 💬"
          />
        </div>
        <ReservBtn meetup={{ id: "temp-id", fee: 5000 }} />
      </div>
    </div>
  );
}
