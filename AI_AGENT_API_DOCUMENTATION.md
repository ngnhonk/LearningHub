# 🤖 LearningHub — API Documentation for AI Agents & FE Agents

> **Version**: 1.0.14  
> **Base URL**: `http://localhost:8080`  
> **Context**: This document provides the full API specifications optimized for AI Agents, LLMs, and Front-End agents interacting with the LearningHub backend.

---

## 📌 System Instructions & Authentication

### Authentication Rules
- **Header**: `Authorization: Bearer <access_token>`
- **Token Acquisition**: Use `POST /auth/login` to get the token, or assume it is provided in your environment context.
- **Refresh Token**: Stored in httpOnly cookie `refreshToken`. Refresh access token via `POST /auth/token`.

### Standard Response Format
All API responses follow this schema:
```json
{
  "success": boolean,
  "message": "string",
  "responseObject": any | null,
  "statusCode": number
}
```

### Data Formats & Conventions
- **IDs**: All IDs are **UUID v7** (string, 36 characters).
- **Avatars**: Static file URL format: `http://localhost:8080/uploads/avatars/filename.png`

---

## 🛠️ Available Endpoints by Module

### 1. Authentication & Users (`/auth`, `/users`)
- **`POST /auth/register`**: Register new user. Payload: `{"full_name", "username", "email", "password"}`
- **`POST /auth/login`**: Authenticate. Payload: `{"identify": "username_or_email", "password"}`
- **`POST /auth/token`**: Refresh access token using httpOnly cookie.
- **`POST /auth/logout`**: Revoke refresh token and clear cookie.
- **`GET /users/me`**: Get current logged-in user profile (`id`, `email`, `full_name`, `username`, `role`, `avatar_url`, `created_at`).
- **`PUT /users/change-avatar`**: Upload avatar file (`multipart/form-data` with `avatar` field).
- **`PUT /users/change-password`**: Payload: `{"oldPassword", "newPassword"}`
- **`GET /users`**: Retrieve all users (Admin only).
- **`GET /users/:id`**: Get specific user details (Admin only).
- **`PUT /users/change-user-role`**: Payload: `{"id", "newRole": "student" | "admin"}` (Admin only).

### 2. Subject Management (`/subjects`)
- **`GET /subjects`**: List all subjects.
- **`GET /subjects/:id`**: Get 1 subject.
- **`POST /subjects`**: Create subject (Admin only). Payload: `{"name", "description"}`
- **`PUT /subjects/:id`**: Update subject (Admin only).
- **`DELETE /subjects/:id`**: Delete subject (Admin only, cascades exams).

### 3. Exam Management (`/exams`)
- **`GET /exams`**: List all exams (metadata).
- **`GET /exams/subject/:subjectId`**: List exams by subject.
- **`GET /exams/:id`**: Get exam metadata.
- **`GET /exams/:id/detail`**: Get complete exam with questions and options (sanitized: hides `is_correct`).
- **`POST /exams`**: Create exam metadata (Admin only). Payload: `{"title", "description", "subject_id", "duration_minutes", "total_marks", "pass_percentage", "is_published"}`
- **`PUT /exams/:id`**: Update exam metadata (Admin only).
- **`DELETE /exams/:id`**: Delete exam (Admin only).
- **`POST /exams/import`**: Import exam & questions from Excel `.xlsx` (`multipart/form-data` with `file` and optional `subject_id`).

### 4. Question & Answer Management (`/questions`, `/answers`)
- **`GET /questions`**: List all questions.
- **`GET /questions/:id`**: Get single question.
- **`POST /questions`**: Create question (Admin only). Payload: `{"content"}`
- **`GET /answers/question/:questionId`**: Get all choices for a question (with `is_correct`).
- **`POST /answers`**: Add choice (Admin only). Payload: `{"question_id", "content", "is_correct"}`

### 5. Exam Attempts & Answers (`/user-exam-attempts`, `/user-answers`)
- **`POST /user-exam-attempts/start`**: Start a new exam attempt or retrieve active attempt. Payload: `{"exam_id"}`
- **`GET /user-exam-attempts/active/:examId`**: Get active attempt details, questions, and user's previously saved answers (sanitized).
- **`POST /user-exam-attempts/:id/answers`**: Batch save answers. Payload: `{"answers": [{"question_id", "selected_answer_id"}]}`
- **`PUT /user-exam-attempts/:id/submit`**: Submit attempt. Server auto-grades, calculates score, checks time spent & timeout automatically.
- **`GET /user-exam-attempts/:id/result`**: Detailed result review (questions, selected answer, correct answer, `is_correct`, score, correct/wrong counts).
- **`GET /user-exam-attempts/user/:userId`**: Get user attempt history (pass `:userId = me` for current user).

### 6. AI & Vector Operations (`/ai`)
- **`POST /ai/generate-exam`**: Trigger backend to generate an exam using LLMs & RAG context.
  - **Payload**:
    ```json
    {
      "subject_id": "uuid-v7", 
      "topic": "string",
      "num_questions": 10,
      "difficulty": "easy | medium | hard | mixed",
      "language": "vi | en",
      "exam_title": "string",
      "exam_duration_minutes": 60,
      "provider": "openrouter | ollama | nvidia",
      "auto_save": true
    }
    ```
- **`POST /ai/upload-document`**: Upload markdown/text to Qdrant vector database (`multipart/form-data` with `file` and `subject_id`).
- **`POST /ai/sync-questions`**: Sync relational DB questions to Qdrant vector store (`{"subject_id": "uuid-v7"}`).
- **`GET /ai/vector-status`**: Check Qdrant vector store status and count.

### 7. Statistics (`/statistics`)
- **`GET /statistics/exam/:examId`**: Aggregate exam metrics (Admin only).
- **`GET /statistics/admin/overview`**: System-wide overview (total users, exams, attempts, questions) (Admin only).
