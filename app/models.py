from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    user_id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    meus_treinos = relationship("Workout", back_populates="dono_do_treino")


class Workout(Base):
    __tablename__ = "workouts"

    workout_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("usuarios.user_id"), nullable=False)
    workout_date = Column(Date, nullable=False)
    workout_type = Column(String, nullable=False)

    dono_do_treino = relationship("Usuario", back_populates="meus_treinos")
    exercicios_ginasio = relationship("GymExercise", back_populates="treino_pai", cascade="all, delete-orphan")
    series_natacao = relationship("SwimSet", back_populates="treino_pai", cascade="all, delete-orphan")


class GymExercise(Base):
    __tablename__ = "gym_exercises"

    exercise_id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("workouts.workout_id"), nullable=False)
    exercise_name = Column(String, nullable=False)
    sets = Column(Integer, nullable=False)
    reps = Column(Integer, nullable=False)

    treino_pai = relationship("Workout", back_populates="exercicios_ginasio")


class SwimSet(Base):
    __tablename__ = "swim_sets"

    swim_set_id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("workouts.workout_id"), nullable=False)
    distance_m = Column(Integer, nullable=False)
    reps = Column(Integer, nullable=False)

    treino_pai = relationship("Workout", back_populates="series_natacao")