from decimal import Decimal

from database import Base
from sqlalchemy import (
    CheckConstraint,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func


# --- unidade de peso (campo de texto livre, validado nos schemas) ---
WEIGHT_UNITS = ("kg", "lb")


class Usuario(Base):
    __tablename__ = "usuarios"

    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    meus_treinos = relationship("Workout", back_populates="dono_do_treino")


class Workout(Base):
    __tablename__ = "workouts"

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

    exercise_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    workout_id = Column(
        Integer, ForeignKey("workouts.workout_id", ondelete="CASCADE"), nullable=False
    )
    exercise_name = Column(String, nullable=False)

    # Campos agregados (mantidos para retrocompatibilidade com a UI atual
    # que regista "Séries" e "Reps" únicos por exercício).
    sets = Column(Integer, nullable=False)
    reps = Column(Integer, nullable=False)

    # Carga (uma única por exercício; séries individuais sobrescrevem
    # em GymSetDetail quando o utilizador quer drop-sets / pirâmide).
    weight_value = Column(Numeric(7, 2), nullable=True)
    weight_unit = Column(String(2), nullable=True)

    treino_pai = relationship("Workout", back_populates="exercicios_ginasio")
    series_detalhadas = relationship(
        "GymSetDetail",
        back_populates="exercicio_pai",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        CheckConstraint(
            "weight_unit IS NULL OR weight_unit IN ('kg', 'lb')",
            name="ck_gym_weight_unit",
        ),
        CheckConstraint(
            "weight_value IS NULL OR weight_value > 0",
            name="ck_gym_weight_value_positive",
        ),
    )

    # --- helpers ---
    @property
    def weight_kg(self) -> Decimal | None:
        """Devolve o peso em kg, ou None se não foi registado."""
        if self.weight_value is None:
            return None
        if self.weight_unit == "lb":
            return (self.weight_value * Decimal("0.45359237")).quantize(Decimal("0.01"))
        return self.weight_value.quantize(Decimal("0.01"))


class GymSetDetail(Base):
    """Séries individuais de um exercício (peso/reps opcionais por set).

    Quando esta tabela tem linhas para um GymExercise, os campos agregados
    `sets`/`reps`/`weight_value` da linha pai representam o *default*; cada
    `GymSetDetail` permite registar uma série com peso ou reps próprios
    (drop-sets, pirâmides, etc.).
    """

    __tablename__ = "gym_set_details"

    set_detail_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    exercise_id = Column(
        Integer,
        ForeignKey("gym_exercises.exercise_id", ondelete="CASCADE"),
        nullable=False,
    )
    set_index = Column(Integer, nullable=False)  # 1..N
    reps = Column(Integer, nullable=True)
    weight_value = Column(Numeric(7, 2), nullable=True)
    weight_unit = Column(String(2), nullable=True)

    exercicio_pai = relationship("GymExercise", back_populates="series_detalhadas")

    __table_args__ = (
        CheckConstraint(
            "weight_unit IS NULL OR weight_unit IN ('kg', 'lb')",
            name="ck_set_weight_unit",
        ),
        CheckConstraint(
            "weight_value IS NULL OR weight_value > 0",
            name="ck_set_weight_value_positive",
        ),
    )

    @property
    def weight_kg(self) -> Decimal | None:
        if self.weight_value is None:
            return None
        if self.weight_unit == "lb":
            return (self.weight_value * Decimal("0.45359237")).quantize(Decimal("0.01"))
        return self.weight_value.quantize(Decimal("0.01"))


class SwimSet(Base):
    __tablename__ = "swim_sets"

    swim_set_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    workout_id = Column(
        Integer, ForeignKey("workouts.workout_id", ondelete="CASCADE"), nullable=False
    )
    distance_m = Column(Integer, nullable=False)
    reps = Column(Integer, nullable=False)

    treino_pai = relationship("Workout", back_populates="series_natacao")
