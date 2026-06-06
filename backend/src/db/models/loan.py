import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.database import Base


# Lifecycle of a deal on the marketplace.
LOAN_STATUSES = (
    "pending_approval",  # submitted by business, awaiting platform review
    "open",              # live auction, investors can bid
    "funded",            # a bid was accepted, capital committed
    "repaid",            # trade completed, capital returned
    "closed",            # auction ended without funding
    "rejected",          # declined during review
)


class Loan(Base):
    """A single trade deal seeking financing — the core auction object."""

    __tablename__ = "loans"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid()
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    owner_user_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    # Deal description
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    purpose: Mapped[str | None] = mapped_column(String(255), nullable=True)
    trade_type: Mapped[str] = mapped_column(String(60), nullable=False, default="import")
    industry: Mapped[str] = mapped_column(String(120), nullable=False, default="Trade")
    goods: Mapped[str | None] = mapped_column(String(255), nullable=True)
    origin_country: Mapped[str | None] = mapped_column(String(120), nullable=True)
    destination_country: Mapped[str | None] = mapped_column(String(120), nullable=True)

    # Financing terms
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(8), nullable=False, default="HKD")
    term_days: Mapped[int] = mapped_column(Integer, nullable=False, default=90)
    interest_rate: Mapped[float] = mapped_column(Float, nullable=False, default=8.0)
    funded_amount: Mapped[Decimal] = mapped_column(
        Numeric(15, 2), nullable=False, default=0, server_default="0"
    )

    auction_deadline: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="pending_approval", index=True
    )

    # Placeholder TradeFlow Score (real scoring engine is out of MVP scope)
    risk_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    risk_grade: Mapped[str | None] = mapped_column(String(2), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    company: Mapped["Company"] = relationship(  # noqa: F821
        back_populates="loans", lazy="selectin"
    )
    bids: Mapped[list["Bid"]] = relationship(  # noqa: F821
        back_populates="loan",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="Bid.created_at.desc()",
    )
    documents: Mapped[list["File"]] = relationship(  # noqa: F821
        lazy="selectin",
        order_by="File.created_at.desc()",
    )
