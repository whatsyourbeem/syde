# Supabase 로컬 개발 환경 구축 가이드

이 문서는 라이브 DB의 안전을 보존하면서 로컬에서 독립적으로 개발하기 위해 Supabase CLI를 사용하여 로컬 환경을 구축하는 방법을 설명합니다.

## 1. 전제 조건

개발 환경에 다음 도구들이 설치되어 있어야 합니다.

- **Docker Desktop**: 로컬 Supabase 인스턴스는 Docker 컨테이너로 실행됩니다. ([다운로드](https://www.docker.com/products/docker-desktop/))
- **Supabase CLI**: 프로젝트별 버전 관리를 위해 NPM을 통한 설치와 `npx` 사용을 권장합니다.
  ```bash
  # 프로젝트 로컬에 개발 의존성으로 설치
  npm install supabase --save-dev
  ```

---

## 2. 초기 설정 및 라이브 환경 연결

프로젝트 루트 디렉토리에서 다음 과정을 진행합니다.

### 2.1 로컬 환경 초기화
프로젝트에 Supabase 설정을 초기화합니다.
```bash
npx supabase init
```

### 2.2 라이브 프로젝트 연결
Supabase 계정에 로그인하고 라이브 프로젝트와 로컬 환경을 연결합니다.
```bash
npx supabase login
npx supabase link --project-ref <라이브-프로젝트-참조-ID>
```

> [!IMPORTANT]
> **`npx supabase link` 명령어 자체는 라이브 DB의 데이터를 변경하거나 삭제하지 않습니다.**
> 이 명령어는 단순히 로컬 CLI 설정 파일(`.supabase/config.toml` 등)에 "이 로컬 프로젝트는 저 원격 프로젝트와 짝꿍이다"라는 정보를 기록하는 역할만 합니다.

> [!CAUTION]
> **연결(Link) 후 주의사항**
> 연결이 완료된 후부터는 원격(Remote) DB에 변경 사항을 적용하는 명령어를 사용할 수 있게 됩니다. **라이브 서비스에 직접적인 영향을 줄 수 있는 다음 명령어들은 실행 전 반드시 확인이 필요합니다:**
>
> 1.  **`npx supabase db push`**: 로컬의 마이그레이션 파일들을 라이브 DB에 적용합니다. (스키마 구조 변경)
> 2.  **`npx supabase db reset --linked`**: **[매우 위험]** 연결된 원격 DB를 초기화합니다. 절대 주의가 필요합니다.
> 3.  **`npx supabase functions deploy`**: 로컬에서 작성한 Edge Functions를 라이브 환경에 배포(덮어쓰기)합니다.
> 4.  **`npx supabase secrets set`**: 라이브 환경의 환경 변수(Secrets)를 설정하거나 변경합니다.
>
> 로컬 개발 시에는 항상 `npx supabase start`, `npx supabase db reset`, `npx supabase stop` 등 **대상 프로젝트가 명시되지 않은 로컬 전용 명령어**만 사용하도록 습관을 들이는 것이 안전합니다.
>
> ---
>
> [!TIP]
> **안심하고 사용할 수 있는 안전한 명령어 리스트:**
> 로컬 환경(Docker)에만 영향을 주거나, 정보를 읽어오기만 하는 안전한 명령어들입니다.
>
> 1.  **`npx supabase start` / `stop`**: 로컬 서버를 켜고 끕니다.
> 2.  **`npx supabase status`**: 현재 로컬 서비스의 접속 정보(URL, Key 등)를 확인합니다.
> 3.  **`npx supabase db reset`**: 로컬 DB를 초기화하고 `seed.sql` 데이터를 다시 로드합니다. (라이브 영향 없음)
> 4.  **`npx supabase db pull`**: 라이브 DB의 구조를 로컬로 **가져오기만** 합니다. (라이브 데이터 변경 없음)
> 5.  **`npx supabase migration new <이름>`**: 새로운 마이그레이션 파일을 로컬에 생성합니다.
> 6.  **`npx supabase gen types typescript --local`**: 로컬 DB 구조를 바탕으로 TypeScript 타입을 생성합니다.

> [!TIP]
> **Project Ref**는 Supabase Dashboard의 Project Settings -> General에서 확인할 수 있습니다.

### 2.3 실시간 스키마 복제 (Optional but Recommended)
라이브 DB의 테이블 구조를 로컬 설정 파일로 가져옵니다.
```bash
npx supabase db pull
```

---

## 3. 로컬 서버 실행

Docker가 실행 중인지 확인한 후 다음 명령어를 입력합니다.
```bash
npx supabase start
```
명령어가 완료되면 로컬에서 실행 중인 **Studio URL**, **API URL**, **anon key** 등이 출력됩니다. 출력된 정보를 바탕으로 `.env.local`을 업데이트해야 합니다.

### 3.1 환경 변수 업데이트
로컬 개발 시에는 `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL`을 로컬 API URL(기본값: `http://127.0.0.1:54321`)로 변경해야 합니다.

> [!TIP]
> **CLI로 한 번에 확인하고 복사하기**
> 다음 명령어를 사용하면 로컬 환경에 필요한 변수 리스트를 한눈에 확인할 수 있습니다.
> ```bash
> npx supabase status -o env
> ```
> 이 출력물에서 필요한 키 값을 `.env.local`에 복사하면 편리합니다.

> [!TIP]
> **터미널 명령어 한 줄로 업데이트하기 (macOS)**
> 파일을 직접 열지 않고 다음 명령어를 터미널에 복사 붙여넣기 하면 `NEXT_PUBLIC_SUPABASE_URL` 값이 로컬 주소로 즉시 변경됩니다.
> ```bash
> sed -i '' 's|^NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321|' .env.local
> ```
> *(라이브 주소로 다시 돌릴 때도 URL 부분만 바꿔서 실행하면 편리합니다.)*

---

## 4. 라이브 데이터 복제하기 (Data Seeding)

대시보드에 접속하지 않고 CLI만 사용하여 라이브 DB의 데이터를 로컬로 가져오는 방법입니다.

### 4.1 라이브 데이터 덤프 (추출)
라이브 DB의 모든 데이터를 추출하여 로컬의 `seed.sql` 파일로 저장합니다. `npx supabase link`가 완료된 상태라면 `--linked` 플래그를 사용하여 간편하게 추출할 수 있습니다.
```bash
npx supabase db dump --data-only --linked > supabase/seed.sql
```

### 4.2 로컬 DB에 데이터 적용
저장된 `seed.sql` 파일을 사용하여 로컬 DB를 초기화하고 데이터를 채웁니다.
```bash
npx supabase db reset
```

> [!NOTE]
> `supabase/seed.sql`에 저장된 데이터는 `npx supabase db reset` 명령어가 실행될 때마다 자동으로 로컬 DB에 삽입됩니다. 개발 중 로컬 DB를 깨끗하게 비우고 다시 시작하고 싶을 때 유용합니다.
>
> **주의: `seed.sql` 파일에는 실제 사용자 데이터가 포함될 수 있으므로, `.gitignore`에 추가되어 있는지 확인하고 GitHub 등에 커밋되지 않도록 주의하세요. (현재 프로젝트 설정에는 이미 추가되어 있습니다)**

---

## 5. 로컬 개발 시 유의사항

- **안전성**: 로컬에서 DB를 마음껏 수정, 삭제해도 라이브 DB에는 전혀 영향을 주지 않습니다.
- **마이그레이션**: 로컬에서 변경한 스키마를 라이브에 적용하고 싶을 때는 `npx supabase db push` 명령어를 사용합니다. (주의 필요)
  > [!TIP]
  > **적용 전 스키마 차이점(Diff) 확인하기**
  > 라이브 DB에 실제로 어떤 변경 사항이 생길지 미리 확인하고 싶다면 다음 명령어를 사용하세요.
  > ```bash
  > npx supabase db diff --linked
  > ```
  > 이 명령은 로컬의 마이그레이션 파일들과 라이브 DB의 현재 상태를 비교하여 차이점을 SQL 형태로 보여줍니다. 이를 통해 의도치 않은 변경이 포함되지 않았는지 미리 검토할 수 있습니다.

---

## 6. 자주 사용하는 명령어 요약

| 명령어 | 설명 |
| :--- | :--- |
| `npx supabase start` | 로컬 Supabase 서비스 시작 (Docker) |
| `npx supabase stop` | 로컬 서비스 중지 |
| `npx supabase status` | 로컬 서비스 상태 및 접속 정보 확인 |
| `npx supabase db reset` | 로컬 DB 초기화 및 `seed.sql` 재적용 |
| `npx supabase db pull` | 라이브 DB 스키마를 프로젝트 파일로 가져오기 |
