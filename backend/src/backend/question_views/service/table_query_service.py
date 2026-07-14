from sqlmodel import Session
from sqlalchemy import text
from backend.question_views.schema import QuestionSearchParams
from typing import Any
from sqlalchemy import TextClause
from uuid import UUID
from backend.question_views.schema import QuestionTableRow
from backend.shared import ID
from backend.utils import convert_uuid
from enum import StrEnum


def _enum_names(value: StrEnum | list[StrEnum] | None) -> list[str]:
    if value is None:
        return []
    values = value if isinstance(value, list) else [value]
    return [item.name for item in values]

class TableQueryService:
    def __init__(self, session: Session):
        self._session = session

    def search(
        self,
        params: QuestionSearchParams | None = None,
    ) -> list[QuestionTableRow]:
        return self._search(params)

    def search_user_questions(
        self,
        user_id: ID,
        params: QuestionSearchParams | None = None,
    ) -> list[QuestionTableRow]:
        return self._search(params, owner_id=convert_uuid(user_id))

    def search_published_questions(
        self,
        params: QuestionSearchParams | None = None,
    ) -> list[QuestionTableRow]:
        params = (params or QuestionSearchParams()).model_copy(
            update={"published": True, "status": None}
        )
        return self._search(params)

    def _search(
        self,
        params: QuestionSearchParams | None = None,
        *,
        owner_id: UUID | None = None,
        developer_profile_id: UUID | None = None,
    ):
        query = self._build_query(
            params, owner_id=owner_id, developer_profile_id=developer_profile_id
        )
        result = self._session.execute(query)
        return [
            QuestionTableRow.model_validate(dict(row))
            for row in result.mappings().all()
        ]

    def _build_query(
        self,
        params: QuestionSearchParams | None = None,
        *,
        owner_id: UUID | None = None,
        developer_profile_id: UUID | None = None,
    ) -> TextClause:
        params = params or QuestionSearchParams()

        where_clauses: list[str] = []
        query_params: dict[str, Any] = {
            "limit": params.limit,
            "offset": params.offset,
        }
        if params.search:
            where_clauses.append("title ILIKE :search")
            query_params["search"] = f"%{params.search}%"
        if params.published is not None:
            where_clauses.append("status = :published_status")
            query_params["published_status"] = (
                "PUBLISHED" if params.published else "DRAFT"
            )
        elif params.status:
            where_clauses.append("status = :status")
            query_params["status"] = params.status.name
        if params.topic:
            where_clauses.append(
                "EXISTS ("
                "SELECT 1 FROM unnest(topics) AS topic_item(topic) "
                "WHERE topic ILIKE :topic"
                ")"
            )
            query_params["topic"] = f"%{params.topic}%"
        if params.qtype:
            qtype_names = _enum_names(params.qtype)
            where_clauses.append(
                "("
                + " OR ".join(
                    f":qtype_{index} = ANY(question_type)"
                    for index in range(len(qtype_names))
                )
                + ")"
            )
            query_params.update(
                {f"qtype_{index}": qtype for index, qtype in enumerate(qtype_names)}
            )
        if params.language:
            language_names = _enum_names(params.language)
            where_clauses.append(
                "("
                + " OR ".join(
                    f":language_{index} = ANY(available_runtimes)"
                    for index in range(len(language_names))
                )
                + ")"
            )
            query_params.update(
                {
                    f"language_{index}": language
                    for index, language in enumerate(language_names)
                }
            )
        if params.institution:
            where_clauses.append("institution = :institution")
            query_params["institution"] = params.institution.name

        if owner_id:
            where_clauses.append("owner_id = :owner_id")
            query_params["owner_id"] = owner_id

        if developer_profile_id:
            where_clauses.append("developer_profile_id = :developer_profile_id")
            query_params["developer_profile_id"] = developer_profile_id

        if params.isAdaptive is not None:
            where_clauses.append('"isAdaptive" = :isAdaptive')
            query_params["isAdaptive"] = params.isAdaptive
        where_sql = ""
        if where_clauses:
            where_sql = "WHERE " + " AND ".join(where_clauses)

        statement = text(f"""
            SELECT * from question_table_view
            {where_sql}
            ORDER BY updated_at DESC NULLS LAST, created_at DESC
            LIMIT :limit
            OFFSET :offset
        """)
        return statement.bindparams(**query_params)


if __name__ == "__main__":
    from backend.database import engine
    import json

    with Session(engine) as session:
        result = TableQueryService(session).search(
            params=QuestionSearchParams(search="energy")
        )
        print(json.dumps(result, indent=4, default=str))
