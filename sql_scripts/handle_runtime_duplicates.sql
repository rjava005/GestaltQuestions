BEGIN;

-- SELECT * from question_runtime;
DELETE FROM question_runtime
WHERE id IN (
    SELECT id
    FROM (
        SELECT
            id,
            ROW_NUMBER() OVER (
                PARTITION BY question_id
                ORDER BY id
            ) AS rn
        FROM question_runtime
    ) duplicates
    WHERE rn > 1
);
select * from question_runtime;

ROLLBACK;