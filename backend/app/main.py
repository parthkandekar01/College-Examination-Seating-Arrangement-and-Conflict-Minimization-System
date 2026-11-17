"""
FastAPI Main Application Entry Point
Algorithm-Based College Examination Seating Arrangement and Conflict Minimization System
ADA Academic Project
"""
import os

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import initialize_database
from .api.auth import require_admin, router as auth_router
from .api import (
    subjects_router,
    students_router,
    classrooms_router,
    arrangements_router,
    algorithms_router,
    conflict_router,
    reports_router,
    dashboard_router,
    seed_router
)

# Create tables and migrate existing single-subject records automatically.
initialize_database()

app = FastAPI(
    title="College Examination Seating Arrangement & Conflict Minimization System",
    description="ADA Project implementing Sorting, Greedy, and Recursive Backtracking algorithms for automated examination seating optimization.",
    version="1.0.0"
)

frontend_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],
)

# Include API Routers with /api prefix
API_PREFIX = "/api"
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(dashboard_router, prefix=API_PREFIX, dependencies=[Depends(require_admin)])
app.include_router(students_router, prefix=API_PREFIX, dependencies=[Depends(require_admin)])
app.include_router(subjects_router, prefix=API_PREFIX, dependencies=[Depends(require_admin)])
app.include_router(classrooms_router, prefix=API_PREFIX, dependencies=[Depends(require_admin)])
app.include_router(arrangements_router, prefix=API_PREFIX, dependencies=[Depends(require_admin)])
app.include_router(algorithms_router, prefix=API_PREFIX, dependencies=[Depends(require_admin)])
app.include_router(conflict_router, prefix=API_PREFIX, dependencies=[Depends(require_admin)])
app.include_router(reports_router, prefix=API_PREFIX, dependencies=[Depends(require_admin)])
app.include_router(seed_router, prefix=API_PREFIX, dependencies=[Depends(require_admin)])


@app.get("/")
def root_info():
    return {
        "project": "Algorithm-Based College Examination Seating Arrangement and Conflict Minimization System",
        "academic_discipline": "Analysis and Design of Algorithms (ADA)",
        "status": "online",
        "algorithms_implemented": [
            {"name": "Merge Sort & Quick Sort", "role": "Data organization & interleaving", "complexity": "O(N log N)"},
            {"name": "Greedy Algorithm", "role": "Local adjacent conflict minimization", "complexity": "O(N * M)"},
            {"name": "Recursive Backtracking", "role": "Constraint satisfaction & state-space pruning", "complexity": "O(M^N) worst-case"}
        ],
        "api_docs": "/docs"
    }
