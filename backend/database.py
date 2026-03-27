import os
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/teletriage")

class Database:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None

db_instance = Database()

async def connect_db():
    client = AsyncIOMotorClient(MONGODB_URI)
    db_instance.client = clientP
    db_instance.db = client.get_default_database()
    print("Connected to MongoDB")

async def close_db():
    if db_instance.client:
        db_instance.client.close()
        print("Closed MongoDB connection")

async def get_db() -> AsyncIOMotorDatabase:
    if db_instance.db is None:
        raise RuntimeError("Database not initialized")
    return db_instance.db
