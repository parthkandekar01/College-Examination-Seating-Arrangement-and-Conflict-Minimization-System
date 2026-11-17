# REST API Reference Documentation
## Faculty of Technology Examination Seating Backend Service

All endpoints are hosted at prefix `/api`. All API endpoints except login require an admin bearer token.

### Authentication
- `POST /api/auth/login`: Accepts `username` and `password`, returns an 8-hour signed bearer token.
- `GET /api/auth/me`: Returns the authenticated admin.
- Send `Authorization: Bearer <access_token>` with all other `/api` requests.
- Local demo credentials are `admin` / `12345678`. Configure `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_AUTH_SECRET` before exposing the app beyond the local machine.

---

### 1. Dashboard
- `GET /api/dashboard/stats`: Returns live aggregated metrics:
  - `total_students`, `total_subjects`, `total_classrooms`, `total_seats`, `students_awaiting`, `total_arrangements`, `total_conflicts_sum`, `subject_distribution`, `classroom_utilization`, `recent_arrangements`, `algorithm_performance`.

---

### 2. Subjects
- `GET /api/subjects`: List all subjects (optional query `search`).
- `POST /api/subjects`: Create a subject (`subject_code`, `subject_name`).
- `GET /api/subjects/{id}`: Retrieve single subject by ID.
- `PUT /api/subjects/{id}`: Update subject code or name.
- `DELETE /api/subjects/{id}`: Delete a subject; students enrolled in other subjects are retained.

---

### 3. Students
- `GET /api/students`: List candidates with query params (`search`, `subject_id`). Student responses include all enrolled subjects.
- `POST /api/students`: Create single candidate (`roll_no`, `student_name`, `subject_id`, `email`, `semester`).
- `POST /api/students/bulk`: Register array of candidates in bulk.
- `POST /api/students/import-csv`: Upload multipart `.csv` with automatic subject resolution.
- `GET /api/students/export-csv`: Stream downloadable CSV containing all registered students.
- `GET /api/students/{roll_no}`: Get candidate details.
- `PUT /api/students/{roll_no}`: Update student details.
- `DELETE /api/students/{roll_no}`: Delete student.

---

### 4. Classrooms & Auto Seat Generation
- `GET /api/classrooms`: List all classrooms with dimensions, capacity, and seat counts.
- `POST /api/classrooms`: Create classroom (`classroom_name`, `capacity`, `rows`, `cols`).
  - *Automated Behavior:* Verifies `rows * cols >= capacity` and generates seats numbered `{RoomName}-R{r}C{c}`.
- `GET /api/classrooms/{id}`: Get classroom and full list of auto-generated seats.
- `PUT /api/classrooms/{id}`: Update classroom dimensions or capacity (re-generates seats if changed).
- `DELETE /api/classrooms/{id}`: Delete classroom and its seats.

---

### 5. Seating Arrangement Generation
- `POST /api/arrangements/generate`: Core optimization endpoint.
  - **Payload:**
    ```json
    {
      "exam_name": "End Semester Exam 2026",
      "exam_date": "2026-12-10 (Morning)",
      "subject_ids": [1],
      "classroom_ids": [1, 2],
      "algorithm": "greedy",
      "separation_mode": "all",
      "sort_strategy": "merge_sort",
      "max_states": 30000,
      "max_backtracks": 10000
    }
    ```
  - **Response:** Complete `ArrangementDetailResponse` containing assigned seat coordinates, conflict count, execution time, and algorithmic step traces.
- `GET /api/arrangements`: List past arrangements.
- `GET /api/arrangements/{id}`: Detailed arrangement layout and seat assignments.
- `DELETE /api/arrangements/{id}`: Delete an arrangement.

---

### 6. Conflict Analysis & Re-Optimization
- `GET /api/conflict-analysis/{id}`: Returns deduplicated undirected conflict pairs, conflict penalty score, subject distribution, and classroom distribution.
- `POST /api/conflict-analysis/{id}/optimize`: Re-runs optimization on existing arrangement using target algorithm (`greedy` or `backtracking`) and updates database record.

---

### 7. Standalone Algorithms & Benchmarking
- `POST /api/algorithms/sort`: Standalone sorting engine (`merge_sort`, `quick_sort`, `interleaved`) returning comparison counts, moves, and trace steps.
- `POST /api/algorithms/compare`: Runs Merge Sort, Greedy, and Backtracking on identical input data and returns comparative matrix.
- `POST /api/algorithms/benchmark`: Scalability benchmark runner across variable dataset sizes (20, 50, 100, 200, 400).

---

### 8. Reports & Exports
- `GET /api/reports/{id}/csv`: Streams downloadable CSV of complete seating chart.
- `GET /api/reports/{id}/summary`: Classroom-wise structured JSON payload formatted for print and official invigilator sign-off sheets.

---

### 9. Demonstration Data Management
- `POST /api/seed/demo`: Populates ADA, DBMS, AI ML, Maths, and EVS; one shared roster of 60 students enrolled in all five; 3 classrooms (70 seats); and an initial seating arrangement. Generate one subject exam at a time when students overlap.
- `POST /api/seed/reset`: Purges all database tables.
- `POST /api/arrangements/generate`: Select one subject in `subject_ids` for a shared roster; selecting overlapping subjects returns HTTP 400 to prevent duplicate seating.
