import React from "react";

export default function GuidelinePage() {
  return (
    <div className="container mx-auto px-8 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">SYDE 커뮤니티 가이드라인</h1>
      <div className="prose prose-sm mx-auto">
        <h2>1. 오픈채팅방 가이드라인</h2>
        <h3>🎯 기본 원칙</h3>
        <ul>
          <li>
            <strong>서로 존중하기</strong>: 예의를 지키고 배려해주세요
          </li>
          <li>
            <strong>건설적 소통</strong>: 도움이 되는 대화를 나눠주세요
          </li>
          <li>
            <strong>적극적 참여</strong>: 질문하고 답변하며 함께 성장해요
          </li>
        </ul>
        <h3>✅ 이런 건 OK!</h3>
        <ul>
          <li>SYDE 관련 모든 주제 자유롭게 토론</li>
          <li>질문 &amp; 답변, 정보 공유</li>
          <li>
            <strong>사이드프로젝트 관련 글</strong> (개인 앱 홍보, 팀원 모집 등)
          </li>
          <li>적절한 친목과 개인적 대화</li>
        </ul>
        <h3>❌ 이런 건 NO!</h3>
        <ul>
          <li>도배, 스팸, 무의미한 연속 메시지</li>
          <li>개인 공격, 욕설, 차별 발언</li>
          <li>정치적 논쟁, 종교적 갈등 조장</li>
          <li>개인정보 공유 (전화번호, 주소 등)</li>
        </ul>
        <h3>💼 상업성 광고 규칙</h3>
        <p>
          <strong>SYDE 구성원들에게 도움이 되는 내용</strong>에 한해, 운영진의
          허가를 받은 내용만 허용합니다.
        </p>
        <ul>
          <li>
            반드시 운영진에게 사전 허가 받기 (
            <a href="mailto:by.sydestudio@gmail.com">by.sydestudio@gmail.com</a>
            )
          </li>
          <li>허가 없는 상업성 광고 → 강제탈퇴 가능</li>
        </ul>
        <hr />
        <h2>2. 웹사이트 이용 가이드라인</h2>
        <h3>📝 기본 원칙</h3>
        <ul>
          <li>
            <strong>유용한 콘텐츠</strong>: 다른 사용자에게 도움이 되는 내용
            공유
          </li>
          <li>
            <strong>상호 존중</strong>: 모든 구성원을 배려하고 예의 지키기
          </li>
          <li>
            <strong>건전한 활동</strong>: 건설적이고 의미 있는 참여
          </li>
          <li>
            <strong>출처 명시</strong>: 참고 자료나 링크는 반드시 출처 표기
          </li>
        </ul>
        <h3>📣 홍보 규칙</h3>
        <p>
          SYDE는 사이드프로젝트를 알리는 공간이지만, 광고판이 되지 않도록 아래
          기준을 지켜주세요.
        </p>
        <p>
          <strong>✅ 허용되는 홍보</strong>
        </p>
        <ul>
          <li>
            회원 본인이 만든 사이드프로젝트를 소개하는 글 (만든 과정, 배운 점,
            업데이트 소식 포함)
          </li>
          <li>프로젝트 팀원 모집</li>
        </ul>
        <p>
          <strong>🚫 허용되지 않는 홍보</strong>
        </p>
        <ul>
          <li>
            외부 상품·서비스·강의·대행 등을 알리는 광고 (필요한 경우{" "}
            <strong>운영진의 사전 허가</strong>를 받아주세요)
          </li>
          <li>같은 내용이나 비슷한 홍보 글을 반복해서 올리는 행위</li>
          <li>글의 주제와 무관한 링크를 끼워 넣는 행위</li>
        </ul>
        <h3>🚫 금지 행위</h3>
        <ul>
          <li>허위 정보 유포</li>
          <li>저작권 침해 콘텐츠</li>
          <li>
            스팸성 게시물 도배 (피드·블로그에 광고·홍보성 글을 반복 게시, 같은
            내용 복사·붙여넣기, 주제와 무관한 링크 삽입 등)
          </li>
          <li>개인정보 무단 공개 (스크린샷·캡처에 노출된 타인 정보 포함)</li>
          <li>혐오 표현이나 차별 발언</li>
          <li>타인 사칭, 계정 양도·거래</li>
          <li>스토킹, 괴롭힘, 허위 또는 악의적인 신고 남용</li>
          <li>SYDE를 이용해 제3자를 홍보해주고 금전을 받는 행위 (홍보 대행)</li>
          <li>성인물, 도박 등 불법적이거나 청소년에게 유해한 내용</li>
        </ul>
        <h3>⚠️ 부정 이용 행위</h3>
        <p>
          서비스의 평가와 노출 지표를 왜곡하는 아래 행위는 엄격히 금지합니다.
        </p>
        <ul>
          <li>
            <strong>다중계정(유령 계정, 부계정)</strong>: 한 사람이 여러 계정을
            만들어 운영하는 행위. SYDE는 1인 1계정을 원칙으로 합니다.
          </li>
          <li>
            <strong>업보트 조작</strong>: 여러 계정으로 본인 또는 특정인의
            프로젝트·게시물에 업보트(추천)·좋아요를 하는 행위
          </li>
          <li>
            <strong>업보트 거래·품앗이</strong>: 대가를 주고받거나 서로 맞추어
            업보트를 주고받는 행위
          </li>
          <li>
            <strong>자동화</strong>: 매크로, 스크립트, 외부 서비스를 이용해
            가입·업보트·게시물 작성을 하는 행위
          </li>
        </ul>
        <p>
          <strong>알아두세요:</strong> 지인이 직접 계정으로 진심에서 응원하는
          업보트는 괜찮습니다. 다만 업보트에 대가를 제공하거나, 조직적으로
          업보트를 요청·동원하는 행위는 업보트 조작으로 봅니다.
        </p>
        <h3>🚨 신고하기</h3>
        <p>
          가이드라인·약관을 위반하거나 권리를 침해하는 게시물, 의심되는 부정
          이용을 발견하면{" "}
          <a href="mailto:by.sydestudio@gmail.com">by.sydestudio@gmail.com</a>
          으로 신고해주세요. 게시물 주소(URL)와 사유를 함께 알려주시면 빠르게
          확인합니다. 권리 침해 신고는 임시조치(최대 30일) 등 처리 절차를
          거치며, 자세한 내용은 <a href="/term">이용약관</a> 제16조를
          참고해주세요.
        </p>
        <h3>🛡️ 위반 시 조치</h3>
        <p>
          <strong>일반 위반</strong>의 경우 위반의 정도에 따라 게시물 삭제 →
          경고 → 기간을 정한 이용 제한 → 회원 자격 상실(강제 탈퇴) 순으로
          조치합니다. 다만 중대하거나 반복된 위반은 단계를 건너뛰고 바로 조치할
          수 있습니다.
        </p>
        <p>
          <strong>부정 이용</strong>이 확인되면 운영진은 위반의 정도, 횟수,
          고의성을 고려해 아래 조치를 사전 경고 없이 즉시 취할 수 있습니다.
          악의적인 경우에는 첫 위반이어도 즉시 탈퇴 처리될 수 있습니다.
        </p>
        <ul>
          <li>해당 게시물 삭제 또는 비공개 처리</li>
          <li>부정하게 발생한 업보트 등 지표 무효화·회수</li>
          <li>기간을 정한 서비스 이용 제한</li>
          <li>
            회원 자격 상실(강제 탈퇴) 및 재가입 제한 (연결된 복수 계정은
            동일인의 계정으로 보아 함께 조치합니다)
          </li>
        </ul>
        <p>
          조치에 이의가 있다면{" "}
          <a href="mailto:by.sydestudio@gmail.com">by.sydestudio@gmail.com</a>
          으로 문의해주세요. 자세한 내용은 <a href="/term">이용약관</a> 제9조,
          제12조를 참고해주세요.
        </p>
        <h3>📂 메뉴별 이용 가이드</h3>
        <h4>📝 피드 (Feed)</h4>
        <p>
          <strong>사이드프로젝트 과정과 인사이트 공유</strong>
        </p>
        <p>
          <strong>이런 걸 올려주세요:</strong>
        </p>
        <ul>
          <li>프로젝트 진행 과정과 경험담</li>
          <li>개발/디자인 인사이트와 팁</li>
          <li>본인 프로젝트 소개 (홍보 규칙을 지켜주세요)</li>
          <li>팀빌딩 및 팀원 모집</li>
          <li>실패 경험과 교훈</li>
        </ul>
        <p>
          <strong>작성 가이드:</strong>
        </p>
        <ul>
          <li>명확하고 구체적인 제목 사용</li>
          <li>과정이나 결과물 이미지 첨부 권장</li>
          <li>관련 링크나 자료 공유 환영</li>
          <li>해시태그 활용으로 검색성 향상</li>
        </ul>
        <h4>✍️ 블로그 (Blog)</h4>
        <p>
          <strong>내가 직접 겪은 경험과 노하우를 정리하는 공간</strong>
        </p>
        <p>
          <strong>이런 걸 올려주세요:</strong>
        </p>
        <ul>
          <li>사이드프로젝트를 하며 겪은 일, 삽질기, 회고</li>
          <li>직접 써보고 배운 노하우와 TIL</li>
          <li>프로젝트를 만든 과정과 그 안에서의 시행착오</li>
        </ul>
        <p>
          <strong>작성 가이드:</strong>
        </p>
        <ul>
          <li>본인이 직접 쓴 글만 올려주세요</li>
          <li>다른 곳의 글을 가져올 때는 출처를 반드시 밝혀주세요</li>
          <li>
            광고·홍보가 목적인 글, 같은 글의 반복 게시는 삭제될 수 있습니다
          </li>
          <li>제목과 내용이 맞지 않는 낚시성 글은 지양해주세요</li>
        </ul>
        <h4>🏆 쇼케이스 (Showcase)</h4>
        <p>
          <strong>사이드프로젝트를 소개하고 업보트로 응원받는 공간</strong>
        </p>
        <p>
          <strong>등록 규칙:</strong>
        </p>
        <ul>
          <li>
            회원 본인(또는 함께 만든 팀원)이 만든 프로젝트만 등록해주세요.
            타인의 프로젝트나 스크린샷을 도용하면 삭제됩니다.
          </li>
          <li>소개 내용은 사실대로 작성하고, 링크는 실제로 작동해야 합니다.</li>
          <li>
            운영진이 SYDE 공식 SNS(인스타그램, 스레드 등)에서 프로젝트를 소개할
            수 있으며, 이 경우 작성자를 표기합니다. 원치 않으시면 언제든 삭제를
            요청할 수 있습니다. (<a href="/term">이용약관</a> 제17조 참고)
          </li>
        </ul>
        <p>
          <strong>이용 원칙:</strong>
        </p>
        <ul>
          <li>
            업보트는 실제 사용자의 진심 어린 평가입니다. 1인 1계정으로만
            참여해주세요.
          </li>
          <li>
            본인 프로젝트를 홍보하는 것은 환영하지만, 업보트 수를 인위적으로
            늘리는 행위는 금지합니다.
          </li>
          <li>
            부정 이용이 확인되면 프로젝트 삭제, 업보트 무효화, 계정 정지·탈퇴
            조치가 이뤄질 수 있습니다.
          </li>
          <li>
            의심되는 활동은{" "}
            <a href="mailto:by.sydestudio@gmail.com">by.sydestudio@gmail.com</a>
            으로 제보해주세요.
          </li>
        </ul>
        <h4>🤝 모임 (Meetup)</h4>
        <p>
          <strong>온/오프라인 소모임 참여</strong>
        </p>
        <p>
          <strong>참여 방법:</strong>
        </p>
        <ul>
          <li>관심 있는 모임에 자유롭게 신청</li>
          <li>모임 규칙과 일정 준수</li>
          <li>적극적인 참여와 네트워킹</li>
        </ul>
        <p>
          <strong>모임 개최 원하시면:</strong>
        </p>
        <ul>
          <li>
            반드시 <strong>운영진에게 사전 문의</strong> 필수 (
            <a href="mailto:by.sydestudio@gmail.com">by.sydestudio@gmail.com</a>
            )
          </li>
          <li>모임 목적과 계획서 제출</li>
          <li>승인 후 개최 가능</li>
        </ul>
        <p>
          <strong>참가비와 안전:</strong>
        </p>
        <ul>
          <li>
            참가비를 받는 모임은 신청 전에 금액, 환불·취소 규칙을 미리
            공지해주세요. 참가비 수수는 개최자와 참여자 사이의 일이며 SYDE는
            관여하지 않습니다.
          </li>
          <li>
            오프라인 모임에서 발생한 사고와 분쟁은 개최자와 참여자가 해결해야
            합니다. 개최자는 참여자의 안전을 우선으로 모임을 운영해주세요. (
            <a href="/term">이용약관</a> 제19조 참고)
          </li>
        </ul>
        <p>
          <strong>모임 예시:</strong>
        </p>
        <ul>
          <li>프로젝트 발표회, 스터디 그룹</li>
          <li>네트워킹 세션, 워크샵</li>
          <li>해커톤, 협업 프로젝트</li>
        </ul>
        <h4>🏆 클럽 (Club)</h4>
        <p>
          <strong>주제별 커뮤니티 참여</strong>
        </p>
        <p>
          <strong>가입 및 활동:</strong>
        </p>
        <ul>
          <li>관심 있는 클럽에 자유롭게 가입</li>
          <li>
            <strong>해당 클럽의 규칙 반드시 준수</strong>
          </li>
          <li>클럽 내 소모임 참여 가능</li>
          <li>클럽 전용 자료 및 정보 접근</li>
        </ul>
        <p>
          <strong>클럽 개설 원하시면:</strong>
        </p>
        <ul>
          <li>
            반드시 <strong>운영진에게 사전 문의</strong> 필수 (
            <a href="mailto:by.sydestudio@gmail.com">by.sydestudio@gmail.com</a>
            )
          </li>
          <li>클럽 주제와 운영 계획 제출</li>
          <li>승인 후 개설 가능</li>
        </ul>
        <p>
          <strong>클럽 예시:</strong>
        </p>
        <ul>
          <li>개발 언어별 클럽 (React, Python 등)</li>
          <li>분야별 클럽 (AI, 웹디자인, 마케팅 등)</li>
          <li>관심사별 클럽 (스타트업, 투자 등)</li>
        </ul>
        <hr />
        <h2>📞 문의</h2>
        <h3>공식 채널</h3>
        <ul>
          <li>
            <a href="mailto:by.sydestudio@gmail.com">by.sydestudio@gmail.com</a>
          </li>
        </ul>
        <hr />
        <p>
          <strong>함께 만드는 건강한 SYDE 커뮤니티 🚀</strong>
        </p>
        <p>이 가이드라인은 2026년 10월 18일부터 적용됩니다.</p>
      </div>
    </div>
  );
}
