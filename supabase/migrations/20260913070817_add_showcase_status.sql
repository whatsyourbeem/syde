-- Add project status (개발 중 / 서비스 중 / 서비스 종료) to showcases
CREATE TYPE "public"."showcase_status_enum" AS ENUM ('DEVELOPING', 'IN_SERVICE', 'ENDED');

ALTER TABLE "public"."showcases"
  ADD COLUMN "status" "public"."showcase_status_enum" NOT NULL DEFAULT 'DEVELOPING';
