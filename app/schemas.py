from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# --- SCHEMAS DE GINÁSIO ---

class GymExerciseBase(BaseModel):
    exercise_name: str
    sets: int = Field(gt=0)
    reps: int = Field(gt=0)


class GymExerciseCreate(GymExerciseBase):
    pass


class GymExerciseResponse(GymExerciseBase):
    exercise_id: int
    workout_id: int

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