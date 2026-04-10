<template>
  <section class="page alt doctor-page">
    <div class="page-header">
      <div>
        <div class="welcome">Welcome back, {{ workspaceDisplayName }}</div>
        <div class="sub">{{ workspaceSubtitle }}</div>
      </div>
      <div class="pill doctor-pill">{{ workspacePillLabel }}</div>
    </div>

    <div v-if="feedback.message" :class="['alert', feedback.type === 'success' ? 'success' : '']">{{ feedback.message }}</div>

    <div class="card doctor-switcher" v-if="store.courses.length">
      <div>
        <div class="card-title">Teaching Portfolio</div>
        <div class="list-sub">Choose the course you want to manage right now.</div>
      </div>
      <select v-model.number="selectedCourseId" class="doctor-select">
        <option v-for="course in store.courses" :key="course.id" :value="course.id">{{ course.name }}</option>
      </select>
    </div>

    <div v-if="selectedCourse" class="card doctor-command-card doctor-command-card-strong">
      <div class="doctor-command-hero">
        <div>
          <div class="spotlight-kicker">{{ workspaceCommandCenterLabel }}</div>
          <div class="spotlight-title doctor-command-title">{{ selectedCourse.name }}</div>
          <div class="spotlight-sub">{{ selectedCourse.description || 'Build a polished academic experience with structured lessons, assignments, quizzes, attendance, and timely announcements.' }}</div>
          <div class="doctor-course-meta-grid">
            <span v-if="selectedCourse.code" class="meta-chip">Code {{ selectedCourse.code }}</span>
            <span v-if="selectedCourse.department" class="meta-chip">{{ selectedCourse.department }}</span>
            <span v-if="selectedCourse.term" class="meta-chip">{{ selectedCourse.term }}</span>
            <span v-if="selectedCourse.status" class="meta-chip">{{ selectedCourse.status }}</span>
            <span class="meta-chip">{{ selectedCourse.totalAssignments }} assignments</span>
            <span class="meta-chip">{{ selectedCourse.totalAttendanceSessions }} attendance sessions</span>
          </div>
        </div>
        <div class="doctor-command-state">
          <span class="badge">{{ selectedCourse.isPublished ? 'Visible on website' : 'Hidden from website' }}</span>
          <span class="badge badge-neutral">{{ selectedCourse.autoEnroll ? 'Auto enroll active' : 'Manual roster control' }}</span>
        </div>
      </div>

      <div class="doctor-command-metrics doctor-command-metrics-strong">
        <div class="summary-pill">
          <div class="stat-label">Lessons</div>
          <div class="stat-value">{{ selectedCourse.totalLessons }}</div>
          <div class="stat-sub">Structured learning steps</div>
        </div>
        <div class="summary-pill">
          <div class="stat-label">Students</div>
          <div class="stat-value">{{ selectedCourseEnrollments.length }}</div>
          <div class="stat-sub">Visible roster</div>
        </div>
        <div class="summary-pill">
          <div class="stat-label">Pending Grading</div>
          <div class="stat-value">{{ pendingAssignmentSubmissions.length }}</div>
          <div class="stat-sub">Assignment work waiting on you</div>
        </div>
        <div class="summary-pill">
          <div class="stat-label">Attendance</div>
          <div class="stat-value">{{ formatPercent(selectedCourseAttendanceRate) }}</div>
          <div class="stat-sub">Current recorded attendance</div>
        </div>
      </div>

      <div class="doctor-command-actions">
        <button class="btn-primary" @click="store.activePage = 'courses'">Course Settings</button>
        <button class="btn-secondary" @click="store.activePage = 'lessons'">Lesson Builder</button>
        <button class="btn-secondary" @click="store.activePage = 'enrollments'">Roster & Attendance</button>
        <button class="btn-secondary" @click="store.activePage = 'quizzes'">Assessments</button>
        <button class="btn-secondary" @click="store.activePage = 'quiz-results'">Gradebook</button>
      </div>
    </div>

    <template v-if="store.activePage === 'dashboard'">
      <div class="doctor-summary-grid">
        <div class="summary-pill">
          <div class="stat-label">Courses</div>
          <div class="stat-value">{{ store.courses.length }}</div>
          <div class="stat-sub">{{ workspaceCourseSummaryLabel }}</div>
        </div>
        <div class="summary-pill">
          <div class="stat-label">Assignments</div>
          <div class="stat-value">{{ store.assignments.length }}</div>
          <div class="stat-sub">Across your teaching load</div>
        </div>
        <div class="summary-pill">
          <div class="stat-label">Pending Submissions</div>
          <div class="stat-value">{{ pendingAssignmentSubmissions.length }}</div>
          <div class="stat-sub">Need grading attention</div>
        </div>
        <div class="summary-pill">
          <div class="stat-label">Attendance Sessions</div>
          <div class="stat-value">{{ store.attendanceSessions.length }}</div>
          <div class="stat-sub">Marked from the portal</div>
        </div>
      </div>

      <div class="doctor-dashboard-grid doctor-dashboard-grid-strong">
        <div class="card doctor-pulse-card">
          <div class="card-header">
            <div>
              <div class="card-title">Teaching Pulse</div>
              <div class="list-sub">See what needs attention for {{ selectedCourse?.name || 'your current course' }}.</div>
            </div>
            <button class="link" @click="store.activePage = 'courses'">Open course controls</button>
          </div>

          <div class="doctor-pulse-grid">
            <div class="focus-card focus-card-primary">
              <div class="focus-card-head">
                <span class="focus-chip">Next deadline</span>
                <span class="badge badge-neutral">{{ selectedCourseUpcomingAssessment?.date ? formatDate(selectedCourseUpcomingAssessment.date) : 'Not set' }}</span>
              </div>
              <div class="focus-title">{{ selectedCourseUpcomingAssessment?.title || 'No upcoming assessment yet' }}</div>
              <div class="focus-text">{{ selectedCourseUpcomingAssessment?.note || 'Add an assignment or quiz to start building a clearer academic rhythm.' }}</div>
              <button class="link" @click="store.activePage = 'courses'">Open coursework tools</button>
            </div>

            <div class="focus-card">
              <div class="focus-card-head">
                <span class="focus-chip">Roster status</span>
                <span class="badge badge-neutral">{{ selectedCourseEnrollments.length }} enrolled</span>
              </div>
              <div class="focus-title">{{ filteredSelectedCourseEnrollments[0]?.studentName || 'No students enrolled yet' }}</div>
              <div class="focus-text">Use the roster tools to enroll students, manage attendance, and watch progress course-by-course.</div>
              <button class="link" @click="store.activePage = 'enrollments'">Open roster</button>
            </div>

            <div class="focus-card">
              <div class="focus-card-head">
                <span class="focus-chip">Pending grading</span>
                <span class="badge badge-neutral">{{ pendingAssignmentSubmissions.length }} waiting</span>
              </div>
              <div class="focus-title">{{ pendingAssignmentSubmissions[0]?.assignment || 'Nothing waiting right now' }}</div>
              <div class="focus-text">Jump into the gradebook to publish feedback quickly and keep students moving.</div>
              <button class="link" @click="store.activePage = 'quiz-results'">Open gradebook</button>
            </div>
          </div>

          <div class="doctor-roster-preview">
            <div class="card-title">Recent Submissions</div>
            <div class="list">
              <div v-for="submission in selectedCourseAssignmentSubmissions.slice(0, 4)" :key="submission.id" class="doctor-enrollment-row doctor-enrollment-row-soft">
                <div>
                  <div class="list-title">{{ submission.assignment }}</div>
                  <div class="list-sub">{{ submission.studentName || 'Student' }} · {{ submission.submittedOn ? formatDate(submission.submittedOn) : 'No date' }}</div>
                </div>
                <span class="badge badge-neutral">{{ submission.status }}</span>
              </div>
              <div v-if="!selectedCourseAssignmentSubmissions.length" class="placeholder">New assignment submissions will appear here.</div>
            </div>
          </div>
        </div>

        <div class="doctor-side-stack">
          <div class="card small">
            <div class="card-header">
              <div class="card-title">Quick Actions</div>
              <button class="link" @click="store.activePage = 'lessons'">Build content</button>
            </div>
            <div class="doctor-quick-actions">
              <button class="doctor-quick-btn" @click="store.activePage = 'courses'">
                <strong>Assignments</strong>
                <span>Create coursework, due dates, files, and feedback spaces.</span>
              </button>
              <button class="doctor-quick-btn" @click="store.activePage = 'enrollments'">
                <strong>Attendance</strong>
                <span>Launch a session, mark presence, and close attendance quickly.</span>
              </button>
              <button class="doctor-quick-btn" @click="store.activePage = 'quiz-results'">
                <strong>Gradebook</strong>
                <span>Review submissions, averages, and course performance in one place.</span>
              </button>
            </div>
          </div>

          <div class="card small">
            <div class="card-header">
              <div class="card-title">Recent Announcements</div>
              <button class="link" @click="store.activePage = 'announcements'">Manage</button>
            </div>
            <div class="list">
              <div v-for="announcement in selectedCourseAnnouncements.slice(0, 4)" :key="announcement.id" class="list-item list-item-stacked doctor-mini-card">
                <div>
                  <div class="list-title">{{ announcement.title }}</div>
                  <div class="list-sub">{{ announcement.course }} · {{ formatDate(announcement.date) }}</div>
                </div>
                <div class="announcement-copy">{{ announcement.message }}</div>
              </div>
              <div v-if="!selectedCourseAnnouncements.length" class="placeholder">No announcements yet for this course.</div>
            </div>
          </div>

          <div class="card small">
            <div class="card-header">
              <div class="card-title">Attendance Tasks</div>
              <button class="link" @click="store.activePage = 'enrollments'">Open attendance</button>
            </div>
            <div class="list">
              <div v-for="session in selectedCourseAttendanceSessions.slice(0, 4)" :key="session.id" class="list-item doctor-mini-card">
                <div>
                  <div class="list-title">{{ session.name }}</div>
                  <div class="list-sub">{{ formatDate(session.sessionDate) }} · {{ session.lesson || 'General session' }}</div>
                </div>
                <span class="badge badge-neutral">{{ session.status }}</span>
              </div>
              <div v-if="!selectedCourseAttendanceSessions.length" class="placeholder">Create an attendance session to start tracking presence.</div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="store.activePage === 'courses'">
      <div v-if="selectedCourse" class="doctor-stack">
        <div class="card doctor-course-hero">
          <div>
            <div class="spotlight-kicker">Course Control Center</div>
            <div class="spotlight-title doctor-command-title">{{ selectedCourse.name }}</div>
            <div class="spotlight-sub">Publish the right academic experience, keep the course metadata clean, and manage coursework from this single panel.</div>
          </div>
          <div class="doctor-course-hero-metrics">
            <div class="metric-pill">{{ selectedCourse.isPublished ? 'Visible on website' : 'Hidden from website' }}</div>
            <div class="metric-pill">{{ selectedCourse.autoEnroll ? 'Auto enroll active' : 'Manual enrollment mode' }}</div>
            <div class="metric-pill">{{ selectedCourse.totalAssignments }} assignments</div>
            <div class="metric-pill">{{ selectedCourse.totalQuizzes }} quizzes</div>
          </div>
        </div>

        <div class="card doctor-form-card doctor-course-settings-card">
          <div class="card-header">
            <div>
              <div class="card-title">Course Settings</div>
              <div class="list-sub">Shape how the course looks academically and how students experience it on the website.</div>
            </div>
            <span class="badge badge-neutral">{{ selectedCourse.name }}</span>
          </div>
          <div class="doctor-form-grid doctor-form-grid-two">
            <label class="doctor-field">
              <span>Course Name</span>
              <input v-model="courseDraft.name" type="text" class="doctor-input" />
            </label>
            <label class="doctor-field">
              <span>Course Code</span>
              <input v-model="courseDraft.code" type="text" class="doctor-input" placeholder="CS101" />
            </label>
            <label class="doctor-field">
              <span>Department</span>
              <input v-model="courseDraft.department" type="text" class="doctor-input" placeholder="Computer Science" />
            </label>
            <label class="doctor-field">
              <span>Academic Term</span>
              <input v-model="courseDraft.term" type="text" class="doctor-input" placeholder="Fall 2026" />
            </label>
            <label class="doctor-field">
              <span>Course Status</span>
              <select v-model="courseDraft.status" class="doctor-input">
                <option v-for="option in COURSE_STATUS_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </label>
            <label class="doctor-check">
              <input v-model="courseDraft.isPublished" type="checkbox" />
              <span>Published on the website</span>
            </label>
            <label class="doctor-check">
              <input v-model="courseDraft.autoEnroll" type="checkbox" />
              <span>Auto enroll students</span>
            </label>
            <label class="doctor-field doctor-field-full">
              <span>Description</span>
              <textarea v-model="courseDraft.description" class="doctor-textarea" rows="5"></textarea>
            </label>
          </div>
          <div class="doctor-course-guidance">
            <div class="doctor-guidance-card">
              <strong>Cover image</strong>
              <span v-if="selectedCourse.coverUrl">A course cover is already attached and visible on the website.</span>
              <span v-else>Add a course cover from the backend media field if you want a richer hero image.</span>
            </div>
            <div class="doctor-guidance-card">
              <strong>Student-facing status</strong>
              <span>{{ courseDraft.isPublished ? 'Students can see this course on the LMS website.' : 'This course stays hidden from students until you publish it.' }}</span>
            </div>
          </div>
          <div class="doctor-actions">
            <button class="btn-primary" :disabled="busy" @click="saveCourse">{{ busy ? 'Saving...' : 'Save Course' }}</button>
          </div>
        </div>

        <div class="doctor-two-column-grid">
          <div class="card doctor-form-card">
            <div class="card-header">
              <div>
                <div class="card-title">Add Assignment</div>
                <div class="list-sub">Create coursework with due dates, files, late rules, and grading settings.</div>
              </div>
              <span class="badge badge-neutral">{{ selectedCourse.name }}</span>
            </div>
            <div class="doctor-form-grid doctor-form-grid-two">
              <label class="doctor-field">
                <span>Assignment Title</span>
                <input v-model="newAssignment.name" type="text" class="doctor-input" />
              </label>
              <label class="doctor-field">
                <span>Submission Type</span>
                <select v-model="newAssignment.submissionType" class="doctor-input">
                  <option v-for="option in SUBMISSION_TYPE_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
              </label>
              <label class="doctor-field">
                <span>Available From</span>
                <input v-model="newAssignment.availableFrom" type="datetime-local" class="doctor-input" />
              </label>
              <label class="doctor-field">
                <span>Due Date</span>
                <input v-model="newAssignment.dueDate" type="datetime-local" class="doctor-input" />
              </label>
              <label class="doctor-field">
                <span>Max Score</span>
                <input v-model.number="newAssignment.maxScore" type="number" min="0" class="doctor-input" />
              </label>
              <label class="doctor-field">
                <span>Weight</span>
                <input v-model.number="newAssignment.weight" type="number" min="0" step="0.1" class="doctor-input" />
              </label>
              <label class="doctor-check">
                <input v-model="newAssignment.allowLate" type="checkbox" />
                <span>Allow late submission</span>
              </label>
              <label class="doctor-check">
                <input v-model="newAssignment.allowResubmission" type="checkbox" />
                <span>Allow resubmission</span>
              </label>
              <label class="doctor-check">
                <input v-model="newAssignment.isPublished" type="checkbox" />
                <span>Published for students</span>
              </label>
              <label class="doctor-field doctor-field-full">
                <span>Resource File</span>
                <label class="doctor-upload-btn">
                  <input class="visually-hidden" type="file" @change="handleAssignmentResourceSelected(newAssignment, $event)" />
                  {{ newAssignment.resourceFilename || 'Attach assignment file' }}
                </label>
              </label>
              <label class="doctor-field doctor-field-full">
                <span>Short Description</span>
                <textarea v-model="newAssignment.description" class="doctor-textarea" rows="3"></textarea>
              </label>
              <label class="doctor-field doctor-field-full">
                <span>Instructions</span>
                <textarea v-model="newAssignment.instructions" class="doctor-textarea" rows="5"></textarea>
              </label>
            </div>
            <div class="doctor-actions">
              <button class="btn-primary" :disabled="busy || !selectedCourseId || !newAssignment.name.trim()" @click="addAssignment">Create Assignment</button>
            </div>
          </div>

          <div class="card doctor-form-card">
            <div class="card-header">
              <div>
                <div class="card-title">Coursework Snapshot</div>
                <div class="list-sub">A quick read on coursework load and grading progress.</div>
              </div>
              <span class="badge badge-neutral">{{ selectedCourseAssignments.length }} assignments</span>
            </div>
            <div class="doctor-course-guidance">
              <div class="doctor-guidance-card">
                <strong>Total submissions</strong>
                <span>{{ selectedCourseAssignments.reduce((total, item) => total + item.submissionCount, 0) }} student submissions recorded so far.</span>
              </div>
              <div class="doctor-guidance-card">
                <strong>Pending grading</strong>
                <span>{{ selectedCourseAssignments.reduce((total, item) => total + item.pendingCount, 0) }} submissions still need feedback.</span>
              </div>
              <div class="doctor-guidance-card">
                <strong>Average coursework grade</strong>
                <span>{{ formatPercent(selectedCourse.averageAssignmentPercentage) }} across graded assignment work.</span>
              </div>
            </div>
          </div>
        </div>

        <div v-for="assignment in selectedCourseAssignments" :key="assignment.id" class="card doctor-form-card">
          <div class="card-header">
            <div>
              <div class="card-title">{{ assignment.name }}</div>
              <div class="list-sub">{{ assignment.submissionCount }} submissions · {{ assignment.pendingCount }} pending · {{ formatPercent(assignment.averagePercentage) }} average</div>
            </div>
            <span class="badge badge-neutral">{{ assignment.isPublished ? 'Visible' : 'Hidden' }}</span>
          </div>
          <div class="doctor-form-grid doctor-form-grid-two">
            <label class="doctor-field">
              <span>Assignment Title</span>
              <input v-model="assignmentDraft(assignment).name" type="text" class="doctor-input" />
            </label>
            <label class="doctor-field">
              <span>Submission Type</span>
              <select v-model="assignmentDraft(assignment).submissionType" class="doctor-input">
                <option v-for="option in SUBMISSION_TYPE_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </label>
            <label class="doctor-field">
              <span>Available From</span>
              <input v-model="assignmentDraft(assignment).availableFrom" type="datetime-local" class="doctor-input" />
            </label>
            <label class="doctor-field">
              <span>Due Date</span>
              <input v-model="assignmentDraft(assignment).dueDate" type="datetime-local" class="doctor-input" />
            </label>
            <label class="doctor-field">
              <span>Max Score</span>
              <input v-model.number="assignmentDraft(assignment).maxScore" type="number" min="0" class="doctor-input" />
            </label>
            <label class="doctor-field">
              <span>Weight</span>
              <input v-model.number="assignmentDraft(assignment).weight" type="number" min="0" step="0.1" class="doctor-input" />
            </label>
            <label class="doctor-check">
              <input v-model="assignmentDraft(assignment).allowLate" type="checkbox" />
              <span>Allow late submission</span>
            </label>
            <label class="doctor-check">
              <input v-model="assignmentDraft(assignment).allowResubmission" type="checkbox" />
              <span>Allow resubmission</span>
            </label>
            <label class="doctor-check">
              <input v-model="assignmentDraft(assignment).isPublished" type="checkbox" />
              <span>Published for students</span>
            </label>
            <label class="doctor-field doctor-field-full">
              <span>Replace resource file</span>
              <label class="doctor-upload-btn">
                <input class="visually-hidden" type="file" @change="handleAssignmentResourceSelected(assignmentDraft(assignment), $event)" />
                {{ assignmentDraft(assignment).resourceFilename || assignment.resourceFileName || 'Attach assignment file' }}
              </label>
            </label>
            <label class="doctor-field doctor-field-full">
              <span>Description</span>
              <textarea v-model="assignmentDraft(assignment).description" class="doctor-textarea" rows="3"></textarea>
            </label>
            <label class="doctor-field doctor-field-full">
              <span>Instructions</span>
              <textarea v-model="assignmentDraft(assignment).instructions" class="doctor-textarea" rows="4"></textarea>
            </label>
          </div>
          <div class="doctor-actions doctor-actions-split">
            <button class="btn-primary" :disabled="busy" @click="saveAssignmentItem(assignment)">Save Assignment</button>
            <button class="doctor-danger" :disabled="busy" @click="removeAssignment(assignment)">Delete</button>
          </div>
        </div>
        <div v-if="!selectedCourseAssignments.length" class="card placeholder-card">No assignments in this course yet.</div>
      </div>
    </template>

    <template v-else-if="store.activePage === 'lessons'">
      <div class="doctor-stack">
        <div class="card doctor-form-card">
          <div class="card-header">
            <div class="card-title">Add Lesson</div>
            <span class="badge">{{ selectedCourse?.name || 'Choose a course' }}</span>
          </div>
          <div class="doctor-form-grid doctor-form-grid-two">
            <label class="doctor-field">
              <span>Lesson Title</span>
              <input v-model="newLesson.name" type="text" class="doctor-input" />
            </label>
            <label class="doctor-field">
              <span>Sequence</span>
              <input v-model.number="newLesson.sequence" type="number" min="1" class="doctor-input" />
            </label>
            <label class="doctor-field">
              <span>Module</span>
              <input v-model="newLesson.moduleTitle" type="text" class="doctor-input" placeholder="Module 1" />
            </label>
            <label class="doctor-field">
              <span>Week</span>
              <input v-model="newLesson.weekLabel" type="text" class="doctor-input" placeholder="Week 3" />
            </label>
            <label class="doctor-field">
              <span>Topic</span>
              <input v-model="newLesson.topicTitle" type="text" class="doctor-input" placeholder="Topic title" />
            </label>
            <label class="doctor-field">
              <span>Unit</span>
              <input v-model="newLesson.unitTitle" type="text" class="doctor-input" placeholder="Unit or section" />
            </label>
            <label class="doctor-field doctor-field-full">
              <span>Video URL</span>
              <input v-model="newLesson.videoUrl" type="url" class="doctor-input" placeholder="https://..." />
            </label>
            <label class="doctor-field doctor-field-full">
              <span>External Resource</span>
              <input v-model="newLesson.externalResourceUrl" type="url" class="doctor-input" placeholder="https://resource-link" />
            </label>
            <label class="doctor-field doctor-field-full">
              <span>Content</span>
              <textarea v-model="newLesson.content" class="doctor-textarea" rows="5"></textarea>
            </label>
          </div>
          <div class="doctor-actions">
            <button class="btn-primary" :disabled="busy || !selectedCourseId || !newLesson.name.trim()" @click="addLesson">Add Lesson</button>
          </div>
        </div>

        <div v-for="lesson in selectedCourseLessons" :key="lesson.id" class="card doctor-form-card">
          <div class="card-header">
            <div>
              <div class="card-title">{{ lesson.name }}</div>
              <div class="list-sub">Lesson {{ lesson.sequence }} · {{ formatPercent(lesson.completionRate) }} completion</div>
            </div>
            <span class="badge badge-neutral">{{ lesson.course }}</span>
          </div>
          <div class="doctor-form-grid doctor-form-grid-two">
            <label class="doctor-field">
              <span>Lesson Title</span>
              <input v-model="lessonDraft(lesson).name" type="text" class="doctor-input" />
            </label>
            <label class="doctor-field">
              <span>Sequence</span>
              <input v-model.number="lessonDraft(lesson).sequence" type="number" min="1" class="doctor-input" />
            </label>
            <label class="doctor-field">
              <span>Module</span>
              <input v-model="lessonDraft(lesson).moduleTitle" type="text" class="doctor-input" />
            </label>
            <label class="doctor-field">
              <span>Week</span>
              <input v-model="lessonDraft(lesson).weekLabel" type="text" class="doctor-input" />
            </label>
            <label class="doctor-field">
              <span>Topic</span>
              <input v-model="lessonDraft(lesson).topicTitle" type="text" class="doctor-input" />
            </label>
            <label class="doctor-field">
              <span>Unit</span>
              <input v-model="lessonDraft(lesson).unitTitle" type="text" class="doctor-input" />
            </label>
            <label class="doctor-field doctor-field-full">
              <span>Video URL</span>
              <input v-model="lessonDraft(lesson).videoUrl" type="url" class="doctor-input" placeholder="https://..." />
            </label>
            <label class="doctor-field doctor-field-full">
              <span>External Resource</span>
              <input v-model="lessonDraft(lesson).externalResourceUrl" type="url" class="doctor-input" placeholder="https://resource-link" />
            </label>
            <label class="doctor-field doctor-field-full">
              <span>Content</span>
              <textarea v-model="lessonDraft(lesson).content" class="doctor-textarea" rows="5"></textarea>
            </label>
          </div>
          <div class="doctor-actions doctor-actions-split">
            <button class="btn-primary" :disabled="busy" @click="saveLesson(lesson)">Save Lesson</button>
            <button class="doctor-danger" :disabled="busy" @click="removeLesson(lesson)">Delete</button>
          </div>
        </div>
        <div v-if="!selectedCourseLessons.length" class="card placeholder-card">No lessons in this course yet.</div>
      </div>
    </template>

    <template v-else-if="store.activePage === 'announcements'">
      <div class="doctor-stack">
        <div class="card doctor-form-card">
          <div class="card-header">
            <div class="card-title">Add Announcement</div>
            <span class="badge">{{ selectedCourse?.name || 'Choose a course' }}</span>
          </div>
          <div class="doctor-form-grid">
            <label class="doctor-field">
              <span>Title</span>
              <input v-model="newAnnouncement.title" type="text" class="doctor-input" />
            </label>
            <label class="doctor-field">
              <span>Date</span>
              <input v-model="newAnnouncement.date" type="date" class="doctor-input" />
            </label>
            <label class="doctor-field doctor-field-full">
              <span>Message</span>
              <textarea v-model="newAnnouncement.message" class="doctor-textarea" rows="4"></textarea>
            </label>
          </div>
          <div class="doctor-actions">
            <button class="btn-primary" :disabled="busy || !selectedCourseId || !newAnnouncement.title.trim() || !newAnnouncement.message.trim()" @click="addAnnouncement">Add Announcement</button>
          </div>
        </div>

        <div v-for="announcement in selectedCourseAnnouncements" :key="announcement.id" class="card doctor-form-card">
          <div class="card-header">
            <div>
              <div class="card-title">{{ announcement.title }}</div>
              <div class="list-sub">{{ formatDate(announcement.date) }}</div>
            </div>
          </div>
          <div class="doctor-form-grid">
            <label class="doctor-field">
              <span>Title</span>
              <input v-model="announcementDraft(announcement).title" type="text" class="doctor-input" />
            </label>
            <label class="doctor-field">
              <span>Date</span>
              <input v-model="announcementDraft(announcement).date" type="date" class="doctor-input" />
            </label>
            <label class="doctor-field doctor-field-full">
              <span>Message</span>
              <textarea v-model="announcementDraft(announcement).message" class="doctor-textarea" rows="4"></textarea>
            </label>
          </div>
          <div class="doctor-actions doctor-actions-split">
            <button class="btn-primary" :disabled="busy" @click="saveAnnouncement(announcement)">Save Announcement</button>
            <button class="doctor-danger" :disabled="busy" @click="removeAnnouncement(announcement)">Delete</button>
          </div>
        </div>
        <div v-if="!selectedCourseAnnouncements.length" class="card placeholder-card">No announcements yet for this course.</div>
      </div>
    </template>

    <template v-else-if="store.activePage === 'enrollments'">
      <div class="doctor-stack">
        <div class="doctor-roster-grid doctor-roster-grid-strong">
          <div class="card doctor-form-card">
            <div class="card-header">
              <div>
                <div class="card-title">Enroll Students</div>
                <div class="list-sub">Add LMS students to {{ selectedCourse?.name || 'this course' }} from the website.</div>
              </div>
              <span class="badge">{{ filteredEnrollmentCandidates.length }} available</span>
            </div>
            <div class="doctor-form-grid doctor-form-grid-two">
              <label class="doctor-field doctor-field-full">
                <span>Search Student</span>
                <input v-model="studentPickerQuery" type="text" class="doctor-input" placeholder="Type a name or email" />
              </label>
              <label class="doctor-field doctor-field-full">
                <span>Choose Student</span>
                <select v-model.number="selectedStudentId" class="doctor-input">
                  <option :value="null">Select a student</option>
                  <option v-for="student in filteredEnrollmentCandidates" :key="student.id" :value="student.id">
                    {{ student.name }}<template v-if="student.email"> · {{ student.email }}</template>
                  </option>
                </select>
              </label>
              <div v-if="selectedStudentOption" class="doctor-student-preview doctor-field-full">
                <div class="list-title">{{ selectedStudentOption.name }}</div>
                <div class="list-sub">{{ selectedStudentOption.email || selectedStudentOption.login || 'LMS Student' }}</div>
              </div>
            </div>
            <div class="doctor-actions">
              <button class="btn-primary" :disabled="busy || !selectedCourseId || !selectedStudentId" @click="addEnrollment">Add Student To Course</button>
            </div>
          </div>

          <div class="card doctor-form-card doctor-roster-insights">
            <div class="card-header">
              <div class="card-title">Roster Insights</div>
              <span class="badge badge-neutral">{{ selectedCourseEnrollments.length }} enrolled</span>
            </div>
            <div class="doctor-roster-metrics">
              <div class="summary-pill">
                <div class="stat-label">Average progress</div>
                <div class="stat-value">{{ formatPercent(selectedCourse?.averageProgress) }}</div>
                <div class="stat-sub">Across visible enrollments</div>
              </div>
              <div class="summary-pill">
                <div class="stat-label">Attendance rate</div>
                <div class="stat-value">{{ formatPercent(selectedCourseAttendanceRate) }}</div>
                <div class="stat-sub">Current recorded attendance</div>
              </div>
            </div>
            <div class="doctor-guidance-card">
              <strong>Next management move</strong>
              <span>{{ selectedCourseUpcomingAssessment?.title ? `${selectedCourseUpcomingAssessment.title} · ${selectedCourseUpcomingAssessment.date ? formatDate(selectedCourseUpcomingAssessment.date) : 'No date'}` : 'Set your next attendance session or publish a new assignment.' }}</span>
            </div>
          </div>
        </div>

        <div class="card doctor-form-card">
          <div class="card-header">
            <div class="card-title">Course Enrollments</div>
            <span class="badge">{{ filteredSelectedCourseEnrollments.length }} shown</span>
          </div>
          <div class="doctor-search-row">
            <label class="doctor-field doctor-field-full">
              <span>Search roster</span>
              <input v-model="enrollmentSearch" type="text" class="doctor-input" placeholder="Search by student name" />
            </label>
          </div>
          <div class="list">
            <div v-for="enrollment in filteredSelectedCourseEnrollments" :key="enrollment.id" class="doctor-enrollment-row doctor-enrollment-row-rich">
              <div>
                <div class="list-title">{{ enrollment.studentName || 'Student' }}</div>
                <div class="list-sub">{{ enrollment.course }} · {{ enrollment.completedLessons }}/{{ enrollment.totalLessons }} lessons · {{ formatPercent(enrollment.progress) }}</div>
              </div>
              <div class="doctor-actions-row">
                <span class="badge badge-neutral">{{ enrollment.status || 'Enrolled' }}</span>
                <button class="doctor-danger" :disabled="busy" @click="removeEnrollment(enrollment)">Remove</button>
              </div>
            </div>
            <div v-if="!filteredSelectedCourseEnrollments.length" class="placeholder">No matching enrollments are visible for this course yet.</div>
          </div>
        </div>

        <div class="doctor-two-column-grid">
          <div class="card doctor-form-card">
            <div class="card-header">
              <div>
                <div class="card-title">Create Attendance Session</div>
                <div class="list-sub">Launch a session for a lecture, lesson, or meeting and the roster will be prepared automatically.</div>
              </div>
              <span class="badge badge-neutral">{{ selectedCourseAttendanceSessions.length }} sessions</span>
            </div>
            <div class="doctor-form-grid doctor-form-grid-two">
              <label class="doctor-field">
                <span>Session Name</span>
                <input v-model="newAttendanceSession.name" type="text" class="doctor-input" placeholder="Week 5 Lecture" />
              </label>
              <label class="doctor-field">
                <span>Linked Lesson</span>
                <select v-model.number="newAttendanceSession.lessonId" class="doctor-input">
                  <option :value="null">General session</option>
                  <option v-for="lesson in selectedCourseLessons" :key="lesson.id" :value="lesson.id">{{ lesson.name }}</option>
                </select>
              </label>
              <label class="doctor-field doctor-field-full">
                <span>Session Date</span>
                <input v-model="newAttendanceSession.sessionDate" type="datetime-local" class="doctor-input" />
              </label>
              <label class="doctor-field doctor-field-full">
                <span>Notes</span>
                <textarea v-model="newAttendanceSession.notes" class="doctor-textarea" rows="3"></textarea>
              </label>
            </div>
            <div class="doctor-actions">
              <button class="btn-primary" :disabled="busy || !selectedCourseId" @click="addAttendanceSession">Create Session</button>
            </div>
          </div>

          <div class="card doctor-form-card">
            <div class="card-header">
              <div>
                <div class="card-title">Manage Attendance</div>
                <div class="list-sub">Choose a session, mark each student, and publish the record back to the LMS website.</div>
              </div>
            </div>
            <label class="doctor-field doctor-field-full">
              <span>Attendance Session</span>
              <select v-model.number="selectedAttendanceSessionId" class="doctor-input">
                <option v-for="session in selectedCourseAttendanceSessions" :key="session.id" :value="session.id">{{ session.name }} · {{ formatDate(session.sessionDate) }}</option>
              </select>
            </label>
            <div v-if="selectedAttendanceSession" class="doctor-attendance-meta">
              <span class="meta-chip">{{ selectedAttendanceSession.lesson || 'General session' }}</span>
              <span class="meta-chip">{{ selectedAttendanceSession.presentCount }} present</span>
              <span class="meta-chip">{{ selectedAttendanceSession.lateCount }} late</span>
              <span class="meta-chip">{{ selectedAttendanceSession.absentCount }} absent</span>
              <span class="meta-chip">{{ selectedAttendanceSession.status === 'closed' ? 'closed' : 'draft' }}</span>
            </div>
            <div v-if="selectedAttendanceSession && attendanceSessionIsClosed" class="doctor-guidance-card">
              <strong>Session closed</strong>
              <span>This attendance session is locked. Reopen it if you need to correct a status or note.</span>
            </div>
            <div class="list doctor-attendance-list">
              <div v-for="record in selectedAttendanceSessionRecords" :key="record.id || record.studentId" class="doctor-attendance-row">
                <div>
                  <div class="list-title">{{ record.studentName || 'Student' }}</div>
                  <div class="list-sub">{{ record.note || 'Add a note if needed' }}</div>
                </div>
                <div class="doctor-attendance-controls">
                  <select v-model="attendanceDraft(record).status" class="doctor-input doctor-input-compact" :disabled="attendanceSessionIsClosed">
                    <option v-for="option in ATTENDANCE_STATUS_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
                  </select>
                  <input v-model="attendanceDraft(record).note" type="text" class="doctor-input doctor-input-compact" placeholder="Optional note" :disabled="attendanceSessionIsClosed" />
                </div>
              </div>
              <div v-if="!selectedAttendanceSessionRecords.length" class="placeholder">Create a session first to mark attendance.</div>
            </div>
            <div class="doctor-actions doctor-actions-split">
              <div class="doctor-actions-row">
                <button
                  v-if="!attendanceSessionIsClosed"
                  class="btn-secondary"
                  :disabled="busy || !selectedAttendanceSession"
                  @click="saveSelectedAttendance(false)"
                >
                  Save Attendance
                </button>
                <button
                  v-if="!attendanceSessionIsClosed"
                  class="btn-primary"
                  :disabled="busy || !selectedAttendanceSession"
                  @click="saveSelectedAttendance(true)"
                >
                  Save & Close
                </button>
                <button
                  v-else
                  class="btn-secondary"
                  :disabled="busy || !selectedAttendanceSession"
                  @click="reopenSelectedAttendance"
                >
                  Reopen Session
                </button>
              </div>
              <button class="doctor-danger" :disabled="busy || !selectedAttendanceSession" @click="removeAttendanceSession">Delete Session</button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="store.activePage === 'quizzes'">
      <div class="doctor-stack">
        <div class="card doctor-form-card">
          <div class="card-header">
            <div class="card-title">Add Quiz</div>
            <span class="badge">{{ selectedCourse?.name || 'Choose a course' }}</span>
          </div>
          <div class="doctor-form-grid doctor-form-grid-two">
            <label class="doctor-field">
              <span>Quiz Name</span>
              <input v-model="newQuiz.name" type="text" class="doctor-input" />
            </label>
            <label class="doctor-field">
              <span>Attempt Limit</span>
              <input v-model.number="newQuiz.attemptLimit" type="number" min="0" class="doctor-input" />
            </label>
            <label class="doctor-field">
              <span>Available From</span>
              <input v-model="newQuiz.availableFrom" type="datetime-local" class="doctor-input" />
            </label>
            <label class="doctor-field">
              <span>Deadline</span>
              <input v-model="newQuiz.deadline" type="datetime-local" class="doctor-input" />
            </label>
            <label class="doctor-field">
              <span>Time Limit (minutes)</span>
              <input v-model.number="newQuiz.timeLimitMinutes" type="number" min="0" class="doctor-input" />
            </label>
            <label class="doctor-field">
              <span>Pass Percentage</span>
              <input v-model.number="newQuiz.passPercentage" type="number" min="0" max="100" class="doctor-input" />
            </label>
            <label class="doctor-field">
              <span>Grade Weight</span>
              <input v-model.number="newQuiz.weight" type="number" min="0" step="0.1" class="doctor-input" />
            </label>
            <label class="doctor-check">
              <input v-model="newQuiz.showResults" type="checkbox" />
              <span>Show results to students</span>
            </label>
          </div>
          <div class="doctor-actions">
            <button class="btn-primary" :disabled="busy || !selectedCourseId || !newQuiz.name.trim()" @click="addQuiz">Add Quiz</button>
          </div>
        </div>

        <div v-for="quiz in selectedCourseQuizzes" :key="quiz.id" class="card doctor-form-card">
          <div class="card-header">
            <div>
              <div class="card-title">{{ quiz.name }}</div>
              <div class="list-sub">{{ quiz.questionCount }} questions · {{ quiz.attemptCount }} attempts recorded</div>
            </div>
            <span class="badge badge-neutral">{{ quiz.statusLabel }}</span>
          </div>
          <div class="doctor-form-grid doctor-form-grid-two">
            <label class="doctor-field">
              <span>Quiz Name</span>
              <input v-model="quizDraft(quiz).name" type="text" class="doctor-input" />
            </label>
            <label class="doctor-field">
              <span>Attempt Limit</span>
              <input v-model.number="quizDraft(quiz).attemptLimit" type="number" min="0" class="doctor-input" />
            </label>
            <label class="doctor-field">
              <span>Available From</span>
              <input v-model="quizDraft(quiz).availableFrom" type="datetime-local" class="doctor-input" />
            </label>
            <label class="doctor-field">
              <span>Deadline</span>
              <input v-model="quizDraft(quiz).deadline" type="datetime-local" class="doctor-input" />
            </label>
            <label class="doctor-field">
              <span>Time Limit (minutes)</span>
              <input v-model.number="quizDraft(quiz).timeLimitMinutes" type="number" min="0" class="doctor-input" />
            </label>
            <label class="doctor-field">
              <span>Pass Percentage</span>
              <input v-model.number="quizDraft(quiz).passPercentage" type="number" min="0" max="100" class="doctor-input" />
            </label>
            <label class="doctor-field">
              <span>Grade Weight</span>
              <input v-model.number="quizDraft(quiz).weight" type="number" min="0" step="0.1" class="doctor-input" />
            </label>
            <label class="doctor-check">
              <input v-model="quizDraft(quiz).showResults" type="checkbox" />
              <span>Show results to students</span>
            </label>
          </div>
          <div class="doctor-actions doctor-actions-split">
            <button class="btn-primary" :disabled="busy" @click="saveQuiz(quiz)">Save Quiz</button>
            <button class="doctor-danger" :disabled="busy" @click="removeQuiz(quiz)">Delete</button>
          </div>
        </div>
        <div v-if="!selectedCourseQuizzes.length" class="card placeholder-card">No quizzes in this course yet.</div>
      </div>
    </template>

    <template v-else-if="store.activePage === 'questions'">
      <div class="doctor-stack">
        <div class="card doctor-form-card doctor-switcher-secondary">
          <div>
            <div class="card-title">Question Bank</div>
            <div class="list-sub">Pick a quiz, then edit its questions below.</div>
          </div>
          <select v-model.number="selectedQuizId" class="doctor-select">
            <option v-for="quiz in selectedCourseQuizzes" :key="quiz.id" :value="quiz.id">{{ quiz.name }}</option>
          </select>
        </div>

        <div class="card doctor-form-card">
          <div class="card-header">
            <div class="card-title">Add Question</div>
            <span class="badge">{{ selectedQuiz?.name || 'Choose a quiz' }}</span>
          </div>
          <div class="doctor-form-grid">
            <label class="doctor-field doctor-field-full">
              <span>Question</span>
              <textarea v-model="newQuestion.text" class="doctor-textarea" rows="3"></textarea>
            </label>
            <label v-for="option in ['a','b','c','d']" :key="option" class="doctor-field doctor-field-full">
              <span>Option {{ option.toUpperCase() }}</span>
              <input v-model="newQuestion[option]" type="text" class="doctor-input" />
            </label>
            <label class="doctor-field">
              <span>Correct Answer</span>
              <select v-model="newQuestion.correctAnswer" class="doctor-input">
                <option value="a">A</option>
                <option value="b">B</option>
                <option value="c">C</option>
                <option value="d">D</option>
              </select>
            </label>
            <label class="doctor-field">
              <span>Points</span>
              <input v-model.number="newQuestion.points" type="number" min="1" class="doctor-input" />
            </label>
          </div>
          <div class="doctor-actions">
            <button class="btn-primary" :disabled="busy || !selectedQuizId || !newQuestion.text.trim()" @click="addQuestion">Add Question</button>
          </div>
        </div>

        <div v-for="question in selectedQuizQuestions" :key="question.id" class="card doctor-form-card">
          <div class="card-header">
            <div>
              <div class="card-title">{{ question.text }}</div>
              <div class="list-sub">{{ question.quiz }} · {{ question.points }} point{{ question.points === 1 ? '' : 's' }}</div>
            </div>
          </div>
          <div class="doctor-form-grid">
            <label class="doctor-field doctor-field-full">
              <span>Question</span>
              <textarea v-model="questionDraft(question).text" class="doctor-textarea" rows="3"></textarea>
            </label>
            <label v-for="option in ['a','b','c','d']" :key="`${question.id}-${option}`" class="doctor-field doctor-field-full">
              <span>Option {{ option.toUpperCase() }}</span>
              <input v-model="questionDraft(question)[option]" type="text" class="doctor-input" />
            </label>
            <label class="doctor-field">
              <span>Correct Answer</span>
              <select v-model="questionDraft(question).correctAnswer" class="doctor-input">
                <option value="a">A</option>
                <option value="b">B</option>
                <option value="c">C</option>
                <option value="d">D</option>
              </select>
            </label>
            <label class="doctor-field">
              <span>Points</span>
              <input v-model.number="questionDraft(question).points" type="number" min="1" class="doctor-input" />
            </label>
          </div>
          <div class="doctor-actions doctor-actions-split">
            <button class="btn-primary" :disabled="busy" @click="saveQuestion(question)">Save Question</button>
            <button class="doctor-danger" :disabled="busy" @click="removeQuestion(question)">Delete</button>
          </div>
        </div>
        <div v-if="!selectedQuizQuestions.length" class="card placeholder-card">No questions in this quiz yet.</div>
      </div>
    </template>

    <template v-else-if="store.activePage === 'quiz-results'">
      <div class="doctor-stack">
        <div class="doctor-summary-grid doctor-summary-grid-gradebook">
          <div class="summary-pill">
            <div class="stat-label">Roster Average</div>
            <div class="stat-value">{{ formatPercent(selectedCourseGradebookAverage) }}</div>
            <div class="stat-sub">Combined quiz and assignment average</div>
          </div>
          <div class="summary-pill">
            <div class="stat-label">Assignment Pending</div>
            <div class="stat-value">{{ pendingAssignmentSubmissions.length }}</div>
            <div class="stat-sub">Need manual grading</div>
          </div>
          <div class="summary-pill">
            <div class="stat-label">Quiz Attempts</div>
            <div class="stat-value">{{ selectedCourseResults.length }}</div>
            <div class="stat-sub">Recorded quiz submissions</div>
          </div>
          <div class="summary-pill">
            <div class="stat-label">Attendance</div>
            <div class="stat-value">{{ formatPercent(selectedCourseAttendanceRate) }}</div>
            <div class="stat-sub">Current course attendance</div>
          </div>
        </div>

        <div class="doctor-two-column-grid doctor-two-column-grid-gradebook">
          <div class="card doctor-form-card">
            <div class="card-header">
              <div class="card-title">Course Gradebook</div>
              <span class="badge badge-neutral">{{ selectedCourseGradebook.length }} students</span>
            </div>
            <div class="list">
              <div v-for="row in selectedCourseGradebook" :key="row.id" class="doctor-enrollment-row doctor-enrollment-row-rich">
                <div>
                  <div class="list-title">{{ row.studentName }}</div>
                  <div class="list-sub">{{ row.course }} · {{ row.pendingSubmissions }} pending submissions</div>
                </div>
                <div class="doctor-gradebook-metrics">
                  <span class="badge badge-neutral">Quiz {{ row.quizAverage !== null ? formatPercent(row.quizAverage) : '—' }}</span>
                  <span class="badge badge-neutral">Assignment {{ row.assignmentAverage !== null ? formatPercent(row.assignmentAverage) : '—' }}</span>
                  <span class="badge badge-neutral">Attendance {{ row.attendanceRate !== null ? formatPercent(row.attendanceRate) : '—' }}</span>
                  <span class="badge">Overall {{ row.overallAverage !== null ? formatPercent(row.overallAverage) : '—' }}</span>
                </div>
              </div>
              <div v-if="!selectedCourseGradebook.length" class="placeholder">Student gradebook rows appear once you have enrollments in the course.</div>
            </div>
          </div>

          <div class="card doctor-form-card">
            <div class="card-header">
              <div class="card-title">Assignment Submissions</div>
              <span class="badge badge-neutral">{{ selectedCourseAssignmentSubmissions.length }} submissions</span>
            </div>
            <div class="list doctor-submission-list">
              <div v-for="submission in selectedCourseAssignmentSubmissions" :key="submission.id" class="doctor-submission-card">
                <div class="doctor-submission-head">
                  <div>
                    <div class="list-title">{{ submission.assignment }}</div>
                    <div class="list-sub">{{ submission.studentName || 'Student' }} · {{ submission.submittedOn ? formatDate(submission.submittedOn) : 'Not submitted yet' }}</div>
                  </div>
                  <span class="badge badge-neutral">{{ submission.status }}</span>
                </div>
                <div class="doctor-form-grid doctor-form-grid-two">
                  <label class="doctor-field">
                    <span>Score</span>
                    <input v-model.number="gradingDraft(submission).score" type="number" min="0" class="doctor-input" />
                  </label>
                  <label class="doctor-field">
                    <span>Status</span>
                    <select v-model="gradingDraft(submission).status" class="doctor-input">
                      <option value="graded">Graded</option>
                      <option value="missing">Missing</option>
                      <option value="late">Late</option>
                      <option value="submitted">Submitted</option>
                    </select>
                  </label>
                  <label class="doctor-field doctor-field-full">
                    <span>Feedback</span>
                    <textarea v-model="gradingDraft(submission).feedback" class="doctor-textarea" rows="4"></textarea>
                  </label>
                </div>
                <div class="doctor-actions doctor-actions-split">
                  <a v-if="submission.submittedFileUrl" :href="submission.submittedFileUrl" class="btn-secondary">Download Submission</a>
                  <button class="btn-primary" :disabled="busy" @click="gradeSubmission(submission)">Save Grade</button>
                </div>
              </div>
              <div v-if="!selectedCourseAssignmentSubmissions.length" class="placeholder">Assignment submissions will appear here after students upload their work.</div>
            </div>
          </div>
        </div>

        <div class="card doctor-form-card">
          <div class="card-header">
            <div class="card-title">Quiz Results</div>
            <span class="badge badge-neutral">{{ selectedCourseResults.length }} submissions</span>
          </div>
          <div class="list">
            <div v-for="result in selectedCourseResults" :key="result.id" class="doctor-enrollment-row doctor-enrollment-row-rich">
              <div>
                <div class="list-title">{{ result.quiz }}</div>
                <div class="list-sub">{{ result.studentName || 'Student' }} · {{ formatDate(result.date) }}</div>
              </div>
              <div class="doctor-actions-row">
                <span class="result-pill" :class="result.passed ? 'correct' : 'incorrect'">{{ formatPercent(result.score) }}</span>
                <span class="badge badge-neutral">{{ result.state || (result.passed ? 'Passed' : 'Submitted') }}</span>
              </div>
            </div>
            <div v-if="!selectedCourseResults.length" class="placeholder">No quiz results for this course yet.</div>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="card placeholder-card">This page is available in the faculty workspace soon.</div>
    </template>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { useLmsStore } from "../stores/lms";

const COURSE_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];
const SUBMISSION_TYPE_OPTIONS = [
  { value: "file", label: "File Upload" },
  { value: "text", label: "Written Response" },
  { value: "file_or_text", label: "File or Text" },
];
const ATTENDANCE_STATUS_OPTIONS = [
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "absent", label: "Absent" },
];

const store = useLmsStore();
const busy = ref(false);
const feedback = ref({ type: "", message: "" });
const selectedCourseId = ref(null);
const selectedQuizId = ref(null);
const selectedStudentId = ref(null);
const selectedAttendanceSessionId = ref(null);
const studentPickerQuery = ref("");
const enrollmentSearch = ref("");

const courseDraftState = reactive({
  name: "",
  description: "",
  code: "",
  department: "",
  term: "",
  status: "draft",
  isPublished: false,
  autoEnroll: true,
});
const courseDraft = courseDraftState;
const lessonDrafts = reactive({});
const announcementDrafts = reactive({});
const quizDrafts = reactive({});
const questionDrafts = reactive({});
const assignmentDrafts = reactive({});
const attendanceDrafts = reactive({});
const gradingDrafts = reactive({});

const newLesson = reactive({
  name: "",
  sequence: 1,
  moduleTitle: "",
  weekLabel: "",
  topicTitle: "",
  unitTitle: "",
  videoUrl: "",
  externalResourceUrl: "",
  content: "",
});
const newAnnouncement = reactive({ title: "", date: "", message: "" });
const newQuiz = reactive({
  name: "",
  attemptLimit: 0,
  availableFrom: "",
  deadline: "",
  timeLimitMinutes: 0,
  passPercentage: 50,
  weight: 1,
  showResults: true,
});
const newQuestion = reactive({ text: "", a: "", b: "", c: "", d: "", correctAnswer: "a", points: 1 });
const newAssignment = reactive({
  name: "",
  description: "",
  instructions: "",
  availableFrom: "",
  dueDate: "",
  allowLate: false,
  allowResubmission: false,
  submissionType: "file_or_text",
  maxScore: 100,
  weight: 1,
  isPublished: true,
  resourceFile: "",
  resourceFilename: "",
});
const newAttendanceSession = reactive({
  name: "",
  lessonId: null,
  sessionDate: "",
  notes: "",
});

const isAdminWorkspace = computed(() => store.viewerMode === "admin");
const workspaceDisplayName = computed(() => {
  const name = store.student.fullName || (isAdminWorkspace.value ? "Admin" : "Doctor");
  if (isAdminWorkspace.value) {
    return name;
  }
  return /^dr\./i.test(name) ? name : `Dr. ${name}`;
});
const workspaceSubtitle = computed(() => (
  isAdminWorkspace.value
    ? "You are managing the full university LMS from the website with system-wide course, roster, grading, attendance, and communication tools."
    : "You are managing your assigned university courses from the website with teaching, grading, attendance, and communication tools."
));
const workspacePillLabel = computed(() => (isAdminWorkspace.value ? "Admin Workspace" : "Faculty Workspace"));
const workspaceCommandCenterLabel = computed(() => (isAdminWorkspace.value ? "LMS Admin Command Center" : "Faculty Command Center"));
const workspaceCourseSummaryLabel = computed(() => (isAdminWorkspace.value ? "Across the university" : "Assigned to you"));

const selectedCourse = computed(() => store.courses.find((course) => course.id === selectedCourseId.value) || store.courses[0] || null);
const selectedCourseLessons = computed(() => store.lessons.filter((lesson) => lesson.courseId === selectedCourseId.value));
const selectedCourseAnnouncements = computed(() => store.announcements.filter((announcement) => announcement.courseId === selectedCourseId.value));
const selectedCourseAssignments = computed(() => store.assignments.filter((assignment) => assignment.courseId === selectedCourseId.value));
const selectedCourseQuizzes = computed(() => store.quizzes.filter((quiz) => quiz.courseId === selectedCourseId.value));
const selectedCourseEnrollments = computed(() => store.enrollments.filter((enrollment) => enrollment.courseId === selectedCourseId.value));
const selectedCourseResults = computed(() => store.quizResults.filter((result) => result.courseId === selectedCourseId.value));
const selectedCourseAssignmentSubmissions = computed(() =>
  store.assignmentSubmissions.filter((submission) => submission.courseId === selectedCourseId.value),
);
const selectedCourseAttendanceSessions = computed(() =>
  store.attendanceSessions.filter((session) => session.courseId === selectedCourseId.value),
);
const selectedCourseAttendanceRecords = computed(() =>
  store.attendanceRecords.filter((record) => record.courseId === selectedCourseId.value),
);
const selectedCourseAttendanceRate = computed(() => {
  const records = selectedCourseAttendanceRecords.value;
  if (!records.length) return selectedCourse.value?.attendanceRate || 0;
  const presentCount = records.filter((record) => ["present", "late"].includes(record.status)).length;
  return records.length ? (presentCount / records.length) * 100 : 0;
});
const enrollmentCandidates = computed(() => {
  const enrolledIds = new Set(selectedCourseEnrollments.value.map((enrollment) => enrollment.studentId));
  return store.availableStudents.filter((student) => !enrolledIds.has(student.id));
});
const filteredEnrollmentCandidates = computed(() => {
  const query = studentPickerQuery.value.trim().toLowerCase();
  if (!query) return enrollmentCandidates.value;
  return enrollmentCandidates.value.filter((student) =>
    [student.name, student.email, student.login].filter(Boolean).some((value) => String(value).toLowerCase().includes(query)),
  );
});
const selectedStudentOption = computed(() => enrollmentCandidates.value.find((student) => student.id === selectedStudentId.value) || null);
const filteredSelectedCourseEnrollments = computed(() => {
  const query = enrollmentSearch.value.trim().toLowerCase();
  if (!query) return selectedCourseEnrollments.value;
  return selectedCourseEnrollments.value.filter((enrollment) =>
    [enrollment.studentName, enrollment.course].filter(Boolean).some((value) => String(value).toLowerCase().includes(query)),
  );
});
const selectedQuiz = computed(() => selectedCourseQuizzes.value.find((quiz) => quiz.id === selectedQuizId.value) || selectedCourseQuizzes.value[0] || null);
const selectedQuizQuestions = computed(() => store.questions.filter((question) => question.quizId === selectedQuizId.value));
const selectedAttendanceSession = computed(
  () => selectedCourseAttendanceSessions.value.find((session) => session.id === selectedAttendanceSessionId.value) || selectedCourseAttendanceSessions.value[0] || null,
);
const attendanceSessionIsClosed = computed(() => selectedAttendanceSession.value?.status === "closed");
const selectedAttendanceSessionRecords = computed(() => {
  if (!selectedAttendanceSession.value) return [];
  return selectedCourseAttendanceRecords.value
    .filter((record) => record.sessionId === selectedAttendanceSession.value.id)
    .sort((left, right) => (left.studentName || "").localeCompare(right.studentName || ""));
});
const pendingAssignmentSubmissions = computed(() =>
  selectedCourseAssignmentSubmissions.value.filter((submission) => ["submitted", "late"].includes(submission.status)),
);
const selectedCourseGradebook = computed(() => store.gradebookRows.filter((row) => row.courseId === selectedCourseId.value));
const selectedCourseGradebookAverage = computed(() => {
  const values = selectedCourseGradebook.value.map((row) => row.overallAverage).filter((value) => value !== null && value !== undefined);
  if (!values.length) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
});
const selectedCourseUpcomingAssessment = computed(() => {
  const candidates = [
    ...selectedCourseAssignments.value.map((assignment) => ({
      type: "assignment",
      title: assignment.name,
      date: assignment.dueDate || assignment.availableFrom,
      note: assignment.dueDate ? `Assignment due ${formatDate(assignment.dueDate)}` : "Assignment available soon",
    })),
    ...selectedCourseQuizzes.value.map((quiz) => ({
      type: "quiz",
      title: quiz.name,
      date: quiz.deadline || quiz.availableFrom,
      note: quiz.deadline ? `Quiz deadline ${formatDate(quiz.deadline)}` : "Quiz availability is open",
    })),
  ].filter((item) => item.date);
  return candidates.sort((left, right) => new Date(left.date) - new Date(right.date))[0] || null;
});

const formatDate = (value) => {
  if (!value) return "No date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString([], { dateStyle: "medium", timeStyle: String(value).includes(":") ? "short" : undefined });
};
const formatPercent = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${Math.round(numeric * 10) / 10}%` : "0%";
};
const setFeedback = (type, message) => {
  feedback.value = { type, message };
};

const syncCourseDraft = () => {
  if (!selectedCourse.value) {
    Object.assign(courseDraftState, {
      name: "",
      description: "",
      code: "",
      department: "",
      term: "",
      status: "draft",
      isPublished: false,
      autoEnroll: true,
    });
    return;
  }

  Object.assign(courseDraftState, {
    name: selectedCourse.value.name || "",
    description: selectedCourse.value.description || "",
    code: selectedCourse.value.code || "",
    department: selectedCourse.value.department || "",
    term: selectedCourse.value.term || "",
    status: selectedCourse.value.status || "draft",
    isPublished: Boolean(selectedCourse.value.isPublished),
    autoEnroll: Boolean(selectedCourse.value.autoEnroll),
  });
};

const resetNewForms = () => {
  Object.assign(newLesson, {
    name: "",
    sequence: selectedCourseLessons.value.length + 1 || 1,
    moduleTitle: "",
    weekLabel: "",
    topicTitle: "",
    unitTitle: "",
    videoUrl: "",
    externalResourceUrl: "",
    content: "",
  });
  Object.assign(newAnnouncement, { title: "", date: "", message: "" });
  Object.assign(newQuiz, { name: "", attemptLimit: 0, availableFrom: "", deadline: "", timeLimitMinutes: 0, passPercentage: 50, weight: 1, showResults: true });
  Object.assign(newQuestion, { text: "", a: "", b: "", c: "", d: "", correctAnswer: "a", points: 1 });
  Object.assign(newAssignment, {
    name: "",
    description: "",
    instructions: "",
    availableFrom: "",
    dueDate: "",
    allowLate: false,
    allowResubmission: false,
    submissionType: "file_or_text",
    maxScore: 100,
    weight: 1,
    isPublished: true,
    resourceFile: "",
    resourceFilename: "",
  });
  Object.assign(newAttendanceSession, {
    name: selectedCourse.value ? `${selectedCourse.value.name} Session` : "",
    lessonId: null,
    sessionDate: toDateTimeInput(new Date().toISOString()),
    notes: "",
  });
};

watch(
  () => store.courses.map((course) => course.id).join(","),
  () => {
    if (!selectedCourseId.value || !store.courses.some((course) => course.id === selectedCourseId.value)) {
      selectedCourseId.value = store.courses[0]?.id || null;
    }
    syncCourseDraft();
    resetNewForms();
  },
  { immediate: true },
);

watch(
  () => selectedCourseId.value,
  () => {
    syncCourseDraft();
    selectedStudentId.value = null;
    studentPickerQuery.value = "";
    enrollmentSearch.value = "";
    if (!selectedCourseQuizzes.value.some((quiz) => quiz.id === selectedQuizId.value)) {
      selectedQuizId.value = selectedCourseQuizzes.value[0]?.id || null;
    }
    if (!selectedCourseAttendanceSessions.value.some((session) => session.id === selectedAttendanceSessionId.value)) {
      selectedAttendanceSessionId.value = selectedCourseAttendanceSessions.value[0]?.id || null;
    }
    resetNewForms();
  },
  { immediate: true },
);

watch(
  () => selectedCourseQuizzes.value.map((quiz) => quiz.id).join(","),
  () => {
    if (!selectedCourseQuizzes.value.some((quiz) => quiz.id === selectedQuizId.value)) {
      selectedQuizId.value = selectedCourseQuizzes.value[0]?.id || null;
    }
  },
  { immediate: true },
);

watch(
  () => selectedCourseAttendanceSessions.value.map((session) => session.id).join(","),
  () => {
    if (!selectedCourseAttendanceSessions.value.some((session) => session.id === selectedAttendanceSessionId.value)) {
      selectedAttendanceSessionId.value = selectedCourseAttendanceSessions.value[0]?.id || null;
    }
  },
  { immediate: true },
);

const lessonDraft = (lesson) => {
  if (!lessonDrafts[lesson.id]) {
    lessonDrafts[lesson.id] = {
      name: lesson.name || "",
      sequence: Number(lesson.sequence) || 1,
      moduleTitle: lesson.moduleTitle || "",
      weekLabel: lesson.weekLabel || "",
      topicTitle: lesson.topicTitle || "",
      unitTitle: lesson.unitTitle || "",
      videoUrl: lesson.videoUrl || "",
      externalResourceUrl: lesson.externalResourceUrl || "",
      content: lesson.content || "",
    };
  }
  return lessonDrafts[lesson.id];
};

const announcementDraft = (announcement) => {
  if (!announcementDrafts[announcement.id]) {
    announcementDrafts[announcement.id] = {
      title: announcement.title || "",
      date: toDateInput(announcement.date),
      message: announcement.message || "",
    };
  }
  return announcementDrafts[announcement.id];
};

const quizDraft = (quiz) => {
  if (!quizDrafts[quiz.id]) {
    quizDrafts[quiz.id] = {
      name: quiz.name || "",
      attemptLimit: Number(quiz.attemptLimit) || 0,
      availableFrom: toDateTimeInput(quiz.availableFrom),
      deadline: toDateTimeInput(quiz.deadline),
      timeLimitMinutes: Number(quiz.timeLimitMinutes) || 0,
      passPercentage: Number(quiz.passPercentage) || 50,
      weight: Number(quiz.weight) || 1,
      showResults: quiz.showResults !== false,
    };
  }
  return quizDrafts[quiz.id];
};

const questionDraft = (question) => {
  if (!questionDrafts[question.id]) {
    const optionMap = Object.fromEntries((question.options || []).map((option) => [option.key, option.text]));
    questionDrafts[question.id] = {
      text: question.text || "",
      a: optionMap.a || "",
      b: optionMap.b || "",
      c: optionMap.c || "",
      d: optionMap.d || "",
      correctAnswer: question.correctAnswer || "a",
      points: Number(question.points) || 1,
    };
  }
  return questionDrafts[question.id];
};

const assignmentDraft = (assignment) => {
  if (!assignmentDrafts[assignment.id]) {
    assignmentDrafts[assignment.id] = {
      name: assignment.name || "",
      description: assignment.description || "",
      instructions: assignment.instructions || "",
      availableFrom: toDateTimeInput(assignment.availableFrom),
      dueDate: toDateTimeInput(assignment.dueDate),
      allowLate: Boolean(assignment.allowLate),
      allowResubmission: Boolean(assignment.allowResubmission),
      submissionType: assignment.submissionType || "file_or_text",
      maxScore: Number(assignment.maxScore) || 100,
      weight: Number(assignment.weight) || 1,
      isPublished: assignment.isPublished !== false,
      resourceFile: "",
      resourceFilename: assignment.resourceFileName || "",
    };
  }
  return assignmentDrafts[assignment.id];
};

const attendanceDraft = (record) => {
  if (!attendanceDrafts[record.id || `${record.sessionId}-${record.studentId}`]) {
    attendanceDrafts[record.id || `${record.sessionId}-${record.studentId}`] = {
      studentId: record.studentId,
      status: record.status || "present",
      note: record.note || "",
    };
  }
  return attendanceDrafts[record.id || `${record.sessionId}-${record.studentId}`];
};

const gradingDraft = (submission) => {
  if (!gradingDrafts[submission.id]) {
    gradingDrafts[submission.id] = {
      score: submission.score ?? 0,
      feedback: submission.feedback || "",
      status: submission.status === "graded" ? "graded" : "graded",
    };
  }
  return gradingDrafts[submission.id];
};

function toDateInput(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}
function toDateTimeInput(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value).replace(" ", "T").slice(0, 16);
  const pad = (part) => String(part).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}
function toDateTimeValue(value) {
  return value ? `${value.replace("T", " ")}:00` : false;
}
const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });

const handleAssignmentResourceSelected = async (target, event) => {
  const file = event.target?.files?.[0];
  if (!file) return;
  try {
    target.resourceFile = await readFileAsDataUrl(file);
    target.resourceFilename = file.name;
    setFeedback("success", `${file.name} attached and ready to save.`);
  } catch (error) {
    setFeedback("error", error?.message || "Could not read the selected file.");
  } finally {
    if (event.target) event.target.value = "";
  }
};

const run = async (task, successMessage) => {
  busy.value = true;
  setFeedback("", "");
  try {
    await task();
    setFeedback("success", successMessage);
  } catch (error) {
    setFeedback("error", error?.message || "Something went wrong while saving your changes.");
  } finally {
    busy.value = false;
  }
};

const saveCourse = async () => {
  if (!selectedCourse.value) return;
  await run(
    () =>
      store.saveCourse(selectedCourse.value.id, {
        name: courseDraftState.name.trim(),
        description: courseDraftState.description,
        x_course_code: courseDraftState.code,
        x_department: courseDraftState.department,
        x_term: courseDraftState.term,
        x_status: courseDraftState.status,
        x_is_published: courseDraftState.isPublished,
        x_auto_enroll: courseDraftState.autoEnroll,
      }),
    "Course updated.",
  );
};

const addLesson = async () => {
  await run(
    () =>
      store.createLesson({
        course_id: selectedCourseId.value,
        name: newLesson.name.trim(),
        sequence: Number(newLesson.sequence) || 1,
        x_module_title: newLesson.moduleTitle || false,
        x_week_label: newLesson.weekLabel || false,
        x_topic_title: newLesson.topicTitle || false,
        x_unit_title: newLesson.unitTitle || false,
        video_url: newLesson.videoUrl || false,
        x_external_resource_url: newLesson.externalResourceUrl || false,
        content: newLesson.content || false,
      }),
    "Lesson created.",
  );
  resetNewForms();
};

const saveLesson = async (lesson) => {
  const draft = lessonDraft(lesson);
  await run(
    () =>
      store.updateLesson(lesson.id, {
        name: draft.name.trim(),
        sequence: Number(draft.sequence) || 1,
        x_module_title: draft.moduleTitle || false,
        x_week_label: draft.weekLabel || false,
        x_topic_title: draft.topicTitle || false,
        x_unit_title: draft.unitTitle || false,
        video_url: draft.videoUrl || false,
        x_external_resource_url: draft.externalResourceUrl || false,
        content: draft.content || false,
      }),
    "Lesson updated.",
  );
};
const removeLesson = async (lesson) => {
  await run(() => store.deleteLesson(lesson.id), "Lesson deleted.");
};

const addAnnouncement = async () => {
  await run(
    () =>
      store.createAnnouncement({
        course_id: selectedCourseId.value,
        title: newAnnouncement.title.trim(),
        message: newAnnouncement.message.trim(),
        date: newAnnouncement.date || false,
      }),
    "Announcement created.",
  );
  resetNewForms();
};
const saveAnnouncement = async (announcement) => {
  const draft = announcementDraft(announcement);
  await run(
    () =>
      store.updateAnnouncement(announcement.id, {
        title: draft.title.trim(),
        message: draft.message.trim(),
        date: draft.date || false,
      }),
    "Announcement updated.",
  );
};
const removeAnnouncement = async (announcement) => {
  await run(() => store.deleteAnnouncement(announcement.id), "Announcement deleted.");
};

const addAssignment = async () => {
  await run(
    () =>
      store.saveAssignment(selectedCourseId.value, {
        name: newAssignment.name.trim(),
        description: newAssignment.description,
        instructions: newAssignment.instructions,
        available_from: toDateTimeValue(newAssignment.availableFrom),
        due_date: toDateTimeValue(newAssignment.dueDate),
        allow_late: newAssignment.allowLate,
        allow_resubmission: newAssignment.allowResubmission,
        submission_type: newAssignment.submissionType,
        max_score: Number(newAssignment.maxScore) || 100,
        weight: Number(newAssignment.weight) || 1,
        is_published: newAssignment.isPublished,
        resource_file: newAssignment.resourceFile || "",
        resource_filename: newAssignment.resourceFilename || "",
      }),
    "Assignment created.",
  );
  resetNewForms();
};
const saveAssignmentItem = async (assignment) => {
  const draft = assignmentDraft(assignment);
  await run(
    () =>
      store.saveAssignment(selectedCourseId.value, {
        name: draft.name.trim(),
        description: draft.description,
        instructions: draft.instructions,
        available_from: toDateTimeValue(draft.availableFrom),
        due_date: toDateTimeValue(draft.dueDate),
        allow_late: draft.allowLate,
        allow_resubmission: draft.allowResubmission,
        submission_type: draft.submissionType,
        max_score: Number(draft.maxScore) || 100,
        weight: Number(draft.weight) || 1,
        is_published: draft.isPublished,
        resource_file: draft.resourceFile || "",
        resource_filename: draft.resourceFilename || assignment.resourceFileName || "",
      }, assignment.id),
    "Assignment updated.",
  );
};
const removeAssignment = async (assignment) => {
  await run(() => store.deleteAssignment(assignment.id), "Assignment deleted.");
};

const addEnrollment = async () => {
  if (!selectedCourseId.value || !selectedStudentId.value) return;
  await run(
    () =>
      store.createEnrollment({
        course_id: selectedCourseId.value,
        student_id: selectedStudentId.value,
        status: "enrolled",
      }),
    "Student enrolled successfully.",
  );
  selectedStudentId.value = null;
};
const removeEnrollment = async (enrollment) => {
  await run(() => store.deleteEnrollment(enrollment.id), "Enrollment removed.");
};

const addAttendanceSession = async () => {
  await run(
    () =>
      store.createAttendanceSession({
        courseId: selectedCourseId.value,
        name: newAttendanceSession.name,
        lessonId: newAttendanceSession.lessonId,
        sessionDate: toDateTimeValue(newAttendanceSession.sessionDate),
        notes: newAttendanceSession.notes,
      }),
    "Attendance session created.",
  );
  resetNewForms();
};
const saveSelectedAttendance = async (closeSession) => {
  if (!selectedAttendanceSession.value) return;
  const records = selectedAttendanceSessionRecords.value.map((record) => ({
    student_id: record.studentId,
    status: attendanceDraft(record).status,
    note: attendanceDraft(record).note,
  }));
  await run(
    () => store.saveAttendance(selectedAttendanceSession.value.id, records, closeSession),
    closeSession ? "Attendance saved and session closed." : "Attendance saved.",
  );
};
const reopenSelectedAttendance = async () => {
  if (!selectedAttendanceSession.value) return;
  await run(
    () => store.reopenAttendanceSession(selectedAttendanceSession.value.id),
    "Attendance session reopened.",
  );
};
const removeAttendanceSession = async () => {
  if (!selectedAttendanceSession.value) return;
  await run(() => store.deleteAttendanceSession(selectedAttendanceSession.value.id), "Attendance session deleted.");
};

const addQuiz = async () => {
  await run(
    () =>
      store.createQuiz({
        course_id: selectedCourseId.value,
        name: newQuiz.name.trim(),
        x_attempt_limit: Number(newQuiz.attemptLimit) || 0,
        x_available_from: toDateTimeValue(newQuiz.availableFrom),
        x_deadline: toDateTimeValue(newQuiz.deadline),
        x_time_limit_minutes: Number(newQuiz.timeLimitMinutes) || 0,
        x_pass_percentage: Number(newQuiz.passPercentage) || 50,
        x_weight: Number(newQuiz.weight) || 1,
        x_show_results: newQuiz.showResults,
      }),
    "Quiz created.",
  );
  resetNewForms();
};
const saveQuiz = async (quiz) => {
  const draft = quizDraft(quiz);
  await run(
    () =>
      store.updateQuiz(quiz.id, {
        name: draft.name.trim(),
        x_attempt_limit: Number(draft.attemptLimit) || 0,
        x_available_from: toDateTimeValue(draft.availableFrom),
        x_deadline: toDateTimeValue(draft.deadline),
        x_time_limit_minutes: Number(draft.timeLimitMinutes) || 0,
        x_pass_percentage: Number(draft.passPercentage) || 50,
        x_weight: Number(draft.weight) || 1,
        x_show_results: draft.showResults,
      }),
    "Quiz updated.",
  );
};
const removeQuiz = async (quiz) => {
  await run(() => store.deleteQuiz(quiz.id), "Quiz deleted.");
};

const addQuestion = async () => {
  await run(
    () =>
      store.createQuestion({
        quiz_id: selectedQuizId.value,
        question_text: newQuestion.text.trim(),
        answer_a: newQuestion.a.trim(),
        answer_b: newQuestion.b.trim(),
        answer_c: newQuestion.c.trim(),
        answer_d: newQuestion.d.trim(),
        correct_answer: newQuestion.correctAnswer,
        points: Number(newQuestion.points) || 1,
      }),
    "Question created.",
  );
  resetNewForms();
};
const saveQuestion = async (question) => {
  const draft = questionDraft(question);
  await run(
    () =>
      store.updateQuestion(question.id, {
        question_text: draft.text.trim(),
        answer_a: draft.a.trim(),
        answer_b: draft.b.trim(),
        answer_c: draft.c.trim(),
        answer_d: draft.d.trim(),
        correct_answer: draft.correctAnswer,
        points: Number(draft.points) || 1,
      }),
    "Question updated.",
  );
};
const removeQuestion = async (question) => {
  await run(() => store.deleteQuestion(question.id), "Question deleted.");
};

const gradeSubmission = async (submission) => {
  const draft = gradingDraft(submission);
  await run(
    () =>
      store.gradeAssignment(submission.id, {
        score: Number(draft.score) || 0,
        feedback: draft.feedback,
        status: draft.status,
      }),
    "Submission graded.",
  );
};
</script>

<style scoped>
.doctor-page {
  display: grid;
  gap: 24px;
}

.doctor-pill {
  background: #dbeafe;
  color: #1d4ed8;
}

.doctor-switcher,
.doctor-switcher-secondary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.doctor-switcher {
  flex-wrap: wrap;
}

.doctor-command-card,
.doctor-course-hero {
  display: grid;
  gap: 18px;
  background: linear-gradient(145deg, #ffffff 0%, #f8fbff 100%);
}

.doctor-command-card-strong {
  border: 1px solid #dbe7f5;
}

.doctor-command-hero,
.doctor-course-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.doctor-command-title {
  max-width: 760px;
}

.doctor-course-meta-grid,
.doctor-command-state,
.doctor-course-hero-metrics,
.doctor-command-actions,
.doctor-command-metrics,
.doctor-roster-grid,
.doctor-roster-metrics,
.doctor-quick-actions,
.doctor-course-guidance,
.doctor-attendance-meta,
.doctor-gradebook-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.doctor-command-metrics,
.doctor-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.doctor-dashboard-grid,
.doctor-stack,
.doctor-form-grid,
.doctor-side-stack,
.doctor-quick-actions,
.doctor-roster-preview,
.doctor-roster-insights,
.doctor-course-settings-card,
.doctor-pulse-card,
.doctor-submission-list {
  display: grid;
  gap: 18px;
}

.doctor-dashboard-grid-strong,
.doctor-dashboard-grid {
  grid-template-columns: minmax(0, 1.45fr) minmax(300px, 0.95fr);
}

.doctor-pulse-grid,
.doctor-two-column-grid,
.doctor-two-column-grid-gradebook,
.doctor-roster-grid-strong {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.doctor-two-column-grid-gradebook {
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
}

.doctor-pulse-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.doctor-select,
.doctor-input,
.doctor-textarea,
.doctor-upload-btn {
  width: 100%;
  border: 1px solid #dbe7f5;
  border-radius: 12px;
  background: #fff;
  padding: 11px 13px;
  color: #0f172a;
  font: inherit;
}

.doctor-select {
  max-width: 340px;
}

.doctor-input-compact {
  min-width: 0;
}

.doctor-textarea {
  resize: vertical;
  min-height: 110px;
}

.doctor-upload-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #f8fbff;
}

.doctor-field {
  display: grid;
  gap: 8px;
  font-size: 13px;
  color: #334155;
}

.doctor-field > span {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.doctor-field-full {
  grid-column: 1 / -1;
}

.doctor-form-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.doctor-check,
.doctor-student-preview,
.doctor-quick-btn,
.doctor-guidance-card,
.doctor-submission-card,
.doctor-attendance-row {
  border: 1px solid #dbe7f5;
  border-radius: 14px;
  background: #f8fbff;
  padding: 14px 16px;
}

.doctor-check {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #0f172a;
}

.doctor-quick-btn {
  display: grid;
  gap: 4px;
  text-align: left;
  color: #0f172a;
  cursor: pointer;
}

.doctor-quick-btn strong {
  font-size: 14px;
}

.doctor-quick-btn span,
.doctor-guidance-card span {
  font-size: 12px;
  color: #64748b;
}

.doctor-guidance-card {
  display: grid;
  gap: 6px;
}

.doctor-search-row {
  margin-bottom: 6px;
}

.doctor-enrollment-row,
.doctor-enrollment-row-rich,
.doctor-enrollment-row-soft {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #e2e8f0;
}

.doctor-enrollment-row:last-child,
.doctor-enrollment-row-rich:last-child,
.doctor-enrollment-row-soft:last-child {
  border-bottom: none;
}

.doctor-enrollment-row-rich {
  align-items: center;
}

.doctor-actions,
.doctor-actions-row,
.doctor-actions-split,
.doctor-attendance-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.doctor-actions {
  justify-content: flex-end;
}

.doctor-actions-split {
  justify-content: space-between;
}

.doctor-danger {
  border: none;
  border-radius: 10px;
  padding: 10px 14px;
  background: #fee2e2;
  color: #b91c1c;
  font-weight: 600;
  cursor: pointer;
}

.doctor-attendance-list,
.doctor-submission-list {
  max-height: 620px;
  overflow: auto;
}

.doctor-submission-card,
.doctor-attendance-row {
  display: grid;
  gap: 14px;
}

.doctor-submission-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 600;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 1100px) {
  .doctor-command-metrics,
  .doctor-summary-grid,
  .doctor-pulse-grid,
  .doctor-two-column-grid,
  .doctor-two-column-grid-gradebook,
  .doctor-roster-grid-strong,
  .doctor-dashboard-grid,
  .doctor-dashboard-grid-strong {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .doctor-switcher,
  .doctor-command-hero,
  .doctor-course-hero,
  .doctor-actions-split,
  .doctor-enrollment-row,
  .doctor-enrollment-row-rich,
  .doctor-submission-head,
  .doctor-attendance-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .doctor-form-grid {
    grid-template-columns: 1fr;
  }

  .doctor-select {
    max-width: none;
  }
}
</style>
