-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "board" TEXT,
    "address" TEXT,
    "timezone" TEXT DEFAULT 'Asia/Kolkata',
    "defaultLanguage" TEXT NOT NULL DEFAULT 'MARATHI',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'TEACHER',
    "schoolId" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'ENGLISH',
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "banReason" TEXT,
    "banExpires" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "accessTokenExpiresAt" DATETIME,
    "refreshTokenExpiresAt" DATETIME,
    "scope" TEXT,
    "idToken" TEXT,
    "password" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "activeOrganizationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "division" TEXT,
    "gradeLevel" INTEGER,
    "academicYear" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "classes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "defaultLanguage" TEXT NOT NULL DEFAULT 'BILINGUAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "subjects_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "class_subjects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "class_subjects_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "class_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rollNumber" TEXT NOT NULL,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'BILINGUAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "students_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "students_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "exams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "examDate" DATETIME NOT NULL,
    "totalMarks" DECIMAL,
    "outputLanguage" TEXT NOT NULL DEFAULT 'BILINGUAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "exams_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "exams_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "exams_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "exam_paper_uploads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacherId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "originalFileName" TEXT,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "checksum" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processingStatus" TEXT NOT NULL DEFAULT 'UPLOADED',
    "detectedStudentCount" INTEGER NOT NULL DEFAULT 0,
    "outputLanguage" TEXT NOT NULL DEFAULT 'BILINGUAL',
    "errorMessage" TEXT,
    CONSTRAINT "exam_paper_uploads_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "exam_paper_uploads_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "student_answer_sheets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uploadId" TEXT NOT NULL,
    "studentId" TEXT,
    "detectedStudentName" TEXT,
    "detectedRollNumber" TEXT,
    "pageRangeStart" INTEGER NOT NULL,
    "pageRangeEnd" INTEGER NOT NULL,
    "extractedText" TEXT,
    "extractedMetadata" JSONB,
    "documentLanguage" TEXT NOT NULL DEFAULT 'BILINGUAL',
    "processingStatus" TEXT NOT NULL DEFAULT 'DETECTED',
    "ocrConfidence" REAL,
    "studentMatchConfidence" REAL,
    "matchedByTeacher" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "student_answer_sheets_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "exam_paper_uploads" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "student_answer_sheets_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "answer_analyses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentAnswerSheetId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "analysisStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "studentScore" DECIMAL NOT NULL,
    "strengths" JSONB NOT NULL,
    "weakTopics" JSONB NOT NULL,
    "conceptualMistakes" JSONB NOT NULL,
    "teacherRemarks" JSONB,
    "answerBreakdown" JSONB,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT true,
    "outputLanguage" TEXT NOT NULL DEFAULT 'BILINGUAL',
    "aiModel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "reviewedAt" DATETIME,
    CONSTRAINT "answer_analyses_studentAnswerSheetId_fkey" FOREIGN KEY ("studentAnswerSheetId") REFERENCES "student_answer_sheets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "learning_improvement_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "analysisId" TEXT NOT NULL,
    "activities" JSONB NOT NULL,
    "advancedActivitiesForTopStudents" JSONB,
    "recommendedStudySchedule" JSONB NOT NULL,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT true,
    "outputLanguage" TEXT NOT NULL DEFAULT 'BILINGUAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "learning_improvement_plans_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "answer_analyses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "teacher_edits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "analysisId" TEXT,
    "learningImprovementPlanId" TEXT,
    "fieldEdited" TEXT NOT NULL,
    "originalText" JSONB NOT NULL,
    "editedText" JSONB NOT NULL,
    "editedByTeacherId" TEXT NOT NULL,
    "editedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "teacher_edits_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "answer_analyses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "teacher_edits_learningImprovementPlanId_fkey" FOREIGN KEY ("learningImprovementPlanId") REFERENCES "learning_improvement_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "teacher_edits_editedByTeacherId_fkey" FOREIGN KEY ("editedByTeacherId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_processing_jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobType" TEXT NOT NULL,
    "inputReferenceId" TEXT NOT NULL,
    "inputReferenceType" TEXT NOT NULL,
    "outputReferenceId" TEXT,
    "outputReferenceType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "provider" TEXT NOT NULL DEFAULT 'gemini',
    "modelName" TEXT,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "processingTimeMs" INTEGER,
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "examId" TEXT,
    "uploadId" TEXT,
    "studentAnswerSheetId" TEXT,
    "analysisId" TEXT,
    "learningImprovementPlanId" TEXT,
    CONSTRAINT "ai_processing_jobs_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ai_processing_jobs_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "exam_paper_uploads" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ai_processing_jobs_studentAnswerSheetId_fkey" FOREIGN KEY ("studentAnswerSheetId") REFERENCES "student_answer_sheets" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ai_processing_jobs_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "answer_analyses" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ai_processing_jobs_learningImprovementPlanId_fkey" FOREIGN KEY ("learningImprovementPlanId") REFERENCES "learning_improvement_plans" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "generated_pdfs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "analysisId" TEXT,
    "learningImprovementPlanId" TEXT,
    "teacherId" TEXT NOT NULL,
    "pdfType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSizeBytes" INTEGER,
    "checksum" TEXT,
    "language" TEXT NOT NULL DEFAULT 'BILINGUAL',
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "generated_pdfs_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "answer_analyses" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "generated_pdfs_learningImprovementPlanId_fkey" FOREIGN KEY ("learningImprovementPlanId") REFERENCES "learning_improvement_plans" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "generated_pdfs_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_insights" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examId" TEXT NOT NULL,
    "classId" TEXT,
    "subjectId" TEXT,
    "topicName" TEXT NOT NULL,
    "averageScore" DECIMAL NOT NULL,
    "studentsStruggling" JSONB NOT NULL,
    "studentsStrugglingCount" INTEGER NOT NULL DEFAULT 0,
    "generatedSummary" JSONB,
    "language" TEXT NOT NULL DEFAULT 'BILINGUAL',
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_insights_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ai_insights_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ai_insights_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "schools_code_key" ON "schools"("code");

-- CreateIndex
CREATE INDEX "schools_name_idx" ON "schools"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_schoolId_role_idx" ON "users"("schoolId", "role");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_providerId_accountId_key" ON "accounts"("providerId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "verifications_identifier_idx" ON "verifications"("identifier");

-- CreateIndex
CREATE INDEX "verifications_expiresAt_idx" ON "verifications"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "verifications_identifier_value_key" ON "verifications"("identifier", "value");

-- CreateIndex
CREATE INDEX "classes_schoolId_academicYear_idx" ON "classes"("schoolId", "academicYear");

-- CreateIndex
CREATE UNIQUE INDEX "classes_schoolId_name_division_academicYear_key" ON "classes"("schoolId", "name", "division", "academicYear");

-- CreateIndex
CREATE INDEX "subjects_schoolId_idx" ON "subjects"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_schoolId_name_key" ON "subjects"("schoolId", "name");

-- CreateIndex
CREATE INDEX "class_subjects_subjectId_idx" ON "class_subjects"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "class_subjects_classId_subjectId_key" ON "class_subjects"("classId", "subjectId");

-- CreateIndex
CREATE INDEX "students_schoolId_classId_idx" ON "students"("schoolId", "classId");

-- CreateIndex
CREATE INDEX "students_name_idx" ON "students"("name");

-- CreateIndex
CREATE UNIQUE INDEX "students_classId_rollNumber_key" ON "students"("classId", "rollNumber");

-- CreateIndex
CREATE INDEX "exams_teacherId_examDate_idx" ON "exams"("teacherId", "examDate");

-- CreateIndex
CREATE INDEX "exams_classId_examDate_idx" ON "exams"("classId", "examDate");

-- CreateIndex
CREATE INDEX "exams_subjectId_examDate_idx" ON "exams"("subjectId", "examDate");

-- CreateIndex
CREATE INDEX "exam_paper_uploads_teacherId_uploadedAt_idx" ON "exam_paper_uploads"("teacherId", "uploadedAt");

-- CreateIndex
CREATE INDEX "exam_paper_uploads_examId_processingStatus_idx" ON "exam_paper_uploads"("examId", "processingStatus");

-- CreateIndex
CREATE INDEX "exam_paper_uploads_processingStatus_uploadedAt_idx" ON "exam_paper_uploads"("processingStatus", "uploadedAt");

-- CreateIndex
CREATE INDEX "student_answer_sheets_uploadId_processingStatus_idx" ON "student_answer_sheets"("uploadId", "processingStatus");

-- CreateIndex
CREATE INDEX "student_answer_sheets_studentId_idx" ON "student_answer_sheets"("studentId");

-- CreateIndex
CREATE INDEX "student_answer_sheets_detectedStudentName_idx" ON "student_answer_sheets"("detectedStudentName");

-- CreateIndex
CREATE UNIQUE INDEX "student_answer_sheets_uploadId_pageRangeStart_pageRangeEnd_key" ON "student_answer_sheets"("uploadId", "pageRangeStart", "pageRangeEnd");

-- CreateIndex
CREATE INDEX "answer_analyses_studentAnswerSheetId_analysisStatus_idx" ON "answer_analyses"("studentAnswerSheetId", "analysisStatus");

-- CreateIndex
CREATE INDEX "answer_analyses_createdAt_idx" ON "answer_analyses"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "answer_analyses_studentAnswerSheetId_version_key" ON "answer_analyses"("studentAnswerSheetId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "learning_improvement_plans_analysisId_key" ON "learning_improvement_plans"("analysisId");

-- CreateIndex
CREATE INDEX "learning_improvement_plans_createdAt_idx" ON "learning_improvement_plans"("createdAt");

-- CreateIndex
CREATE INDEX "teacher_edits_analysisId_idx" ON "teacher_edits"("analysisId");

-- CreateIndex
CREATE INDEX "teacher_edits_learningImprovementPlanId_idx" ON "teacher_edits"("learningImprovementPlanId");

-- CreateIndex
CREATE INDEX "teacher_edits_editedByTeacherId_editedAt_idx" ON "teacher_edits"("editedByTeacherId", "editedAt");

-- CreateIndex
CREATE INDEX "ai_processing_jobs_jobType_status_createdAt_idx" ON "ai_processing_jobs"("jobType", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ai_processing_jobs_inputReferenceType_inputReferenceId_idx" ON "ai_processing_jobs"("inputReferenceType", "inputReferenceId");

-- CreateIndex
CREATE INDEX "ai_processing_jobs_examId_idx" ON "ai_processing_jobs"("examId");

-- CreateIndex
CREATE INDEX "ai_processing_jobs_uploadId_idx" ON "ai_processing_jobs"("uploadId");

-- CreateIndex
CREATE INDEX "ai_processing_jobs_studentAnswerSheetId_idx" ON "ai_processing_jobs"("studentAnswerSheetId");

-- CreateIndex
CREATE INDEX "ai_processing_jobs_analysisId_idx" ON "ai_processing_jobs"("analysisId");

-- CreateIndex
CREATE INDEX "ai_processing_jobs_learningImprovementPlanId_idx" ON "ai_processing_jobs"("learningImprovementPlanId");

-- CreateIndex
CREATE INDEX "generated_pdfs_teacherId_generatedAt_idx" ON "generated_pdfs"("teacherId", "generatedAt");

-- CreateIndex
CREATE INDEX "generated_pdfs_analysisId_pdfType_idx" ON "generated_pdfs"("analysisId", "pdfType");

-- CreateIndex
CREATE INDEX "generated_pdfs_learningImprovementPlanId_pdfType_idx" ON "generated_pdfs"("learningImprovementPlanId", "pdfType");

-- CreateIndex
CREATE INDEX "ai_insights_examId_topicName_idx" ON "ai_insights"("examId", "topicName");

-- CreateIndex
CREATE INDEX "ai_insights_classId_subjectId_idx" ON "ai_insights"("classId", "subjectId");

-- CreateIndex
CREATE INDEX "ai_insights_generatedAt_idx" ON "ai_insights"("generatedAt");
