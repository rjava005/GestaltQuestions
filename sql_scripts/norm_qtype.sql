BEGIN;
-- Create the enum
CREATE TYPE qtype as ENUM(
    'MC',
    'MCQ',
    'MA',
    'TF',
    'FB',
    'NUM'
);
-- Alter the reference table
INSERT INTO question_qtype_link (question_id, qtype_id)
SELECT
    question_id,
    (
        SELECT id
        FROM question_type
        WHERE name = 'numerical'
    )
FROM question_qtype_link
WHERE qtype_id IN (
    SELECT id
    FROM question_type
    WHERE name IN ('computational', 'derivation', 'numeric', 'analysis')
)
ON CONFLICT DO NOTHING;

DELETE FROM question_qtype_link
WHERE qtype_id IN (
    SELECT id
    FROM question_type
    WHERE name IN ('computational', 'derivation', 'numeric','analysis')
);
DELETE FROM question_type
WHERE name IN (
    'computational',
    'derivation',
    'numeric',
    'analysis'
);
SELECT * from question_qtype_link;
SELECT * from question_type;

-- Alter the table by mapping existing values to other
ALTER TABLE question_type 
ALTER COLUMN "name" 
TYPE qtype
USING (
    CASE
        WHEN name = 'computational' THEN 'NUM'
        WHEN name = 'derivation'    THEN 'NUM'
        WHEN name = 'numerical'     THEN 'NUM'
        WHEN name = 'numeric'       THEN 'NUM'
        WHEN name = 'analysis'      THEN 'NUM'   -- or whatever mapping you intend
        ELSE NULL
    END
)::qtype;
SELECT * from question_type;
ROLLBACK;