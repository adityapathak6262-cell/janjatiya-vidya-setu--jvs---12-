import asyncio
import uuid
from datetime import datetime
from app.db.session import engine, AsyncSessionLocal
from app.db.models import Base, User, Scheme, PolicyVersion, AuditLog
from app.core.security import get_password_hash
from app.services.audit_chain import append_audit_block

async def seed_data():
    print("⏳ Creating PostgreSQL tables if not exist...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✓ PostgreSQL tables ready.")

    async with AsyncSessionLocal() as session:
        # Check if already seeded
        from sqlalchemy import select
        res = await session.execute(select(User))
        existing_users = res.scalars().all()
        if existing_users:
            print("Database already contains data. Skipping seed.")
            return

        print("🌱 Seeding Users...")
        default_pwd = get_password_hash("MotA@Jvs2026")

        student = User(
            id=uuid.uuid4(),
            name="Rahul Kumar Munda",
            email="adityapathak6262@gmail.com",
            password_hash=default_pwd,
            role="STUDENT",
            institution="Delhi Technological University",
            state="Jharkhand"
        )
        officer = User(
            id=uuid.uuid4(),
            name="Smt. Vandana Sharma",
            email="js.scholarship@mota.gov.in",
            password_hash=default_pwd,
            role="MOTA_OFFICER",
            institution="Ministry of Tribal Affairs, Shastri Bhawan",
            state="New Delhi"
        )
        admin = User(
            id=uuid.uuid4(),
            name="Sh. Rajesh Meena",
            email="admin.jvs@mota.gov.in",
            password_hash=default_pwd,
            role="ADMIN",
            institution="NIC / MoTA PMU",
            state="New Delhi"
        )
        session.add_all([student, officer, admin])
        await session.commit()

        print("🌱 Seeding Schemes (NFST, NOS, Pre-Matric, Post-Matric)...")
        nfst = Scheme(
            id=uuid.uuid4(),
            code="NFST",
            name="National Fellowship for Higher Education of ST Students",
            description="Central Sector Scheme providing 750 fellowships for M.Phil and Ph.D research in India.",
            category="Higher Education / Research Fellowship"
        )
        nos = Scheme(
            id=uuid.uuid4(),
            code="NOS",
            name="National Overseas Scholarship for ST Students",
            description="Central Sector Scheme providing 20 awards for Masters and Ph.D in top 1,000 QS ranked universities abroad.",
            category="International Overseas Scholarship"
        )
        session.add_all([nfst, nos])
        await session.commit()

        print("🌱 Seeding Genesis Audit Block...")
        await append_audit_block(
            session=session,
            actor_user_id=None,
            actor_role="SYSTEM",
            action="SYSTEM_INITIALIZATION",
            entity_type="PLATFORM",
            entity_id="JVS-GENESIS",
            payload={"platform": "JANJATIYA VIDYA SETU", "version": "1.0.0"}
        )

        print("🎉 Database seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
