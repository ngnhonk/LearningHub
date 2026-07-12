# 📋 LearningHub — API Documentation (FE Handover)

> **Version**: 1.0.14  
> **Base URL**: `http://localhost:8080`  
> **Swagger UI**: `http://localhost:8080/` (auto-redirect)  
> **Last updated**: 2026-07-10

---

## Mục lục

1. [Thông tin chung](#thông-tin-chung)
2. [Authentication (Auth)](#1-authentication)
3. [User](#2-user)
4. [Subject](#3-subject)
5. [Question](#4-question)
6. [Answer](#5-answer)
7. [Exam](#6-exam)
8. [Exam Question (liên kết)](#7-exam-question)
9. [User Exam Attempt (làm bài)](#8-user-exam-attempt)
10. [User Answer (nộp đáp án)](#9-user-answer)
11. [Statistics](#10-statistics)
12. [AI Generation (Sinh đề AI)](#11-ai-generation)

---

## Thông tin chung

### Response Format

Tất cả API trả về cùng format:

```json
{
  "success": true | false,
  "message": "Mô tả kết quả",
  "responseObject": { ... } | null,
  "statusCode": 200
}
```

### Authentication

- Sử dụng **JWT Bearer Token**
- Header: `Authorization: Bearer <access_token>`
- Access token nhận từ login response (set qua cookie) hoặc từ `/auth/token`
- Refresh token được lưu trong **httpOnly cookie** tự động

### Roles

| Role | Mô tả |
|------|--------|
| `student` | Sinh viên — xem đề, làm bài, xem kết quả |
| `admin` | Quản trị — CRUD đề thi, câu hỏi, AI generation |

### ID Format

- Tất cả ID đều là **UUID v7** (string, 36 ký tự)
- Ví dụ: `"019116a3-7a5e-7def-8b6c-1a2b3c4d5e6f"`

---

## 1. Authentication

### `POST /auth/register`

Đăng ký tài khoản mới.

**Request Body:**
```json
{
  "full_name": "Nguyễn Văn A",
  "username": "nguyenvana",
  "email": "a@example.com",
  "password": "12345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Register successful",
  "responseObject": {
    "message": "...",
    "user": {
      "id": "uuid-v7",
      "username": "nguyenvana",
      "email": "a@example.com",
      "create_time": "2026-07-10T00:00:00.000Z"
    }
  },
  "statusCode": 200
}
```

---

### `POST /auth/login`

Đăng nhập. Server sẽ set **refresh token cookie** tự động.

**Request Body:**
```json
{
  "identify": "nguyenvana",
  "password": "12345678"
}
```

> `identify` có thể là **email** hoặc **username**

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "responseObject": {
    "message": "...",
    "user": {
      "id": "uuid-v7",
      "username": "nguyenvana",
      "email": "a@example.com",
      "create_time": "2026-07-10T00:00:00.000Z"
    }
  },
  "statusCode": 200
}
```

> ⚠️ **Access token** được trả trong response hoặc cookie (tuỳ implementation). Refresh token luôn qua cookie.

---

### `POST /auth/token`

Lấy access token mới bằng refresh token (trong cookie).

**Request:** Không cần body — cookie tự gửi.

**Response (200):**
```json
{
  "success": true,
  "responseObject": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  },
  "statusCode": 200
}
```

---

### `POST /auth/logout`

Đăng xuất — revoke refresh token.

🔒 **Auth required**

**Request:** Không cần body.

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful",
  "statusCode": 200
}
```

---

## 2. User

### `GET /users`

Lấy danh sách tất cả users.

🔒 **Auth required** | 👑 **Admin only**

**Response (200):**
```json
{
  "responseObject": [
    {
      "id": "uuid-v7",
      "email": "a@example.com",
      "full_name": "Nguyễn Văn A",
      "username": "nguyenvana",
      "role": "student",
      "avatar_url": "https://...",
      "create_at": "2026-07-10T00:00:00.000Z"
    }
  ]
}
```

---

### `GET /users/:id`

Lấy thông tin 1 user theo ID.

**Params:** `id` (string, 36 chars)

---

### `PUT /users/change-password`

Đổi mật khẩu.

🔒 **Auth required**

**Request Body:**
```json
{
  "oldPassword": "12345678",
  "newPassword": "newpass123"
}
```

---

### `PUT /users/change-avatar`

Đổi avatar.

🔒 **Auth required**

**Request:** `multipart/form-data`

| Field | Type | Mô tả |
|-------|------|--------|
| `avatar` | File (image) | jpeg, jpg, png, gif, webp. Max 5MB |

---

## 3. Subject (Môn học)

### `GET /subjects`

Lấy tất cả môn học. **Không cần auth.**

**Response:**
```json
{
  "responseObject": [
    {
      "id": "uuid-v7",
      "name": "Cơ sở dữ liệu",
      "description": "Học về SQL, NoSQL..."
    }
  ]
}
```

---

### `GET /subjects/:id`

Lấy 1 môn học theo ID.

---

### `POST /subjects`

Tạo môn học mới.

**Request Body:**
```json
{
  "name": "Lập trình web",
  "description": "HTML, CSS, JavaScript..."
}
```

---

### `PUT /subjects/:id`

Cập nhật môn học.

**Request Body:** (tất cả fields)
```json
{
  "name": "Lập trình web nâng cao",
  "description": "React, Node.js..."
}
```

---

### `DELETE /subjects/:id`

Xóa môn học. ⚠️ Cascade xóa exams liên quan.

---

## 4. Question (Câu hỏi)

### `GET /questions`

Lấy tất cả câu hỏi.

---

### `GET /questions/created-by/:userId`

Lấy câu hỏi theo người tạo.

---

### `GET /questions/:id`

Lấy 1 câu hỏi theo ID.

**Response:**
```json
{
  "responseObject": {
    "id": "uuid-v7",
    "content": "SQL là viết tắt của gì?",
    "created_by": "uuid-v7",
    "created_at": "2026-07-10T00:00:00.000Z"
  }
}
```

---

### `POST /questions`

Tạo câu hỏi mới.

🔒 **Auth required** | 👑 **Admin only**

**Request Body:**
```json
{
  "content": "SQL là viết tắt của gì?"
}
```

---

### `PUT /questions/:id`

Cập nhật câu hỏi.

**Request Body:**
```json
{
  "content": "SQL là viết tắt của cụm từ nào?"
}
```

---

### `DELETE /questions/:id`

Xóa câu hỏi.

---

## 5. Answer (Đáp án)

### `GET /answers`

Lấy tất cả đáp án.

---

### `GET /answers/question/:questionId`

Lấy tất cả đáp án của 1 câu hỏi. **Dùng để hiển thị đáp án khi xem chi tiết.**

**Response:**
```json
{
  "responseObject": [
    {
      "id": "uuid-v7",
      "question_id": "uuid-v7",
      "content": "Structured Query Language",
      "is_correct": true
    },
    {
      "id": "uuid-v7",
      "question_id": "uuid-v7",
      "content": "Simple Query Language",
      "is_correct": false
    }
  ]
}
```

---

### `GET /answers/:id`

Lấy 1 đáp án theo ID.

---

### `POST /answers`

Tạo đáp án cho câu hỏi.

**Request Body:**
```json
{
  "question_id": "uuid-v7",
  "content": "Structured Query Language",
  "is_correct": true
}
```

---

### `PUT /answers/:id`

Cập nhật đáp án.

**Request Body:**
```json
{
  "content": "Sửa nội dung đáp án",
  "is_correct": false
}
```

---

### `DELETE /answers/:id`

Xóa đáp án.

---

## 6. Exam (Đề thi)

### `GET /exams`

Lấy tất cả đề thi.

**Response:**
```json
{
  "responseObject": [
    {
      "id": "uuid-v7",
      "title": "Kiểm tra giữa kỳ CSDL",
      "description": "Bài kiểm tra chương 1-5",
      "subject_id": "uuid-v7",
      "duration_minutes": 60,
      "total_marks": 100,
      "pass_percentage": 50,
      "is_published": true,
      "created_by": "uuid-v7",
      "created_at": "2026-07-10T00:00:00.000Z"
    }
  ]
}
```

---

### `GET /exams/subject/:subjectId`

Lấy tất cả đề thi theo môn học. **Dùng cho trang danh sách đề thi theo môn.**

---

### `GET /exams/:id`

Lấy thông tin 1 đề thi (metadata, không kèm câu hỏi).

---

### `GET /exams/:id/detail` ⭐

**Lấy đề thi đầy đủ kèm câu hỏi + đáp án** (ẩn `is_correct` cho student).

> 💡 **FE dùng endpoint này khi student bắt đầu làm bài.**

**Response:**
```json
{
  "responseObject": {
    "exam": {
      "id": "uuid-v7",
      "title": "Kiểm tra giữa kỳ CSDL",
      "duration_minutes": 60,
      "total_marks": 100,
      "pass_percentage": 50
    },
    "questions": [
      {
        "id": "uuid-v7",
        "content": "SQL là viết tắt của gì?",
        "answers": [
          { "id": "uuid-v7", "question_id": "uuid-v7", "content": "Structured Query Language" },
          { "id": "uuid-v7", "question_id": "uuid-v7", "content": "Simple Query Language" },
          { "id": "uuid-v7", "question_id": "uuid-v7", "content": "Standard Query Language" },
          { "id": "uuid-v7", "question_id": "uuid-v7", "content": "System Query Language" }
        ]
      }
    ]
  }
}
```

> ⚠️ `is_correct` **KHÔNG** có trong response → student không biết đáp án đúng.

---

### `POST /exams`

Tạo đề thi mới (chỉ metadata, chưa có câu hỏi).

🔒 **Auth required** | 👑 **Admin only**

**Request Body:**
```json
{
  "title": "Kiểm tra giữa kỳ CSDL",
  "description": "Bài kiểm tra chương 1-5",
  "subject_id": "uuid-v7",
  "duration_minutes": 60,
  "total_marks": 100,
  "pass_percentage": 50,
  "is_published": false
}
```

---

### `PUT /exams/:id`

Cập nhật đề thi. Tất cả fields optional.

**Request Body:**
```json
{
  "title": "Kiểm tra cuối kỳ CSDL",
  "is_published": true
}
```

---

### `DELETE /exams/:id`

Xóa đề thi. ⚠️ Cascade xóa exam_questions liên quan.

---

### `POST /exams/import` ⭐

Import đề thi từ file Excel (.xlsx).

🔒 **Auth required** | 👑 **Admin only**

**Request:** `multipart/form-data`

| Field | Type | Mô tả |
|-------|------|--------|
| `file` | File (.xlsx) | File Excel. Max 10MB |
| `subject_id` | string | ID môn học (optional nếu Excel có SubjectId) |

> File Excel cần 2 sheets: `Exam` (Title, Description, Duration, TotalMarks, PassPercentage) và `Questions` (Content, Option1-4, Correct)

---

## 7. Exam Question (Liên kết đề-câu hỏi)

### `GET /exam-questions`

Lấy tất cả liên kết exam-question.

**Response:**
```json
{
  "responseObject": [
    {
      "id": "uuid-v7",
      "exam_id": "uuid-v7",
      "question_id": "uuid-v7"
    }
  ]
}
```

---

### `GET /exam-questions/:id`

Lấy 1 liên kết theo ID.

---

### `POST /exam-questions`

Thêm câu hỏi vào đề thi.

**Request Body:**
```json
{
  "exam_id": "uuid-v7",
  "question_id": "uuid-v7"
}
```

---

### `PUT /exam-questions/:id`

Cập nhật liên kết.

**Request Body:**
```json
{
  "exam_id": "uuid-v7",
  "question_id": "uuid-v7"
}
```

---

### `DELETE /exam-questions/:id`

Xóa liên kết (gỡ câu hỏi khỏi đề).

---

## 8. User Exam Attempt (Làm bài thi)

### `GET /user-exam-attempts`

Lấy tất cả lượt thi.

🔒 **Auth required** | 👑 **Admin only**

---

### `GET /user-exam-attempts/user/:userId`

Lấy tất cả lượt thi của 1 user. **Dùng cho trang lịch sử làm bài.**

🔒 **Auth required**

---

### `GET /user-exam-attempts/exam/:examId`

Lấy tất cả lượt thi của 1 đề.

🔒 **Auth required**

---

### `GET /user-exam-attempts/:id`

Lấy thông tin 1 lượt thi.

🔒 **Auth required**

**Response:**
```json
{
  "responseObject": {
    "id": "uuid-v7",
    "user_id": "uuid-v7",
    "exam_id": "uuid-v7",
    "status": "in_progress",
    "score": null,
    "started_at": "2026-07-10T00:00:00.000Z",
    "submitted_at": null,
    "time_spent_seconds": null
  }
}
```

| Status | Mô tả |
|--------|--------|
| `in_progress` | Đang làm bài |
| `submitted` | Đã nộp bài |
| `time_out` | Hết giờ |

---

### `POST /user-exam-attempts/start` ⭐

**Bắt đầu 1 lượt thi mới.** FE gọi khi student nhấn "Bắt đầu làm bài".

🔒 **Auth required**

**Request Body:**
```json
{
  "exam_id": "uuid-v7"
}
```

**Response:** Trả về attempt object với `status: "in_progress"`.

---

### `PUT /user-exam-attempts/:id/submit` ⭐

**Nộp bài thi.** FE gọi khi student nhấn "Nộp bài" hoặc hết giờ.

🔒 **Auth required**

**Request Body:**
```json
{
  "score": 85.5,
  "time_spent_seconds": 3420
}
```

---

### `GET /user-exam-attempts/:id/result` ⭐

**Xem kết quả chi tiết** sau khi nộp bài.

🔒 **Auth required**

---

### `DELETE /user-exam-attempts/:id`

Xóa lượt thi.

🔒 **Auth required** | 👑 **Admin only**

---

## 9. User Answer (Nộp đáp án)

### `GET /user-answers`

Lấy tất cả user answers.

🔒 **Auth required** | 👑 **Admin only**

---

### `GET /user-answers/attempt/:attempId`

Lấy tất cả đáp án của 1 lượt thi. **Dùng cho trang xem kết quả chi tiết.**

🔒 **Auth required**

---

### `GET /user-answers/:id`

Lấy 1 đáp án theo ID.

🔒 **Auth required**

---

### `POST /user-answers` ⭐

**Nộp 1 đáp án cho 1 câu hỏi.** Server tự động kiểm tra đúng/sai.

🔒 **Auth required**

**Request Body:**
```json
{
  "attemp_id": "uuid-v7",
  "question_id": "uuid-v7",
  "selected_answer_id": "uuid-v7"
}
```

> ⚠️ Tên field là `attemp_id` (thiếu chữ 't'), **giữ nguyên theo DB schema**.

**Response:**
```json
{
  "responseObject": {
    "id": "uuid-v7",
    "attemp_id": "uuid-v7",
    "question_id": "uuid-v7",
    "selected_answer_id": "uuid-v7",
    "is_correct": true,
    "answered_at": "2026-07-10T00:00:00.000Z"
  }
}
```

---

### `PUT /user-answers/:id`

Đổi đáp án đã chọn (re-check đúng/sai).

🔒 **Auth required**

**Request Body:**
```json
{
  "selected_answer_id": "uuid-v7"
}
```

---

### `DELETE /user-answers/:id`

Xóa đáp án.

🔒 **Auth required** | 👑 **Admin only**

---

## 10. Statistics (Thống kê)

### `GET /statistics/student/me`

Thống kê cá nhân của student đang đăng nhập.

🔒 **Auth required**

**Response:**
```json
{
  "responseObject": {
    "total_attempts": 15,
    "average_score": 78.5,
    "correct_rate": 0.82,
    "exams_taken": 8
  }
}
```

---

### `GET /statistics/exam/:examId`

Thống kê 1 đề thi (bao nhiêu người làm, điểm TB, ...).

🔒 **Auth required**

**Response:**
```json
{
  "responseObject": {
    "total_attempts": 120,
    "average_score": 72.3,
    "pass_rate": 0.65,
    "highest_score": 100
  }
}
```

---

### `GET /statistics/admin/overview`

Tổng quan hệ thống cho admin dashboard.

🔒 **Auth required** | 👑 **Admin only**

**Response:**
```json
{
  "responseObject": {
    "total_users": 500,
    "total_exams": 30,
    "total_questions": 1200,
    "total_attempts": 5000
  }
}
```

---

## 11. AI Generation (Sinh đề AI) 🤖

> Module mới — sử dụng AI (OpenRouter/Ollama/NVIDIA) kết hợp RAG (Qdrant vector DB) để tự động sinh đề thi.

### `POST /ai/generate-exam` ⭐⭐

**Sinh đề thi tự động bằng AI.** Endpoint quan trọng nhất.

🔒 **Auth required** | 👑 **Admin only**

**Request Body:**
```json
{
  "subject_id": "uuid-v7",
  "topic": "Cơ sở dữ liệu quan hệ",
  "num_questions": 10,
  "difficulty": "medium",
  "language": "vi",
  "exam_title": "Kiểm tra CSDL - AI Generated",
  "exam_duration_minutes": 45,
  "additional_instructions": "Tập trung vào SQL JOIN và subquery",
  "provider": "openrouter",
  "auto_save": true
}
```

| Field | Type | Required | Default | Mô tả |
|-------|------|----------|---------|--------|
| `subject_id` | string (uuid) | ✅ | — | ID môn học |
| `topic` | string | ❌ | — | Chủ đề cụ thể (optional) |
| `num_questions` | number | ❌ | `10` | Số câu hỏi (1-50) |
| `difficulty` | enum | ❌ | `"medium"` | `"easy"` / `"medium"` / `"hard"` / `"mixed"` |
| `language` | enum | ❌ | `"vi"` | `"vi"` (tiếng Việt) / `"en"` (English) |
| `exam_title` | string | ❌ | Auto | Tên đề thi |
| `exam_duration_minutes` | number | ❌ | `60` | Thời gian (phút) |
| `additional_instructions` | string | ❌ | — | Yêu cầu bổ sung cho AI |
| `provider` | enum | ❌ | Server default | `"openrouter"` / `"ollama"` / `"nvidia"` |
| `auto_save` | boolean | ❌ | `true` | Tự động lưu vào DB |

**Response (200):**
```json
{
  "success": true,
  "message": "Exam generated successfully",
  "responseObject": {
    "exam_id": "uuid-v7",
    "generated_questions": [
      {
        "content": "Trong SQL, lệnh nào dùng để truy vấn dữ liệu?",
        "difficulty": "easy",
        "explanation": "SELECT là lệnh cơ bản nhất trong SQL để truy vấn dữ liệu từ bảng.",
        "answers": [
          { "content": "SELECT", "is_correct": true },
          { "content": "INSERT", "is_correct": false },
          { "content": "UPDATE", "is_correct": false },
          { "content": "DELETE", "is_correct": false }
        ]
      }
    ],
    "metadata": {
      "provider_used": "openrouter",
      "model_used": "google/gemini-2.5-flash",
      "generation_time_ms": 8500,
      "rag_context_used": true,
      "total_questions": 10
    }
  },
  "statusCode": 200
}
```

> ⏱️ **Lưu ý**: API này có thể mất **5-30 giây** tuỳ số câu hỏi và model. FE nên hiển thị loading state.

> 💡 Khi `auto_save: true`, đề thi sẽ được lưu tự động vào DB với `is_published: false`. Admin có thể review rồi publish.

---

### `POST /ai/upload-document`

Upload tài liệu Markdown vào knowledge base cho RAG.

🔒 **Auth required** | 👑 **Admin only**

**Request:** `multipart/form-data`

| Field | Type | Required | Mô tả |
|-------|------|----------|--------|
| `subject_id` | string (uuid) | ✅ | Môn học mà tài liệu thuộc về |
| `file` | File (.md, .txt) | ✅ | File Markdown. Max 10MB |

**Response (200):**
```json
{
  "success": true,
  "message": "Document uploaded and processed successfully",
  "responseObject": {
    "chunks_processed": 23,
    "subject_id": "uuid-v7"
  },
  "statusCode": 200
}
```

> 💡 Tài liệu được chia thành chunks, embedding, và lưu vào Qdrant. Khi generate exam, AI sẽ tìm context liên quan từ đây.

---

### `POST /ai/sync-questions`

Sync câu hỏi hiện có từ MySQL vào vector store (Qdrant) để AI tham khảo.

🔒 **Auth required** | 👑 **Admin only**

**Request Body:**
```json
{
  "subject_id": "uuid-v7"
}
```

> `subject_id` optional — nếu không truyền sẽ sync **tất cả** câu hỏi.

**Response (200):**
```json
{
  "success": true,
  "message": "Synced 150 questions to vector store",
  "responseObject": {
    "synced": 150
  },
  "statusCode": 200
}
```

---

### `GET /ai/providers`

Xem danh sách AI providers khả dụng.

🔒 **Auth required**

**Response (200):**
```json
{
  "responseObject": [
    { "name": "openrouter", "configured": true },
    { "name": "ollama", "configured": true },
    { "name": "nvidia", "configured": false }
  ]
}
```

---

### `GET /ai/vector-status`

Kiểm tra trạng thái vector store (Qdrant).

🔒 **Auth required**

**Response (200):**
```json
{
  "responseObject": {
    "vectors_count": 450,
    "status": "green"
  }
}
```

---

## Error Handling

### Common Error Responses

| Status Code | Mô tả |
|-------------|--------|
| `200` | Thành công |
| `400` | Bad Request — dữ liệu input không hợp lệ |
| `401` | Unauthorized — chưa đăng nhập hoặc token hết hạn |
| `403` | Forbidden — không đủ quyền (ví dụ student gọi API admin) |
| `404` | Not Found — resource không tồn tại |
| `500` | Internal Server Error — lỗi server |

**Error Response Format:**
```json
{
  "success": false,
  "message": "Mô tả lỗi",
  "responseObject": null,
  "statusCode": 400
}
```

**Validation Error (400):**
```json
{
  "success": false,
  "message": "Invalid input",
  "responseObject": [
    {
      "path": "body.email",
      "message": "Invalid email format"
    }
  ],
  "statusCode": 400
}
```

---

## Luồng hoạt động chính (cho FE)

### Luồng thi sinh làm bài

```
1. GET /exams/subject/:subjectId          → Danh sách đề thi theo môn
2. POST /user-exam-attempts/start         → Bắt đầu lượt thi (trả attempt_id)
3. GET /exams/:id/detail                  → Lấy đề thi + câu hỏi + đáp án
4. POST /user-answers (x N lần)           → Nộp từng đáp án
5. PUT /user-exam-attempts/:id/submit     → Nộp bài (truyền score, time)
6. GET /user-exam-attempts/:id/result     → Xem kết quả chi tiết
```

### Luồng admin tạo đề bằng AI

```
1. POST /ai/upload-document (tùy chọn)    → Upload tài liệu tham khảo
2. POST /ai/sync-questions (tùy chọn)     → Sync câu hỏi cũ
3. POST /ai/generate-exam                 → AI sinh đề (auto_save=true)
4. GET /exams/:exam_id                    → Review đề vừa tạo
5. PUT /exams/:exam_id                    → Publish: { is_published: true }
```

---

## Swagger UI

Truy cập **Swagger UI** tại `http://localhost:8080/` để test API trực tiếp trên trình duyệt.

File JSON: `http://localhost:8080/swagger.json`
