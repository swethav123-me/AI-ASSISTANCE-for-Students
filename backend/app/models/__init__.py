from app.models.user import User, Role
from app.models.chat import Chat, Message
from app.models.document import Document
from app.models.assignment import Assignment
from app.models.quiz import Quiz, Question, Answer
from app.models.notes import Note
from app.models.revision import RevisionPlan, Flashcard
from app.models.timetable import StudyTimetable, TimeSlot

__all__ = [
    "User", "Role",
    "Chat", "Message",
    "Document",
    "Assignment",
    "Quiz", "Question", "Answer",
    "Note",
    "RevisionPlan", "Flashcard",
    "StudyTimetable", "TimeSlot",
]