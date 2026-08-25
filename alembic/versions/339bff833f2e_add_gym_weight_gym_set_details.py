"""add gym weight + gym_set_details

Revision ID: 339bff833f2e
Revises:
Create Date: 2026-08-26 01:00:52.582323

Adiciona:
- `gym_exercises.weight_value` (Numeric 7,2 NULL) e `weight_unit` (varchar(2) NULL)
  com check constraints (kg/lb, valor positivo).
- Nova tabela `gym_set_details` para séries individuais de um exercício
  (drop-sets / pirâmide) com FK para `gym_exercises` (CASCADE).
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "339bff833f2e"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1) Colunas de peso em gym_exercises
    op.add_column(
        "gym_exercises",
        sa.Column("weight_value", sa.Numeric(precision=7, scale=2), nullable=True),
    )
    op.add_column(
        "gym_exercises",
        sa.Column("weight_unit", sa.String(length=2), nullable=True),
    )
    op.create_check_constraint(
        "ck_gym_weight_unit",
        "gym_exercises",
        "weight_unit IS NULL OR weight_unit IN ('kg', 'lb')",
    )
    op.create_check_constraint(
        "ck_gym_weight_value_positive",
        "gym_exercises",
        "weight_value IS NULL OR weight_value > 0",
    )

    # 2) Nova tabela gym_set_details
    op.create_table(
        "gym_set_details",
        sa.Column("set_detail_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("exercise_id", sa.Integer(), nullable=False),
        sa.Column("set_index", sa.Integer(), nullable=False),
        sa.Column("reps", sa.Integer(), nullable=True),
        sa.Column("weight_value", sa.Numeric(precision=7, scale=2), nullable=True),
        sa.Column("weight_unit", sa.String(length=2), nullable=True),
        sa.CheckConstraint(
            "weight_unit IS NULL OR weight_unit IN ('kg', 'lb')",
            name="ck_set_weight_unit",
        ),
        sa.CheckConstraint(
            "weight_value IS NULL OR weight_value > 0",
            name="ck_set_weight_value_positive",
        ),
        sa.ForeignKeyConstraint(
            ["exercise_id"], ["gym_exercises.exercise_id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("set_detail_id"),
    )
    op.create_index(
        op.f("ix_gym_set_details_set_detail_id"),
        "gym_set_details",
        ["set_detail_id"],
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_gym_set_details_set_detail_id"), table_name="gym_set_details"
    )
    op.drop_table("gym_set_details")
    op.drop_constraint("ck_gym_weight_value_positive", "gym_exercises", type_="check")
    op.drop_constraint("ck_gym_weight_unit", "gym_exercises", type_="check")
    op.drop_column("gym_exercises", "weight_unit")
    op.drop_column("gym_exercises", "weight_value")
