"""add import_logs table

Revision ID: 3aaff18e030f
Revises: 
Create Date: 2026-07-03 18:42:00.916383
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


revision: str = '3aaff18e030f'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('import_logs',
    sa.Column('id', UUID(as_uuid=True), nullable=False),
    sa.Column('user_id', UUID(as_uuid=True), nullable=False),
    sa.Column('title_name', sa.String(length=255), nullable=False),
    sa.Column('tmdb_id', sa.Integer(), nullable=True),
    sa.Column('media_type', sa.String(length=10), nullable=False),
    sa.Column('title_id', UUID(as_uuid=True), nullable=True),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('error_message', sa.Text(), nullable=True),
    sa.Column('imported_at', sa.DateTime(timezone=True), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('import_logs')
