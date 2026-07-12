# 🤖 LearningHub — API Documentation for AI Agents

> **Version**: 1.0.14  
> **Base URL**: `http://localhost:8080`  
> **Context**: This document provides the API specifications optimized for AI Agents, LLMs, and automated systems interacting with the LearningHub backend.

---

## 📌 System Instructions & Authentication

As an AI Agent, you will interact with the LearningHub API to manage educational content, monitor user attempts, and trigger automated processes (like exam generation or vector syncing).

### Authentication Rules
- **Header**: `Authorization: Bearer <access_token>`
- **Token Acquisition**: Use `POST /auth/login` to get the token, or assume it is provided in your environment context.

### Standard Response Format
All API responses follow this schema. You must parse `responseObject` based on `success` status.
```json
{
  "success": boolean,
  "message": "string",
  "responseObject": any | null,
  "statusCode": number
}
```

### Important Data Types
- **IDs**: All IDs are **UUID v7** (string, 36 characters). Ensure you generate or pass valid UUIDs.

---

## 🛠️ Available Endpoints (Actions)

### 1. Authentication & Users
- **`POST /auth/login`**: Authenticate to get tokens.
  - **Payload**: `{"identify": "username_or_email", "password": "password"}`
- **`GET /users`**: Retrieve all users (Requires Admin).
- **`GET /users/:id`**: Get specific user details.

### 2. Subject Management
- **`GET /subjects`**: Get all subjects. *Use this to find `subject_id` before generating exams or questions.*
- **`POST /subjects`**: Create a new subject.
  - **Payload**: `{"name": "string", "description": "string"}`

### 3. Question & Answer Management
- **`GET /questions`**: List all questions.
- **`POST /questions`**: Create a new question.
  - **Payload**: `{"content": "Question text"}`
- **`GET /answers/question/:questionId`**: Get all answers for a specific question.
- **`POST /answers`**: Add an answer to a question.
  - **Payload**: `{"question_id": "uuid-v7", "content": "Answer text", "is_correct": boolean}`

### 4. Exam Management
- **`GET /exams`**: List all exams (metadata only).
- **`GET /exams/:id/detail`**: Get full exam details including questions and answers (without `is_correct` flag).
- **`POST /exams`**: Create a new exam metadata record.
  - **Payload**: `{"title": "string", "description": "string", "subject_id": "uuid", "duration_minutes": number, "total_marks": number, "pass_percentage": number, "is_published": boolean}`
- **`POST /exam-questions`**: Link a question to an exam.
  - **Payload**: `{"exam_id": "uuid-v7", "question_id": "uuid-v7"}`

### 5. Exam Attempts & Statistics
- **`GET /statistics/exam/:examId`**: Get aggregate statistics for an exam (attempts, average score, pass rate).
- **`GET /statistics/admin/overview`**: Get system-wide metrics (total users, exams, questions, attempts).

---

## 🧠 AI & Vector Operations (Core Capabilities)

*Use these endpoints to manage the RAG system and trigger automated exam generation.*

### `POST /ai/generate-exam`
**Description**: Trigger the backend to automatically generate an exam using LLMs and RAG context.
**When to use**: When requested to create a new test, quiz, or exam for a specific topic automatically.
**Payload Schema**:
```json
{
  "subject_id": "uuid-v7", 
  "topic": "string (optional)",
  "num_questions": "number (1-50, default: 10)",
  "difficulty": "string ('easy' | 'medium' | 'hard' | 'mixed')",
  "language": "string ('vi' | 'en')",
  "exam_title": "string (optional)",
  "exam_duration_minutes": "number (default: 60)",
  "additional_instructions": "string (optional prompt injection for the generator)",
  "provider": "string ('openrouter' | 'ollama' | 'nvidia')",
  "auto_save": "boolean (default: true)"
}
```
**Notes**: 
- This operation may take 5-30 seconds.
- If `auto_save` is true, the exam is automatically saved to the database as unpublished.

### `POST /ai/upload-document`
**Description**: Upload Markdown documents to the Qdrant vector database for RAG context.
**Payload**: `multipart/form-data` with `file` (.md or .txt) and `subject_id` (uuid).
**When to use**: When new knowledge base materials are provided and need to be ingested.

### `POST /ai/sync-questions`
**Description**: Synchronize existing relational database questions into the Qdrant vector store.
**Payload**: `{"subject_id": "uuid-v7"}` (omit `subject_id` to sync all).
**When to use**: After bulk-importing questions or modifying existing questions in the database, to ensure the AI has up-to-date context.

### `GET /ai/vector-status`
**Description**: Check the health and document count of the Qdrant vector store.

---

## 🚦 Error Handling & Strategies

When interacting with the API, handle the following HTTP status codes gracefully:
- `400 Bad Request`: Re-evaluate your JSON payload. Check for missing required fields (like `subject_id`) or invalid UUID formats.
- `401 Unauthorized`: Your access token is missing or expired. Authenticate via `/auth/login` to get a new token.
- `403 Forbidden`: Your agent does not have Admin privileges required for the endpoint.
- `404 Not Found`: The ID provided does not exist. Do not retry with the same ID.

## 🔄 Agent Workflows

### Workflow 1: Generate and Publish an Exam
1. Fetch subjects via `GET /subjects` to determine the correct `subject_id`.
2. Call `POST /ai/generate-exam` with the desired parameters and `auto_save: true`.
3. Extract `exam_id` from the `responseObject` of the generation response.
4. Call `PUT /exams/{exam_id}` with `{"is_published": true}` to make it available to students.

### Workflow 2: Ingest Knowledge & Sync
1. Use `POST /ai/upload-document` to add new course material.
2. Call `POST /ai/sync-questions` to ensure all standard questions are vectorized.
3. Check `GET /ai/vector-status` to verify the vector store is healthy and populated.
