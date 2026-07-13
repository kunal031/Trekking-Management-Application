from pydantic import BaseModel


class DashboardStats(BaseModel):
    users: int
    open_treks: int
    booked_slots: int
    revenue_usd: float
    active_staff: int
    bookings_by_status: dict[str, int]
