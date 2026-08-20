from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Train(Base):
    __tablename__ = "trains"

    train_id = Column(String, primary_key=True, index=True)
    locomotive_model = Column(String, nullable=False)
    max_capacity = Column(Integer, nullable=False) # Passenger capacity
    max_weight = Column(Float, nullable=False)     # Train Weight or Total Load limit in metric tons

    schedules = relationship("Schedule", back_populates="train")
    telemetries = relationship("Telemetry", back_populates="train")

class Schedule(Base):
    __tablename__ = "schedules"

    schedule_id = Column(Integer, primary_key=True, autoincrement=True)
    train_id = Column(String, ForeignKey("trains.train_id"), nullable=False)
    station_id = Column(String, nullable=False, index=True)
    scheduled_arrival = Column(DateTime, nullable=False)
    scheduled_departure = Column(DateTime, nullable=False)

    train = relationship("Train", back_populates="schedules")

class Telemetry(Base):
    __tablename__ = "telemetries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    train_id = Column(String, ForeignKey("trains.train_id"), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    current_speed = Column(Float, nullable=False)
    current_weight = Column(Float, nullable=False)
    passenger_count = Column(Integer, nullable=False)

    train = relationship("Train", back_populates="telemetries")
