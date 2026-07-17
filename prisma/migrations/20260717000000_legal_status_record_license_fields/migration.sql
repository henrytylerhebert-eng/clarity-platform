-- Adds license identifiers to LegalStatusRecord so an issuing professional's
-- OPC/PEC/CEC history can be queried by (board, license number) — the stable
-- key for a professional's identity, since there is no cross-organization
-- "professional" entity in this schema (see packages/legal-hold-forms).
ALTER TABLE "LegalStatusRecord"
  ADD COLUMN "authorizingLicenseBoard" TEXT,
  ADD COLUMN "authorizingLicenseNumber" TEXT;

CREATE INDEX "LegalStatusRecord_authorizingLicenseBoard_authorizingLicense_id"
  ON "LegalStatusRecord" ("authorizingLicenseBoard", "authorizingLicenseNumber");
