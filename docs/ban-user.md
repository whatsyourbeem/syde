# 스팸 유저 차단(블랙리스트) 운영 가이드

차단된 유저는 `public.banned_users`에 등록되며, 같은 이메일(대소문자 무시) 또는 같은 소셜 계정으로
재가입하면 `handle_new_user` 트리거가 `USER_BANNED` 예외를 던져 계정 생성이 거부된다.
`/auth/error` 화면에는 "이용이 제한된 계정입니다" 안내와 문의 이메일이 표시된다.

`banned_users`는 RLS가 켜져 있고 정책이 없다. Supabase 대시보드(SQL Editor)나 service role로만 접근할 수 있다.

## 차단 절차

**반드시 1(등록) → 2(삭제) 순서로 한다.** 삭제 후에는 식별 정보를 조회할 수 없다.

1. 대상 유저의 식별 정보 조회 후 `banned_users`에 등록

   ```sql
   -- 이메일 또는 username 으로 찾기
   select u.id, u.email, i.provider, i.provider_id
   from auth.users u
   join auth.identities i on i.user_id = u.id
   where u.email = 'spam@example.com';

   insert into public.banned_users (email, provider, provider_user_id, reason)
   values ('spam@example.com', 'kakao', '<provider_id>', '스팸 게시글 반복');
   ```

   - 카카오 계정 등 이메일이 없으면 `email`은 `null`로 두고 provider 쌍만 넣는다.
   - 이메일과 provider 쌍 중 하나는 반드시 있어야 하고, `provider`와 `provider_user_id`는 함께 넣어야 한다.
   - 한 유저가 여러 소셜 계정을 연결했다면 identity마다 row를 추가한다.

2. 대시보드 Authentication > Users에서 해당 유저 삭제 (게시물 등은 CASCADE로 함께 삭제됨)

3. (선택) 스토리지에 남은 아바타/로그 이미지는 CASCADE로 지워지지 않으므로 필요하면 수동 정리

## 차단 해제

```sql
delete from public.banned_users where email = 'spam@example.com';
```

## 참고

- 이메일과 소셜 계정을 모두 바꿔서 가입하는 경우는 막을 수 없다.
- Supabase가 OAuth 가입 실패를 "Database error saving new user"로만 전달하는 경우가 있어,
  `/auth/error`는 해당 문구도 차단 안내로 처리한다.
