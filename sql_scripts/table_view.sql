SELECT
    "title",
    "question"."id" AS "question_id", 
    "isAdaptive",
    "ai_generated",
    "status",
    "user_id",
    "user"."email" as "Created By",
    "institution"."name" as "Institution",
    "language"
FROM
    "question"
    JOIN "developer_profile" ON "developer_profile"."id" = "question"."created_by_id"
    JOIN "user" ON "user"."id" = "developer_profile"."user_id"
    JOIN "institution" on "user"."institution_id" = "institution"."id"
    JOIN "question_runtime"
    ON "question_runtime"."question_id" = "question"."id"


