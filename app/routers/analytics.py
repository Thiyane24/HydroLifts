from datetime import date, datetime, timedelta, timezone
from dateutil.relativedelta import relativedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, case
from sqlalchemy.orm import Session

import models
import security
from database import get_db

router = APIRouter()


def _inicio_semana_iso(referencia: date) -> date:
    """Devolve a segunda-feira (00:00 UTC) da semana ISO que contém `referencia`."""
    return referencia - timedelta(days=referencia.weekday())


def _inicio_mes(referencia: date) -> date:
    """Primeiro dia do mês (UTC) que contém `referencia`."""
    return referencia.replace(day=1)


def _intervalo_treinos(query, user_id: int, inicio: date, fim_exclusivo: date):
    """Aplica filtro de user + intervalo de datas [inicio, fim_exclusivo)."""
    return query.filter(
        models.Workout.user_id == user_id,
        models.Workout.workout_date >= inicio,
        models.Workout.workout_date < fim_exclusivo,
    )


def _aggregados(db: Session, ids_treinos: list[int]) -> dict:
    """Calcula os agregados para a lista de workout_ids."""
    if not ids_treinos:
        return {
            "total_workouts": 0,
            "total_gym_sets": 0,
            "total_gym_reps": 0,
            "total_swim_m": 0,
            "running_equivalent_km": 0.0,
            "max_weight_kg": None,
        }

    gym_stats = (
        db.query(
            func.coalesce(func.sum(models.GymExercise.sets), 0).label("total_sets"),
            func.coalesce(func.sum(models.GymExercise.reps), 0).label("total_reps"),
            func.max(
                case(
                    (models.GymExercise.weight_unit == "lb", models.GymExercise.weight_value * 0.45359237),
                    else_=models.GymExercise.weight_value
                )
            ).label("max_weight_gym"),
        )
        .filter(models.GymExercise.workout_id.in_(ids_treinos))
        .first()
    )

    max_weight_set = (
        db.query(
            func.max(
                case(
                    (models.GymSetDetail.weight_unit == "lb", models.GymSetDetail.weight_value * 0.45359237),
                    else_=models.GymSetDetail.weight_value
                )
            )
        )
        .join(models.GymExercise)
        .filter(models.GymExercise.workout_id.in_(ids_treinos))
        .scalar()
    )

    swim_stats = (
        db.query(
            func.coalesce(
                func.sum(models.SwimSet.distance_m * models.SwimSet.reps), 0
            ).label("total_m")
        )
        .filter(models.SwimSet.workout_id.in_(ids_treinos))
        .first()
    )

    candidates = []
    if gym_stats and gym_stats.max_weight_gym is not None:
        candidates.append(float(gym_stats.max_weight_gym))
    if max_weight_set is not None:
        candidates.append(float(max_weight_set))

    max_weight_kg = round(max(candidates), 2) if candidates else None

    total_swim_m = float(swim_stats.total_m)
    swim_km = total_swim_m / 1000.0
    running_equivalent_km = round(swim_km * 4, 2)

    return {
        "total_workouts": len(ids_treinos),
        "total_gym_sets": int(gym_stats.total_sets),
        "total_gym_reps": int(gym_stats.total_reps),
        "total_swim_m": int(total_swim_m),
        "running_equivalent_km": running_equivalent_km,
        "max_weight_kg": max_weight_kg,
    }


@router.get("/analytics/weekly-summary")
def resumo_semanal(
    db: Session = Depends(get_db),
    utilizador_atual: models.Usuario = Depends(security.obter_usuario_atual),
):
    hoje = datetime.now(timezone.utc).date()
    inicio_semana = _inicio_semana_iso(hoje)
    fim_semana = inicio_semana + timedelta(days=7)

    treinos = _intervalo_treinos(
        db.query(models.Workout),
        utilizador_atual.user_id,
        inicio_semana,
        fim_semana,
    ).all()
    ids = [t.workout_id for t in treinos]

    payload = _aggregados(db, ids)
    payload["week_start"] = inicio_semana.isoformat()
    payload["week_end"] = (fim_semana - timedelta(days=1)).isoformat()
    return payload


@router.get("/analytics/monthly-summary")
def resumo_mensal(
    db: Session = Depends(get_db),
    utilizador_atual: models.Usuario = Depends(security.obter_usuario_atual),
):
    hoje = datetime.now(timezone.utc).date()
    inicio_mes = _inicio_mes(hoje)
    if inicio_mes.month == 12:
        proximo_mes = inicio_mes.replace(year=inicio_mes.year + 1, month=1)
    else:
        proximo_mes = inicio_mes.replace(month=inicio_mes.month + 1)

    treinos_mes = _intervalo_treinos(
        db.query(models.Workout),
        utilizador_atual.user_id,
        inicio_mes,
        proximo_mes,
    ).all()
    ids_mes = [t.workout_id for t in treinos_mes]
    payload = _aggregados(db, ids_mes)
    payload["month_start"] = inicio_mes.isoformat()
    payload["month_end"] = (proximo_mes - timedelta(days=1)).isoformat()

    semanas: list[dict] = []
    cursor = _inicio_semana_iso(inicio_mes)
    semana_idx = 1
    while cursor < proximo_mes:
        fim = cursor + timedelta(days=7)
        treinos_sem = _intervalo_treinos(
            db.query(models.Workout),
            utilizador_atual.user_id,
            cursor,
            fim,
        ).all()
        ids_sem = [t.workout_id for t in treinos_sem]
        ag = _aggregados(db, ids_sem)
        ag["week_index"] = semana_idx
        ag["week_start"] = cursor.isoformat()
        ag["week_end"] = (fim - timedelta(days=1)).isoformat()
        semanas.append(ag)
        cursor = fim
        semana_idx += 1

    payload["weeks"] = semanas
    return payload


@router.get("/analytics/trends")
def tendencias(
    db: Session = Depends(get_db),
    utilizador_atual: models.Usuario = Depends(security.obter_usuario_atual),
):
    """Devolve a evolução de volume e força nos últimos 12 meses."""
    hoje = datetime.now(timezone.utc).date()
    tendencias = []

    for i in range(11, -1, -1):
        mes_ref = hoje - relativedelta(months=i)
        inicio = _inicio_mes(mes_ref)
        # Fim do mês = início do próximo mês
        fim = inicio + relativedelta(months=1)

        treinos = _intervalo_treinos(
            db.query(models.Workout),
            utilizador_atual.user_id,
            inicio,
            fim,
        ).all()
        ids = [t.workout_id for t in treinos]
        ag = _aggregados(db, ids)

        tendencias.append({
            "month": inicio.strftime("%b %Y"),
            "volume": ag["total_gym_sets"],
            "max_weight": ag["max_weight_kg"],
            "swim_m": ag["total_swim_m"]
        })

    return tendencias
