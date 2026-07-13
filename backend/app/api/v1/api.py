from fastapi import APIRouter

from app.api.v1.routers import admin, auth, bookings, treks

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(admin.router)
api_router.include_router(treks.router)
api_router.include_router(bookings.router)
