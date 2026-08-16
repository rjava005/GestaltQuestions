"""Add secure question instances.

Revision ID: c8f0d12a5e42
Revises: aa4da4b641e1
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c8f0d12a5e42"
down_revision: str | Sequence[str] | None = "aa4da4b641e1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "question_instance",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("question_id", sa.Uuid(), nullable=False),
        sa.Column("private_grading_data", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["question_id"], ["question.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_question_instance_question_id", "question_instance", ["question_id"]
    )
    op.create_index(
        "ix_question_instance_expires_at", "question_instance", ["expires_at"]
    )


def downgrade() -> None:
    op.drop_index("ix_question_instance_expires_at", table_name="question_instance")
    op.drop_index("ix_question_instance_question_id", table_name="question_instance")
    op.drop_table("question_instance")
