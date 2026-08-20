from database import Base
from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func


class Usuario(Base):
    __tablename__ = "usuarios"

    # Adicionado autoincrement=True explicitamente
    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    meus_treinos = relationship("Workout", back_populates="dono_do_treino")


class Workout(Base):
    __tablename__ = "workouts"

    # Adicionado autoincrement=True explicitamente
    workout_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(
        Integer, ForeignKey("usuarios.user_id", ondelete="CASCADE"), nullable=False
    )
    workout_date = Column(Date, nullable=False)
    workout_type = Column(String, nullable=False)

    dono_do_treino = relationship("Usuario", back_populates="meus_treinos")
    exercicios_ginasio = relationship(
        "GymExercise", back_populates="treino_pai", cascade="all, delete-orphan"
    )
    series_natacao = relationship(
        "SwimSet", back_populates="treino_pai", cascade="all, delete-orphan"
    )


class GymExercise(Base):
    __tablename__ = "gym_exercises"

    # Adicionado autoincrement=True explicitamente
    exercise_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    workout_id = Column(
        Integer, ForeignKey("workouts.workout_id", ondelete="CASCADE"), nullable=False
    )
    exercise_name = Column(String, nullable=False)
    sets = Column(Integer, nullable=False)
    reps = Column(Integer, nullable=False)

    treino_pai = relationship("Workout", back_populates="exercicios_ginasio")


class SwimSet(Base):
    __tablename__ = "swim_sets"

    # Adicionado autoincrement=True explicitamente
    swim_set_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    workout_id = Column(
        Integer, ForeignKey("workouts.workout_id", ondelete="CASCADE"), nullable=False
    )
    distance_m = Column(Integer, nullable=False)
    reps = Column(Integer, nullable=False)

    treino_pai = relationship("Workout", back_populates="series_natacao")