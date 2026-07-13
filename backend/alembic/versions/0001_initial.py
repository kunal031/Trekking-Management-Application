"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-07-03
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    user_role = postgresql.ENUM("ADMIN", "STAFF", "USER", name="userrole")
    staff_status = postgresql.ENUM("Available", "On-Trek", "Leave", name="staffstatus")
    difficulty = postgresql.ENUM("EASY", "MODERATE", "HARD", name="difficulty")
    trek_status = postgresql.ENUM("PENDING", "APPROVED", "OPEN", "CLOSED", "COMPLETED", name="trekstatus")
    booking_status = postgresql.ENUM("BOOKED", "CANCELLED", "COMPLETED", name="bookingstatus")
    payment_status = postgresql.ENUM("PENDING", "COMPLETED", "REFUNDED", name="paymentstatus")

    # bind = op.get_bind()
    # for enum in (user_role, staff_status, difficulty, trek_status, booking_status, payment_status):
    #     enum.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(320), nullable=False, unique=True, index=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("first_name", sa.String(100), nullable=False),
        sa.Column("last_name", sa.String(100), nullable=False),
        sa.Column("role", user_role, nullable=False, server_default="USER"),
        sa.Column("phone", sa.String(30)),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("is_blacklisted", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "staff_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("contact_details", sa.Text()),
        sa.Column("skills", postgresql.ARRAY(sa.String()), nullable=False, server_default="{}"),
        sa.Column("status", staff_status, nullable=False, server_default="Available"),
    )
    op.create_table(
        "treks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("location", sa.String(200), nullable=False, index=True),
        sa.Column("difficulty", difficulty, nullable=False, index=True),
        sa.Column("duration_days", sa.Integer(), nullable=False),
        sa.Column("total_slots", sa.Integer(), nullable=False),
        sa.Column("available_slots", sa.Integer(), nullable=False),
        sa.Column("assigned_staff_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("staff_profiles.id", ondelete="SET NULL")),
        sa.Column("status", trek_status, nullable=False, server_default="PENDING", index=True),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("price_usd", sa.Numeric(10, 2), nullable=False),
        sa.CheckConstraint("end_date >= start_date", name="ck_treks_end_after_start"),
        sa.CheckConstraint("available_slots >= 0 AND available_slots <= total_slots", name="ck_treks_slots_valid"),
    )
    op.create_table(
        "bookings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("trek_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("treks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("booking_date", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("status", booking_status, nullable=False, server_default="BOOKED"),
        sa.Column("payment_status", payment_status, nullable=False, server_default="PENDING"),
        sa.Column("slots_booked", sa.Integer(), nullable=False),
        sa.UniqueConstraint("user_id", "trek_id", name="uq_booking_user_trek"),
        sa.CheckConstraint("slots_booked > 0", name="ck_booking_slots_positive"),
    )


def downgrade() -> None:
    op.drop_table("bookings")
    op.drop_table("treks")
    op.drop_table("staff_profiles")
    op.drop_table("users")
    for name in ("paymentstatus", "bookingstatus", "trekstatus", "difficulty", "staffstatus", "userrole"):
        postgresql.ENUM(name=name).drop(op.get_bind(), checkfirst=True)
