from datetime import datetime, time
from sqlalchemy import Column, Integer, String, Text, DateTime, Date, Time, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class DayOfWeek(str, enum.Enum):
    monday = "monday"
    tuesday = "tuesday"
    wednesday = "wednesday"
    thursday = "thursday"
    friday = "friday"
    saturday = "saturday"
    sunday = "sunday"


class StudyTimetable(Base):
    __tablename__ = "study_timetables"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    start_date = Column(Date)
    end_date = Column(Date)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="timetables")
    time_slots = relationship("TimeSlot", back_populates="timetable", cascade="all, delete-orphan")


class TimeSlot(Base):
    __tablename__ = "time_slots"

    id = Column(Integer, primary_key=True, index=True)
    timetable_id = Column(Integer, ForeignKey("study_timetables.id"), nullable=False)
    day_of_week = Column(Enum(DayOfWeek), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    subject = Column(String(255), nullable=False)
    activity = Column(String(255))
    is_break = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    timetable = relationship("StudyTimetable", back_populates="time_slots")