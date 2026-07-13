from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.db.session import AsyncSessionLocal
from app.services.notifications import send_monthly_activity_report, send_trek_reminders

scheduler = AsyncIOScheduler(timezone="UTC")


async def daily_reminder_job() -> None:
    async with AsyncSessionLocal() as session:
        await send_trek_reminders(session)


async def monthly_report_job() -> None:
    async with AsyncSessionLocal() as session:
        await send_monthly_activity_report(session)


def start_scheduler() -> None:
    if scheduler.running:
        return
    scheduler.add_job(daily_reminder_job, CronTrigger(hour=9, minute=0), id="daily_trek_reminders", replace_existing=True)
    scheduler.add_job(monthly_report_job, CronTrigger(day=1, hour=10, minute=0), id="monthly_activity_report", replace_existing=True)
    scheduler.start()


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown()
