import csv
from datetime import date, datetime, timedelta, timezone
from email.message import EmailMessage
from pathlib import Path
from uuid import UUID

import aiosmtplib

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.booking import Booking
from app.models.enums import BookingStatus, TrekStatus, UserRole
from app.models.trek import Trek
from app.models.user import User


async def send_message(destination: str, subject: str, body: str, attachment_path: Path | None = None, attachment_name: str | None = None) -> None:
    if settings.smtp_host:
        message = EmailMessage()
        message["From"] = settings.smtp_from_email or "noreply@tma-v2.com"
        message["To"] = destination
        message["Subject"] = subject
        message.set_content(body)
        
        if attachment_path and attachment_path.exists():
            with attachment_path.open('rb') as f:
                message.add_attachment(
                    f.read(),
                    maintype='text',
                    subtype='csv',
                    filename=attachment_name or attachment_path.name
                )
        
        try:
            await aiosmtplib.send(
                message,
                hostname=settings.smtp_host,
                port=settings.smtp_port or 587,
                username=settings.smtp_user,
                password=settings.smtp_password,
                start_tls=True,
            )
            print(f"[email] Successfully sent email to {destination}")
        except Exception as e:
            print(f"[email error] Failed to send email to {destination}: {e}")
    else:
        print(f"[notification] to={destination} subject={subject} body={body}")


async def send_trek_reminders(session: AsyncSession) -> None:
    reminder_date = date.today() + timedelta(days=2)
    result = await session.execute(
        select(Booking, Trek, User)
        .join(Trek, Booking.trek_id == Trek.id)
        .join(User, Booking.user_id == User.id)
        .where(Booking.status == BookingStatus.BOOKED, Trek.start_date == reminder_date)
    )
    for booking, trek, user in result.all():
        await send_message(user.email, f"Reminder: {trek.name}", f"Your trek starts on {trek.start_date}. Booking {booking.id}.")


async def send_monthly_activity_report(session: AsyncSession) -> None:
    booking_count = await session.scalar(select(func.count(Booking.id)).where(Booking.status == BookingStatus.BOOKED))
    popular_routes: Select = (
        select(Trek.location, func.count(Booking.id).label("total"))
        .join(Booking, Booking.trek_id == Trek.id)
        .where(Booking.status == BookingStatus.BOOKED)
        .group_by(Trek.location)
        .order_by(func.count(Booking.id).desc())
        .limit(5)
    )
    routes = (await session.execute(popular_routes)).all()
    admins = (await session.scalars(select(User).where(User.role == UserRole.ADMIN, User.is_active.is_(True)))).all()
    body = f"Successful bookings: {booking_count or 0}. Popular routes: {routes}."
    for admin in admins:
        await send_message(admin.email, "TMA monthly activity report", body)


async def export_booking_history(user_id: str) -> str:
    export_dir = Path("exports")
    export_dir.mkdir(exist_ok=True)

    async with AsyncSessionLocal() as session:
        user = await session.get(User, UUID(user_id))
        if not user:
            print(f"Error: No user found with ID {user_id}")
            return
        user_email = user.email
        user_name = user.first_name or "user"

        bookings = (
            await session.scalars(
                select(Booking)
                .options(selectinload(Booking.trek))
                .where(Booking.user_id == UUID(user_id))
                .order_by(Booking.booking_date.desc())
            )
        ).all()
        
    if bookings:
        from_date = bookings[-1].booking_date.strftime("%Y-%m-%d")
        to_date = bookings[0].booking_date.strftime("%Y-%m-%d")
    else:
        from_date = to_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        
    filename = f"{user_name}_booking_history_{from_date}_to_{to_date}.csv"
    output_path = export_dir / filename

    with output_path.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(["booking_id", "trek_name", "location", "booking_date", "status", "payment_status", "slots_booked"])
        for booking in bookings:
            writer.writerow(
                [
                    booking.id,
                    booking.trek.name if booking.trek else "",
                    booking.trek.location if booking.trek else "",
                    booking.booking_date,
                    booking.status.value if booking.status else "",
                    booking.payment_status.value if booking.payment_status else "",
                    booking.slots_booked,
                ]
            )
    print(f"[export] Wrote {output_path}")

    try:
        await send_message(
            user_email, 
            "Your Booking History Export", 
            "Please find your requested booking history CSV attached.",
            attachment_path=output_path,
            attachment_name=filename
        )
    except Exception as e:
        print(f"[export] Warning: Failed to send message to {user_email}. Error: {e}")
    
    with output_path.open("r", encoding="utf-8") as f:
        csv_content = f.read()
    return csv_content
