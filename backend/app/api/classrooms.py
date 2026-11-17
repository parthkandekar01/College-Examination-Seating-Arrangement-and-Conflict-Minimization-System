"""
Classroom & Seat Management API
Handles classroom configuration, automated seat generation, and grid layouts.
"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Classroom, Seat, SeatingAssignment
from ..schemas import ClassroomCreate, ClassroomUpdate, ClassroomResponse, SeatResponse

router = APIRouter(prefix="/classrooms", tags=["Classrooms"])


def generate_classroom_seats(classroom: Classroom, db: Session):
    """
    Generates seat records for a classroom based on its rows and cols.
    Seat numbering format: {RoomName}-R{r}C{c}
    """
    # Delete existing seats first if re-generating
    db.query(Seat).filter(Seat.classroom_id == classroom.classroom_id).delete()

    created_seats = []
    seat_counter = 1
    for r in range(1, classroom.rows + 1):
        for c in range(1, classroom.cols + 1):
            if seat_counter > classroom.capacity:
                break
            seat_num = f"{classroom.classroom_name}-R{r}C{c}"
            new_seat = Seat(
                classroom_id=classroom.classroom_id,
                seat_number=seat_num,
                row_num=r,
                col_num=c
            )
            created_seats.append(new_seat)
            seat_counter += 1

    db.add_all(created_seats)
    db.commit()


@router.get("", response_model=List[ClassroomResponse])
def get_classrooms(db: Session = Depends(get_db)):
    classrooms = db.query(Classroom).order_by(Classroom.classroom_id.asc()).all()
    results = []
    for c in classrooms:
        s_count = db.query(func.count(Seat.seat_id)).filter(Seat.classroom_id == c.classroom_id).scalar() or 0
        results.append(
            ClassroomResponse(
                classroom_id=c.classroom_id,
                classroom_name=c.classroom_name,
                capacity=c.capacity,
                rows=c.rows,
                cols=c.cols,
                created_at=c.created_at,
                seats_count=s_count
            )
        )
    return results


@router.post("", response_model=ClassroomResponse, status_code=status.HTTP_201_CREATED)
def create_classroom(payload: ClassroomCreate, db: Session = Depends(get_db)):
    name_clean = payload.classroom_name.strip()
    if not name_clean:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Classroom name cannot be empty.")

    if payload.rows <= 0 or payload.cols <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rows and columns must be greater than zero.")

    grid_capacity = payload.rows * payload.cols
    if grid_capacity < payload.capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rows ({payload.rows}) x Columns ({payload.cols}) = {grid_capacity} seats, which is less than specified capacity ({payload.capacity}). Adjust dimensions."
        )

    existing = db.query(Classroom).filter(Classroom.classroom_name.ilike(name_clean)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Classroom '{name_clean}' already exists.")

    new_classroom = Classroom(
        classroom_name=name_clean,
        capacity=payload.capacity,
        rows=payload.rows,
        cols=payload.cols
    )
    db.add(new_classroom)
    db.commit()
    db.refresh(new_classroom)

    # Automatically generate seats
    generate_classroom_seats(new_classroom, db)

    s_count = db.query(func.count(Seat.seat_id)).filter(Seat.classroom_id == new_classroom.classroom_id).scalar() or 0

    return ClassroomResponse(
        classroom_id=new_classroom.classroom_id,
        classroom_name=new_classroom.classroom_name,
        capacity=new_classroom.capacity,
        rows=new_classroom.rows,
        cols=new_classroom.cols,
        created_at=new_classroom.created_at,
        seats_count=s_count
    )


@router.get("/{classroom_id}", response_model=ClassroomResponse)
def get_classroom(classroom_id: int, db: Session = Depends(get_db)):
    c = db.query(Classroom).filter(Classroom.classroom_id == classroom_id).first()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    seats = db.query(Seat).filter(Seat.classroom_id == classroom_id).order_by(Seat.row_num.asc(), Seat.col_num.asc()).all()
    return ClassroomResponse(
        classroom_id=c.classroom_id,
        classroom_name=c.classroom_name,
        capacity=c.capacity,
        rows=c.rows,
        cols=c.cols,
        created_at=c.created_at,
        seats_count=len(seats),
        seats=[SeatResponse.from_orm(s) for s in seats]
    )


@router.put("/{classroom_id}", response_model=ClassroomResponse)
def update_classroom(classroom_id: int, payload: ClassroomUpdate, db: Session = Depends(get_db)):
    c = db.query(Classroom).filter(Classroom.classroom_id == classroom_id).first()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    regenerate = False

    if payload.classroom_name is not None:
        name_clean = payload.classroom_name.strip()
        existing = db.query(Classroom).filter(Classroom.classroom_name.ilike(name_clean), Classroom.classroom_id != classroom_id).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Classroom name '{name_clean}' already in use.")
        if name_clean != c.classroom_name:
            c.classroom_name = name_clean
            regenerate = True

    new_rows = payload.rows if payload.rows is not None else c.rows
    new_cols = payload.cols if payload.cols is not None else c.cols
    new_cap = payload.capacity if payload.capacity is not None else c.capacity

    if new_rows * new_cols < new_cap:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rows ({new_rows}) x Columns ({new_cols}) = {new_rows * new_cols} seats, which is less than capacity ({new_cap})."
        )

    if payload.rows is not None or payload.cols is not None or payload.capacity is not None:
        c.rows = new_rows
        c.cols = new_cols
        c.capacity = new_cap
        regenerate = True

    db.commit()
    db.refresh(c)

    if regenerate:
        generate_classroom_seats(c, db)

    seats = db.query(Seat).filter(Seat.classroom_id == classroom_id).order_by(Seat.row_num.asc(), Seat.col_num.asc()).all()
    return ClassroomResponse(
        classroom_id=c.classroom_id,
        classroom_name=c.classroom_name,
        capacity=c.capacity,
        rows=c.rows,
        cols=c.cols,
        created_at=c.created_at,
        seats_count=len(seats),
        seats=[SeatResponse.from_orm(s) for s in seats]
    )


@router.delete("/{classroom_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_classroom(classroom_id: int, db: Session = Depends(get_db)):
    c = db.query(Classroom).filter(Classroom.classroom_id == classroom_id).first()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    db.delete(c)
    db.commit()
    return None
