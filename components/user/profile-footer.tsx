interface ProfileFooterProps {
  displayName: string;
}

export function ProfileFooter({ displayName }: ProfileFooterProps) {
  return (
    <div className="px-5 py-6 md:px-8 border-t-[0.5px] border-[#B7B7B7]">
      <p className="text-[11px] text-[#B7B7B7]">
        이 페이지는 {displayName}님의 SYDE 명함입니다.
      </p>
    </div>
  );
}
