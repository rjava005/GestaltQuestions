SELECT
    "question"."id" AS "question_id",
    "question"."title",
    "institution"."name" as "Institution",
    "user"."email" as "Created By",
    "question"."status",
    array_agg("topic"."name" ORDER BY "topic"."name") AS "topics",
    array_agg(DISTINCT  "question_type"."name" ORDER BY "question_type"."name") as "question_type",
    "question_runtime"."language" as "available_runtime",
    "question"."created_at"
FROM "question"
JOIN "question_topic_link"
    ON "question_topic_link"."question_id" = "question"."id"
JOIN "topic"
    ON "topic"."id" = "question_topic_link"."topic_id"
JOIN "question_qtype_link"
    ON "question_qtype_link"."question_id" ="question"."id"
JOIN "question_type"
    ON "question_type"."id" = "question_qtype_link"."qtype_id"  
LEFT JOIN "question_runtime"
    ON "question_runtime"."question_id" = "question"."id"

JOIN "developer_profile" 
    ON "developer_profile"."id" = "question"."created_by_id"
JOIN "user" 
    ON "user"."id" = "developer_profile"."user_id"
JOIN "institution" 
    ON "user"."institution_id" = "institution"."id"


GROUP BY
    "question"."id",
    "question"."title",
    "question"."status",
    "institution"."name",
    "user"."email",
    "question_runtime"."language";
    

ORDER BY "question"."created_at" DESC