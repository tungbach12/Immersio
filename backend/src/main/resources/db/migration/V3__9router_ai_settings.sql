-- V3: point all AI features at 9Router VPS1 (model "immersio").
-- Upsert so re-run / pre-seeded rows converge to the same values.
INSERT INTO "SystemSettings"("Key", "Value") VALUES
    ('LlmEndpoint', 'https://9routerhelios.duckdns.org/v1/chat/completions'),
    ('ModelChat', 'immersio'),
    ('ModelGrammar', 'immersio'),
    ('ModelFeedback', 'immersio'),
    ('ModelFlashcard', 'immersio'),
    ('ModelPhrase', 'immersio')
ON CONFLICT("Key") DO UPDATE SET "Value" = EXCLUDED."Value";
