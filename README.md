# Faculty of Technology Examination Seating Arrangement and Conflict Minimization System

> **Analysis and Design of Algorithms (ADA) Academic Project**  
> *A full-stack, algorithm-driven web application demonstrating Sorting, Greedy Optimization, and Recursive Backtracking for automated college examination seating optimization.*

---

## 1. Executive Summary

This project addresses the **Examination Seating Arrangement Problem**, an NP-hard combinatorial optimization challenge equivalent to 2D Spatial Graph Vertex Coloring. Rather than a basic CRUD or database-centric application, the system places **algorithmic implementation, spatial conflict minimization, empirical complexity analysis, and performance benchmarking** at its core.

### The Three Core Algorithms:
1. **Sorting Algorithm (Divide & Conquer):**
   - **Merge Sort & Quick Sort:** Custom Python implementations for ordering candidate streams with comparison and move tracking.
   - **Round-Robin Interleaved Sorting:** Disperses subjects across incoming candidate queues to maximize spatial diversity before seating.
   - *Time Complexity:* $\mathcal{O}(n \log n)$ | *Space Complexity:* $\mathcal{O}(n)$
2. **Greedy Algorithm (Local Conflict Minimization):**
   - Evaluates available seats locally for each candidate and assigns the seat producing the minimum adjacent conflict penalty ($w_h=10, w_v=6, w_d=3$).
   - Features early exit optimization when 0-penalty seats are encountered.
   - *Time Complexity:* $\mathcal{O}(N \cdot M)$ | *Space Complexity:* $\mathcal{O}(N + M)$
3. **Recursive Backtracking (Constraint Satisfaction Search):**
   - True recursive state-space exploration with forward checking and state rollback (undo).
   - Tracks recursive call counts, explored states, and backtracking operations.
   - Features MRV domain pruning and search-bounding limits to guarantee termination.
   - *Time Complexity:* $\mathcal{O}(M^N)$ worst-case exponential | *Space Complexity:* $\mathcal{O}(N)$ recursion depth

---

## 2. Technology Stack

- **Frontend:** React.js 18 with Vite, Tailwind CSS, Recharts for data visualization, Lucide React icons.
- **Backend:** Python 3.12, FastAPI, Pydantic v2 validation, Uvicorn ASGI server.
- **Database:** SQLite with SQLAlchemy ORM (lightweight, zero-configuration persistence).
- **Testing:** Pytest with 17 automated unit & integration test cases.

---

## 3. Project Directory Structure

```text
ADA Project1/
│
├── backend/
│   ├── app/
│   │   ├── algorithms/
│   │   │   ├── __init__.py
│   │   │   ├── sorting.py          # Merge Sort, Quick Sort, Interleaving
│   │   │   ├── greedy.py           # Greedy Min-Conflict Heuristic
│   │   │   ├── backtracking.py     # Recursive CSP Backtracking & Rollback
│   │   │   ├── conflict_engine.py  # Undirected Pair Conflict Deduplication
│   │   │   └── comparator.py       # Benchmark Suite & Empirical Comparison
│   │   ├── api/                    # FastAPI REST Route Handlers
│   │   ├── models/                 # SQLAlchemy ORM Models (ER Diagram)
│   │   ├── schemas/                # Pydantic Request/Response Models
│   │   ├── database.py             # SQLite Engine & Session Configuration
│   │   └── main.py                 # FastAPI Application Entrypoint
│   ├── tests/
│   │   ├── test_algorithms.py      # Unit tests for sorting, greedy, backtracking
│   │   └── test_api.py             # Integration tests for routes & seeder
│   ├── pytest.ini
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── layouts/
│   │   │   └── DashboardLayout.jsx # FreeFrontend-inspired Modern SaaS Sidebar
│   │   ├── pages/                  # All 12 Functional Modules
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── StudentsPage.jsx
│   │   │   ├── SubjectsPage.jsx
│   │   │   ├── ClassroomsPage.jsx
│   │   │   ├── ExamSetupPage.jsx
│   │   │   ├── GenerateSeatingPage.jsx
│   │   │   ├── SeatingVisualizationPage.jsx
│   │   │   ├── ConflictAnalysisPage.jsx
│   │   │   ├── AlgorithmComparisonPage.jsx
│   │   │   ├── PerformanceAnalysisPage.jsx
│   │   │   ├── ReportsPage.jsx
│   │   │   └── SettingsPage.jsx
│   │   ├── services/
│   │   │   └── api.js              # Fetch Client connecting to /api
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── docs/
│   ├── ALGORITHM_EXPLANATION.md     # In-depth ADA theoretical report
│   ├── API_DOCUMENTATION.md        # REST API endpoints reference
│   └── TESTING.md                  # Automated test suite execution report
│
├── start-all.bat                   # 1-Click System Launcher (Windows 11)
├── start-backend.bat               # Starts FastAPI on http://localhost:8000
├── start-frontend.bat              # Starts Vite on http://localhost:5173
├── .gitignore
└── README.md
```

---

## 4. Setup and Installation Instructions (Windows & VS Code)

### Prerequisites:
- Python 3.10 or later, available as `python`
- Node.js 18 or later and npm

### Quick One-Click Launch:
Double-click `start-all.bat` in the project root directory. It creates the backend virtual environment and installs missing dependencies the first time, then launches both servers in separate command windows.

---

### Manual Step-by-Step Execution:

#### Step 1: Start the Backend Server
Open a terminal in the project root and run:
```powershell
.\start-backend.bat
```
The first launch creates `backend\venv` and installs `backend\requirements.txt`. The FastAPI interactive documentation is at **http://localhost:8000/docs**.

#### Step 2: Start the Frontend Application
Open a second terminal in the project root and run:
```powershell
.\start-frontend.bat
```
The script installs frontend packages if needed. The Vite dashboard is at **http://localhost:5173**. Keep both terminal windows open while using the application.

---

### Admin Login

Sign in with the local demo credentials:

- **Username:** `admin`
- **Password:** `12345678`

The backend protects the application API with an expiring admin token; signing out clears the browser session. These defaults are for local demonstration only. Before exposing the app beyond your computer, configure credentials and a persistent signing secret in the terminal before starting the servers:

```powershell
$env:ADMIN_USERNAME = "admin"
$env:ADMIN_PASSWORD = "choose-a-strong-password"
$env:ADMIN_AUTH_SECRET = python -c "import secrets; print(secrets.token_urlsafe(48))"
$env:FRONTEND_ORIGINS = "http://localhost:5173"
.\start-all.bat
```

Keep the signing secret private and use the same value after restarts so existing sessions remain valid.

---

## 5. Running Automated Tests

To execute the backend test suite (17 test cases), run this from the project root:
```powershell
$env:PYTHONPATH="backend"; .\backend\venv\Scripts\python.exe -m pytest backend\tests -v
```

---

## 6. Demonstration Data Seeder

To demonstrate the application immediately without manually typing dozens of records:
1. Open the dashboard at `http://localhost:5173`.
2. Click the **"Seed Demo Data"** button in the top navigation bar or under **Settings & Data**.
3. This automatically populates:
   - **5 Academic Subjects:** ADA, DBMS, AI ML, Maths, and EVS.
   - **60 Candidates:** The same 60 candidates are enrolled in all five subjects.
   - **3 Classrooms (70 Seats):** Newton Block (5x5 = 25 seats), Turing Block (5x5 = 25 seats), Lovelace Wing (4x5 = 20 seats).
   - **Initial Seating Plan:** Generated using Greedy Optimization with zero conflicts.

---

## 7. Key Application Features

1. **Interactive Seating Grid:**
   - Visual classroom matrix with coordinate labels ($R1C1 \dots$).
   - Subject-specific color coding badges.
   - Same-subject conflict highlighting with pulsing red alert rings.
   - Click-to-inspect seat drawer showing candidate details, roll numbers, and neighbor adjacency vectors.
2. **Conflict Analysis Engine:**
   - Undirected pair deduplication ($u < v$) preventing double-counting.
   - Weighted conflict penalty calculation ($w_h=10, w_v=6, w_d=3$).
   - One-click re-optimization with Greedy or Backtracking.
3. **Algorithm Comparison Matrix:**
   - Side-by-side empirical performance metrics on identical datasets.
   - Scalability benchmarks across input sizes (20, 50, 100, 200, 400 students).
4. **ADA Educational Hub:**
   - Comprehensive pseudocode, time/space complexity analysis, and Viva Voce practical examination preparation guide.
5. **Printable Examination Rosters:**
   - Official invigilator attendance sheets with candidate signature lines and CSV export.

---

## 8. License & Academic Attribution
Developed as an Analysis and Design of Algorithms (ADA) academic demonstration project.
