"""tradeflow marketplace: companies, loans, bids + loan-linked files

Revision ID: b1f2c3d4e5f6
Revises: dc0e0ed8d1b9
Create Date: 2026-06-06 23:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b1f2c3d4e5f6'
down_revision: Union[str, None] = 'dc0e0ed8d1b9'
branch_labels: Union[Sequence[str], None] = None
depends_on: Union[Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'companies',
        sa.Column('id', sa.Uuid(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('owner_user_id', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('industry', sa.String(length=120), nullable=False),
        sa.Column('country', sa.String(length=120), nullable=False),
        sa.Column('city', sa.String(length=120), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('website', sa.String(length=255), nullable=True),
        sa.Column('logo_url', sa.String(length=1024), nullable=True),
        sa.Column('founded_year', sa.Integer(), nullable=True),
        sa.Column('employees', sa.Integer(), nullable=True),
        sa.Column('annual_revenue', sa.Integer(), nullable=True),
        sa.Column('registration_no', sa.String(length=120), nullable=True),
        sa.Column('contact_name', sa.String(length=255), nullable=True),
        sa.Column('contact_email', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_companies_owner_user_id'), 'companies', ['owner_user_id'], unique=False)

    op.create_table(
        'loans',
        sa.Column('id', sa.Uuid(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('company_id', sa.Uuid(), nullable=False),
        sa.Column('owner_user_id', sa.String(length=255), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('purpose', sa.String(length=255), nullable=True),
        sa.Column('trade_type', sa.String(length=60), nullable=False),
        sa.Column('industry', sa.String(length=120), nullable=False),
        sa.Column('goods', sa.String(length=255), nullable=True),
        sa.Column('origin_country', sa.String(length=120), nullable=True),
        sa.Column('destination_country', sa.String(length=120), nullable=True),
        sa.Column('amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=8), nullable=False),
        sa.Column('term_days', sa.Integer(), nullable=False),
        sa.Column('interest_rate', sa.Float(), nullable=False),
        sa.Column('funded_amount', sa.Numeric(precision=15, scale=2), server_default='0', nullable=False),
        sa.Column('auction_deadline', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('risk_score', sa.Integer(), nullable=True),
        sa.Column('risk_grade', sa.String(length=2), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_loans_company_id'), 'loans', ['company_id'], unique=False)
    op.create_index(op.f('ix_loans_owner_user_id'), 'loans', ['owner_user_id'], unique=False)
    op.create_index(op.f('ix_loans_status'), 'loans', ['status'], unique=False)

    op.create_table(
        'bids',
        sa.Column('id', sa.Uuid(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('loan_id', sa.Uuid(), nullable=False),
        sa.Column('lender_user_id', sa.String(length=255), nullable=False),
        sa.Column('lender_name', sa.String(length=255), nullable=False),
        sa.Column('amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('interest_rate', sa.Float(), nullable=False),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['loan_id'], ['loans.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_bids_loan_id'), 'bids', ['loan_id'], unique=False)
    op.create_index(op.f('ix_bids_lender_user_id'), 'bids', ['lender_user_id'], unique=False)
    op.create_index(op.f('ix_bids_status'), 'bids', ['status'], unique=False)

    op.add_column('files', sa.Column('loan_id', sa.Uuid(), nullable=True))
    op.add_column('files', sa.Column('category', sa.String(length=60), nullable=True))
    op.create_index(op.f('ix_files_loan_id'), 'files', ['loan_id'], unique=False)
    op.create_foreign_key(
        'fk_files_loan_id_loans', 'files', 'loans', ['loan_id'], ['id'], ondelete='CASCADE'
    )


def downgrade() -> None:
    op.drop_constraint('fk_files_loan_id_loans', 'files', type_='foreignkey')
    op.drop_index(op.f('ix_files_loan_id'), table_name='files')
    op.drop_column('files', 'category')
    op.drop_column('files', 'loan_id')

    op.drop_index(op.f('ix_bids_status'), table_name='bids')
    op.drop_index(op.f('ix_bids_lender_user_id'), table_name='bids')
    op.drop_index(op.f('ix_bids_loan_id'), table_name='bids')
    op.drop_table('bids')

    op.drop_index(op.f('ix_loans_status'), table_name='loans')
    op.drop_index(op.f('ix_loans_owner_user_id'), table_name='loans')
    op.drop_index(op.f('ix_loans_company_id'), table_name='loans')
    op.drop_table('loans')

    op.drop_index(op.f('ix_companies_owner_user_id'), table_name='companies')
    op.drop_table('companies')
