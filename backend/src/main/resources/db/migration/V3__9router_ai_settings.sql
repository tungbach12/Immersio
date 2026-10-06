-- V3: point all AI features at 9Router VPS1 (model "immersio").
-- Idempotent on purpose: prod SystemSettings has no unique constraint on
-- "Key", so ON CONFLICT is unavailable — UPDATE first, INSERT what is missing.
UPDATE "SystemSettings" SET "Value" = 'https://9routerhelios.duckdns.org/v1/chat/completions' WHERE "Key" = 'LlmEndpoint';
UPDATE "SystemSettings" SET "Value" = 'immersio' WHERE "Key" IN ('ModelChat', 'ModelGrammar', 'ModelFeedback', 'ModelFlashcard', 'ModelPhrase');

INSERT INTO "SystemSettings"("Key", "Value", "UpdatedAt")
SELECT v."Key", v."Value", NOW() AT TIME ZONE 'utc'
FROM (VALUES
    ('LlmEndpoint', 'https://9routerhelios.duckdns.org/v1/chat/completions'),
    ('ModelChat', 'immersio'),
    ('ModelGrammar', 'immersio'),
    ('ModelFeedback', 'immersio'),
    ('ModelFlashcard', 'immersio'),
    ('ModelPhrase', 'immersio')
) AS v("Key", "Value")
WHERE NOT EXISTS (
    SELECT 1 FROM "SystemSettings" s WHERE s."Key" = v."Key"
);
