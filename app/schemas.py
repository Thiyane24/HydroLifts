from datetime import date, datetime
from decimal import Decimal
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


# --- SCHEMAS DE GINÁSIO ---

WeightUnit = Literal["kg", "lb"]


class GymSetDetailBase(BaseModel):
    """Uma série individual (opcional) — quando vazia, usa o default do exercício."""

    set_index: int = Field(ge=1)
    reps: Optional[int] = Field(default=None, gt=0)
    weight_value: Optional[Decimal] = Field(default=None, gt=0)
    weight_unit: Optional[WeightUnit] = None

    @model_validator(mode="after")
    def _check_weight_pair(self):
        if self.weight_value is not None and self.weight_unit is None:
            raise ValueError(
                "weight_unit é obrigatório quando weight_value está preenchido"
            )
        return self


class GymSetDetailCreate(GymSetDetailBase):
    pass


class GymSetDetailResponse(GymSetDetailBase):
    set_detail_id: int
    exercise_id: int

    model_config = ConfigDict(from_attributes=True)


class GymExerciseBase(BaseModel):
    exercise_name: str
    sets: int = Field(gt=0)
    reps: int = Field(gt=0)
    weight_value: Optional[Decimal] = Field(default=None, gt=0)
    weight_unit: Optional[WeightUnit] = None

    @model_validator(mode="after")
    def _check_weight_pair(self):
        if self.weight_value is not None and self.weight_unit is None:
            raise ValueError(
                "weight_unit é obrigatório quando weight_value está preenchido"
            )
        return self


class GymExerciseCreate(GymExerciseBase):
    series_detalhadas: Optional[List[GymSetDetailCreate]] = None


class GymExerciseResponse(GymExerciseBase):
    exercise_id: int
    workout_id: int
    series_detalhadas: List[GymSetDetailResponse] = []

    model_config = ConfigDict(from_attributes=True)


# --- SCHEMAS DE NATAÇÃO ---

class SwimSetBase(BaseModel):
    distance_m: int = Field(gt=0)
    reps: int = Field(gt=0)


class SwimSetCreate(SwimSetBase):
    pass


class SwimSetResponse(SwimSetBase):
    swim_set_id: int
    workout_id: int

    model_config = ConfigDict(from_attributes=True)


# --- SCHEMAS DE WORKOUT ---

class WorkoutBase(BaseModel):
    workout_date: date
    workout_type: str


class WorkoutCreate(WorkoutBase):
    exercicios_ginasio: Optional[List[GymExerciseCreate]] = []
    series_natacao: Optional[List[SwimSetCreate]] = []


class WorkoutUpdate(BaseModel):
    workout_date: Optional[date] = None
    workout_type: Optional[str] = None
    exercicios_ginasio: Optional[List[GymExerciseCreate]] = None
    series_natacao: Optional[List[SwimSetCreate]] = None


class WorkoutResponse(WorkoutBase):
    workout_id: int
    user_id: int
    exercicios_ginasio: List[GymExerciseResponse] = []
    series_natacao: List[SwimSetResponse] = []

    model_config = ConfigDict(from_attributes=True)


# --- SCHEMAS DE USUÁRIO ---

class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- SCHEMAS DE AUTENTICAÇÃO / JWT ---

class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None
