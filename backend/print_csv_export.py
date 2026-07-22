import asyncio
import csv
import io
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import AsyncSessionLocal
from app.models.booking import Booking

async def main():
    async with AsyncSessionLocal() as session:
        # Fetch ALL bookings from the database, eager-loading the related trek
        bookings = (
            await session.scalars(
                select(Booking)
                .options(selectinload(Booking.trek))
                .order_by(Booking.booking_date.desc())
            )
        ).all()

    if not bookings:
        print("No bookings found in the database to export.")
        return

    print("--- Generating CSV for All Bookings ---\n")

    # Write to a string buffer instead of a file
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Added user_id to the headers to distinguish who made which booking
    writer.writerow([
        "booking_id", 
        "user_id", 
        "trek_name", 
        "location", 
        "booking_date", 
        "status", 
        "payment_status", 
        "slots_booked"
    ])
    
    for booking in bookings:
        writer.writerow([
            booking.id,
            booking.user_id,
            booking.trek.name if booking.trek else "",
            booking.trek.location if booking.trek else "",
            booking.booking_date,
            booking.status.value if booking.status else "",
            booking.payment_status.value if booking.payment_status else "",
            booking.slots_booked,
        ])
        
    print(output.getvalue())

if __name__ == "__main__":
    asyncio.run(main())