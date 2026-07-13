from enum import Enum


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    STAFF = "STAFF"
    USER = "USER"


class StaffStatus(str, Enum):
    AVAILABLE = "Available"
    ON_TREK = "On-Trek"
    LEAVE = "Leave"


class Difficulty(str, Enum):
    EASY = "EASY"
    MODERATE = "MODERATE"
    HARD = "HARD"


class TrekStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    COMPLETED = "COMPLETED"


class BookingStatus(str, Enum):
    BOOKED = "BOOKED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"


class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    REFUNDED = "REFUNDED"
