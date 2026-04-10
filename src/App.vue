<template>
  <DemoLogin
    v-if="showDemoLogin"
    :accounts="store.demoAccounts"
    :submitting="store.loading"
    :theme-mode="themeMode"
    @login="loginDemoAccount"
    @toggle-theme="toggleThemeMode"
  />

  <div
    v-else
    class="reference-shell"
    :class="[
      `reference-shell--${currentRole}`,
      `reference-shell--${themeMode}`,
      { 'reference-shell--sidebar-collapsed': isSidebarCollapsed },
    ]"
  >
    <aside class="reference-sidebar" :class="{ 'is-collapsed': isSidebarCollapsed }">
      <button
        type="button"
        class="reference-sidebar__toggle"
        :aria-label="isSidebarCollapsed ? 'Expand dashboard sidebar' : 'Collapse dashboard sidebar'"
        @click="toggleSidebar"
      >
        <i :class="isSidebarCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left'"></i>
      </button>

      <div class="reference-brand">
        <img :src="logoUrl" alt="Xrevia University" class="reference-brand__logo" />
        <div>
          <div class="reference-brand__title">XREVIA UNIVERSITY</div>
          <div class="reference-brand__subtitle">{{ portalBrandLabel }}</div>
        </div>
      </div>

      <div class="reference-profile">
        <div class="reference-profile__avatar">
          <img v-if="avatarDisplayUrl" :src="avatarDisplayUrl" :alt="displayName" />
          <span v-else>{{ avatarInitials }}</span>
        </div>
        <div class="reference-profile__name">{{ displayName }}</div>
        <div class="reference-profile__role">{{ roleLabel }}</div>
      </div>

      <div class="reference-nav">
        <section v-for="section in visibleSections" :key="section.title" class="reference-nav__section">
          <div class="reference-nav__title">{{ section.title }}</div>
          <button
            v-for="item in section.items"
            :key="item.key"
            type="button"
            :class="['reference-nav__item', { 'is-active': activeNavKey === item.key }]"
            :title="isSidebarCollapsed ? item.label : ''"
            :aria-label="item.label"
            @click="navigateTo(item.key)"
          >
            <i :class="item.icon"></i>
            <span>{{ item.label }}</span>
            <small v-if="item.badge">{{ item.badge }}</small>
          </button>
        </section>
      </div>

      <button
        type="button"
        class="reference-logout"
        :title="isSidebarCollapsed ? 'Logout' : ''"
        aria-label="Logout"
        @click="logoutNow"
      >
        <i class="fas fa-sign-out-alt"></i>
        <span>Logout</span>
      </button>
    </aside>

    <div class="reference-main">
      <header class="reference-topbar">
        <label class="reference-search">
          <i class="fas fa-search"></i>
          <input v-model="searchQuery" type="text" :placeholder="searchPlaceholder" />
        </label>

        <div class="reference-topbar__actions">
          <button
            v-for="action in topbarActions"
            :key="action.key"
            type="button"
            class="reference-icon-btn"
            @click="handleTopbarAction(action)"
          >
            <i :class="action.icon"></i>
            <span v-if="action.count" class="reference-icon-btn__count">{{ action.count }}</span>
          </button>

          <button type="button" class="reference-user-chip" @click="navigateTo('account')">
            <div class="reference-user-chip__avatar">
              <img v-if="avatarDisplayUrl" :src="avatarDisplayUrl" :alt="displayName" />
              <span v-else>{{ avatarInitials }}</span>
            </div>
            <div>
              <strong>{{ displayName }}</strong>
              <small>{{ roleLabel }}</small>
            </div>
            <i class="fas fa-chevron-down"></i>
          </button>
        </div>
      </header>

      <main class="reference-surface">
        <div v-if="store.error" class="reference-alert">{{ store.error }}</div>
        <div v-else-if="store.loading" class="reference-alert reference-alert--info">Loading your university workspace...</div>
        <div v-if="isDemoMode && !store.error && !store.loading" class="reference-alert reference-alert--info">
          Demo mode is active. Use logout or the account-switch icon in the top bar to jump between student, teacher,
          and admin users.
        </div>

        <StudentDashboard
          v-if="!store.error && !store.loading && activeNavItem?.kind === 'dashboard' && currentRole === 'student'"
          :greeting="`Good morning, ${firstName}!`"
          subtitle="Keep your coursework, deadlines, and progress beautifully organized from one clear academic dashboard."
          :stats="studentDashboardStats"
          :courses="studentDashboardCourses"
          :todo-items="studentTodoItems"
          :announcements="studentAnnouncementCards"
          :calendar-events="studentCalendarCards"
          :progress-value="overallProgress"
          :progress-segments="studentProgressSegments"
          @navigate="navigateTo"
          @open-course="openCourse"
        />

        <TeacherDashboard
          v-else-if="activeNavItem?.kind === 'dashboard' && currentRole === 'teacher'"
          :greeting="`Welcome back, ${teacherDisplayName}!`"
          subtitle="Here is what needs your attention across courses, grading, and academic activity today."
          :stats="teacherDashboardStats"
          :courses="teacherDashboardCourses"
          :pending-assignments="teacherPendingAssignments"
          :performance-points="teacherPerformancePoints"
          :average-performance="formatScore(teacherAveragePerformance)"
          :performance-delta="teacherPerformanceDelta"
          :schedule="teacherScheduleCards"
          @navigate="navigateTo"
          @open-course="openCourse"
          @quick-action="handleTeacherQuickAction"
        />

        <AdminDashboard
          v-else-if="activeNavItem?.kind === 'dashboard' && currentRole === 'admin'"
          heading="University Overview"
          subtitle="A calm, premium command center for university-wide users, courses, departments, and performance."
          :stats="adminDashboardStats"
          :analytics="adminAnalyticsCards"
          :recent-registrations="adminRecentRegistrations"
          :system-activity="adminSystemActivity"
          :report-bars="adminReportBars"
          @navigate="navigateTo"
          @quick-action="handleAdminQuickAction"
        />

        <CourseHubPage
          v-else-if="activeNavItem?.kind === 'course-hub'"
          :role="currentRole"
          :courses="filteredCourses"
          :selected-course-id="selectedCourseId"
          :selected-course="selectedCourse"
          :lessons="selectedCourseLessons"
          :assignments="selectedCourseAssignments"
          :quizzes="selectedCourseQuizzes"
          :announcements="selectedCourseAnnouncements"
          :calendar-events="selectedCourseCalendarCards"
          :gradebook-rows="selectedCourseGradeRows"
          :visibility="store.lmsVisibility"
          :student-count="selectedCourseStudentCount"
          :pending-submissions="selectedCoursePendingSubmissionCount"
          @select-course="selectCourse"
          @open-lesson="openLesson"
          @open-quiz="openQuiz"
          @navigate="navigateTo"
          @workspace-action="handleCourseWorkspaceAction"
        />

        <DoctorWorkspace v-else-if="activeNavItem?.kind === 'workspace'" />

        <section v-else-if="currentRole === 'student' && activeNavKey === 'assignments'" class="reference-page">
          <div class="reference-page__header">
            <div>
              <div class="reference-page__eyebrow">Assignments & Exams</div>
              <h1 class="reference-page__title">Assessment Center</h1>
              <p class="reference-page__subtitle">Submit coursework, review requirements, and take quizzes from one premium workspace.</p>
            </div>
            <span class="reference-page__badge">{{ upcomingAssignments.length + upcomingQuizzes.length }} active</span>
          </div>

          <div class="reference-page__grid reference-page__grid--two">
            <PanelCard title="Assignments" subtitle="Instructions, due dates, files, and submission status all stay clear here.">
              <div class="stack-list">
                <article v-for="assignment in filteredAssignments" :key="assignment.id" class="assignment-card">
                  <div class="assignment-card__head">
                    <div>
                      <h3>{{ assignment.name }}</h3>
                      <p>{{ assignment.course }} · {{ assignment.dueDate ? formatDate(assignment.dueDate) : "No due date" }}</p>
                    </div>
                    <span :class="['status-badge', `status-badge--${assignment.deadlinePassed ? 'danger' : assignment.canSubmit ? 'success' : 'neutral'}`]">
                      {{ assignment.deadlinePassed ? "Late" : assignment.ownSubmission ? assignment.ownSubmission.status : "Open" }}
                    </span>
                  </div>
                  <p class="assignment-card__copy">{{ assignment.instructions || assignment.description || "No instructions yet." }}</p>

                  <div class="assignment-card__meta">
                    <span>Submission: {{ assignment.submissionType.replaceAll("_", " ") }}</span>
                    <span>Score: {{ assignment.maxScore }}</span>
                    <a v-if="assignment.resourceUrl" :href="assignment.resourceUrl" class="link-chip">Download brief</a>
                  </div>

                  <label class="field">
                    <span>Submission Text</span>
                    <textarea v-model="assignmentDraft(assignment).submissionText" rows="3" placeholder="Write your response here..."></textarea>
                  </label>
                  <label class="field">
                    <span>Upload File</span>
                    <input type="file" @change="handleAssignmentFileSelected(assignment, $event)" />
                  </label>

                  <div v-if="assignmentFeedback[assignment.id]?.message" :class="['inline-alert', assignmentFeedback[assignment.id]?.type === 'success' ? 'is-success' : 'is-danger']">
                    {{ assignmentFeedback[assignment.id]?.message }}
                  </div>

                  <button
                    type="button"
                    class="primary-action"
                    :disabled="assignmentSubmittingId === assignment.id || !assignment.canSubmit"
                    @click="submitAssignmentNow(assignment)"
                  >
                    {{ assignmentSubmittingId === assignment.id ? "Submitting..." : "Submit Assignment" }}
                  </button>
                </article>
              <div v-if="!filteredAssignments.length" class="empty-state">No assignment work is visible right now. Open a course or publish a new assessment to continue.</div>
              </div>
            </PanelCard>

            <PanelCard title="Quiz Center" subtitle="Launch assessments, answer clearly, and submit with confidence.">
              <div class="stack-list">
                <div class="quiz-selector">
                  <button
                    v-for="quiz in filteredQuizzes"
                    :key="quiz.id"
                    type="button"
                    :class="['quiz-selector__item', { 'is-active': selectedQuizId === quiz.id }]"
                    @click="openQuiz(quiz.id)"
                  >
                    <div>
                      <strong>{{ quiz.name }}</strong>
                      <small>{{ quiz.course }} · {{ quiz.deadline ? formatDateShort(quiz.deadline) : "No deadline" }}</small>
                    </div>
                    <span>{{ quiz.canTake ? "Open" : quiz.closedReason || "Closed" }}</span>
                  </button>
                </div>

                <div v-if="quizFeedback.message" :class="['inline-alert', quizFeedback.type === 'success' ? 'is-success' : 'is-danger']">
                  {{ quizFeedback.message }}
                </div>

                <div v-if="selectedQuiz" class="quiz-session">
                  <div class="quiz-session__head">
                    <div>
                      <h3>{{ selectedQuiz.name }}</h3>
                      <p>{{ selectedQuiz.course }} · {{ selectedQuiz.timeLimitMinutes ? `${selectedQuiz.timeLimitMinutes} min` : "No time limit" }}</p>
                    </div>
                    <span class="status-badge status-badge--neutral">{{ selectedQuizAnsweredCount }}/{{ selectedQuizQuestions.length }} answered</span>
                  </div>

                  <article v-for="question in selectedQuizQuestions" :key="question.id" class="quiz-question">
                    <div class="quiz-question__title">{{ question.text }}</div>
                    <label v-for="option in question.options" :key="option.key" class="quiz-option">
                      <input
                        :checked="quizAnswers[question.id] === option.key"
                        type="radio"
                        :name="`question-${question.id}`"
                        @change="chooseAnswer(question.id, option.key)"
                      />
                      <span>{{ option.label }}</span>
                      <strong>{{ option.text }}</strong>
                    </label>
                  </article>

                  <div class="quiz-session__actions">
                    <button type="button" class="secondary-action" @click="cancelQuiz">Cancel</button>
                    <button type="button" class="primary-action" :disabled="quizSubmitting" @click="submitSelectedQuiz">
                      {{ quizSubmitting ? "Submitting..." : "Submit Quiz" }}
                    </button>
                  </div>
                </div>

                <div v-else class="empty-state">Choose a quiz to see its instructions and questions here.</div>
              </div>
            </PanelCard>
          </div>
        </section>

        <section v-else-if="currentRole === 'student' && activeNavKey === 'calendar'" class="reference-page">
          <div class="reference-page__header">
            <div>
              <div class="reference-page__eyebrow">Calendar</div>
              <h1 class="reference-page__title">Academic Calendar</h1>
              <p class="reference-page__subtitle">A clear overview of deadlines, lectures, quizzes, attendance, and course updates.</p>
            </div>
          </div>

          <div class="reference-page__grid reference-page__grid--two">
            <PanelCard title="Upcoming Events" subtitle="Every scheduled touchpoint collected in one timeline.">
              <div class="stack-list">
                <div v-for="event in filteredCalendarEvents" :key="event.id" class="list-row">
                  <div class="list-row__icon"><i :class="calendarIcon(event.type)"></i></div>
                  <div>
                    <div class="list-row__title">{{ event.title }}</div>
                    <div class="list-row__sub">{{ event.subtitle }} · {{ formatDate(event.startsAt) }}</div>
                  </div>
                  <span class="status-badge status-badge--neutral">{{ event.type }}</span>
                </div>
                <div v-if="!filteredCalendarEvents.length" class="empty-state">No upcoming academic events are scheduled yet. New deadlines and sessions will appear here.</div>
              </div>
            </PanelCard>

            <PanelCard title="Attendance Snapshot" subtitle="Track attendance and keep an eye on your academic standing.">
              <div class="metric-columns">
                <div class="metric-box">
                  <span>Attendance Rate</span>
                  <strong>{{ attendanceSummary.percentage !== null ? formatProgress(attendanceSummary.percentage) : "—" }}</strong>
                </div>
                <div class="metric-box">
                  <span>Present</span>
                  <strong>{{ attendanceSummary.present }}</strong>
                </div>
                <div class="metric-box">
                  <span>Late</span>
                  <strong>{{ attendanceSummary.late }}</strong>
                </div>
                <div class="metric-box">
                  <span>Absent</span>
                  <strong>{{ attendanceSummary.absent }}</strong>
                </div>
              </div>
            </PanelCard>
          </div>

          <div class="reference-page__grid reference-page__grid--two">
            <PanelCard title="Recent Attendance History" subtitle="Every published class session appears here so students can verify the latest marks.">
              <div class="stack-list">
                <div v-for="record in recentAttendanceHistory" :key="record.id" class="list-row">
                  <div class="list-row__icon"><i class="fas fa-user-check"></i></div>
                  <div>
                    <div class="list-row__title">{{ record.session || record.lesson || 'Attendance session' }}</div>
                    <div class="list-row__sub">{{ record.course }} · {{ formatDate(record.sessionDate || record.markedOn) }}</div>
                  </div>
                  <span :class="['status-badge', `status-badge--${attendanceStatusTone(record.status)}`]">{{ record.statusLabel }}</span>
                </div>
                <div v-if="!recentAttendanceHistory.length" class="empty-state">No attendance has been published yet. Once an instructor marks a class, it will appear here with the exact session date.</div>
              </div>
            </PanelCard>

            <PanelCard title="Attendance Guidance" subtitle="A clearer read on where your attendance stands and what to do next.">
              <div class="metric-columns">
                <div class="metric-box">
                  <span>Sessions Marked</span>
                  <strong>{{ recentAttendanceHistory.length ? store.attendanceRecords.length : 0 }}</strong>
                </div>
                <div class="metric-box">
                  <span>Last Update</span>
                  <strong>{{ recentAttendanceHistory[0] ? formatDateShort(recentAttendanceHistory[0].sessionDate || recentAttendanceHistory[0].markedOn) : '—' }}</strong>
                </div>
              </div>
              <div class="list-row list-row--stacked">
                <div>
                  <div class="list-row__title">{{ attendanceStanding.label }}</div>
                  <div class="list-row__sub">{{ attendanceStanding.note }}</div>
                </div>
                <span :class="['status-badge', `status-badge--${attendanceStanding.tone}`]">{{ attendanceSummary.percentage !== null ? formatProgress(attendanceSummary.percentage) : 'Awaiting marks' }}</span>
              </div>
            </PanelCard>
          </div>
        </section>

        <section v-else-if="currentRole === 'student' && activeNavKey === 'grades'" class="reference-page">
          <div class="reference-page__header">
            <div>
              <div class="reference-page__eyebrow">Grades</div>
              <h1 class="reference-page__title">My Grades & Feedback</h1>
              <p class="reference-page__subtitle">Understand your current results, published feedback, and final course performance at a glance.</p>
            </div>
          </div>

          <div class="reference-page__grid reference-page__grid--two">
            <PanelCard title="Performance Summary" subtitle="A high-level look at quizzes, assignments, and attendance.">
              <ProgressDonut :center-value="formatProgress(overallProgress)" center-label="Course Progress" :segments="studentProgressSegments" />
              <div class="metric-columns">
                <div class="metric-box">
                  <span>Quiz Average</span>
                  <strong>{{ formatScore(studentQuizAverage) }}</strong>
                </div>
                <div class="metric-box">
                  <span>Assignment Average</span>
                  <strong>{{ formatScore(studentAssignmentAverage) }}</strong>
                </div>
              </div>
            </PanelCard>

            <PanelCard title="Gradebook" subtitle="Published scores and comments from assignments and quizzes.">
              <div class="stack-list">
                <div v-for="entry in filteredGradeEntries" :key="entry.id" class="list-row list-row--stacked">
                  <div>
                    <div class="list-row__title">{{ entry.title }}</div>
                    <div class="list-row__sub">{{ entry.course }} · {{ entry.status || entry.type }}</div>
                  </div>
                  <div class="list-row__meta-group">
                    <strong>{{ formatScore(entry.score) }}</strong>
                    <span>{{ entry.feedback || "Feedback will appear here once published." }}</span>
                  </div>
                </div>
                <div v-if="!filteredGradeEntries.length" class="empty-state">No graded work has been published yet. Once instructors finalize scores, they will appear here.</div>
              </div>
            </PanelCard>
          </div>
        </section>

        <section v-else-if="listPageConfig" class="reference-page">
          <div class="reference-page__header">
            <div>
              <div class="reference-page__eyebrow">{{ listPageConfig.eyebrow }}</div>
              <h1 class="reference-page__title">{{ listPageConfig.title }}</h1>
              <p class="reference-page__subtitle">{{ listPageConfig.subtitle }}</p>
            </div>
            <span v-if="listPageConfig.badge" class="reference-page__badge">{{ listPageConfig.badge }}</span>
          </div>

          <PanelCard :title="listPageConfig.panelTitle" :subtitle="listPageConfig.panelSubtitle">
            <div class="stack-list">
              <div v-for="row in listPageConfig.rows" :key="row.id" class="list-row">
                <div v-if="row.initials" class="list-row__avatar">{{ row.initials }}</div>
                <div v-else class="list-row__icon"><i :class="row.icon || 'fas fa-circle'"></i></div>
                <div>
                  <div class="list-row__title">{{ row.title }}</div>
                  <div class="list-row__sub">{{ row.subtitle }}</div>
                </div>
                <div class="list-row__meta-group">
                  <strong v-if="row.tag">{{ row.tag }}</strong>
                  <span>{{ row.meta }}</span>
                </div>
              </div>
              <div v-if="!listPageConfig.rows.length" class="empty-state">Nothing is available in this section yet.</div>
            </div>
          </PanelCard>
        </section>

        <section v-else-if="resourcePageConfig" class="reference-page">
          <div class="reference-page__header">
            <div>
              <div class="reference-page__eyebrow">{{ resourcePageConfig.eyebrow }}</div>
              <h1 class="reference-page__title">{{ resourcePageConfig.title }}</h1>
              <p class="reference-page__subtitle">{{ resourcePageConfig.subtitle }}</p>
            </div>
          </div>

          <PanelCard :title="resourcePageConfig.panelTitle" :subtitle="resourcePageConfig.panelSubtitle">
            <div class="stack-list">
              <div v-for="resource in resourcePageConfig.rows" :key="resource.id" class="resource-row">
                <div class="list-row__icon"><i :class="resource.icon"></i></div>
                <div>
                  <div class="list-row__title">{{ resource.title }}</div>
                  <div class="list-row__sub">{{ resource.subtitle }}</div>
                </div>
                <a v-if="resource.url" :href="resource.url" class="link-chip" target="_blank" rel="noreferrer">Open</a>
                <button v-else-if="resource.lessonId" type="button" class="link-chip" @click="openLesson(resource.lessonId)">Open</button>
              </div>
              <div v-if="!resourcePageConfig.rows.length" class="empty-state">No structured resources are available yet. Open a course lesson to review notes and learning materials.</div>
            </div>
          </PanelCard>
        </section>

        <section v-else-if="tilePageConfig" class="reference-page">
          <div class="reference-page__header">
            <div>
              <div class="reference-page__eyebrow">{{ tilePageConfig.eyebrow }}</div>
              <h1 class="reference-page__title">{{ tilePageConfig.title }}</h1>
              <p class="reference-page__subtitle">{{ tilePageConfig.subtitle }}</p>
            </div>
          </div>

          <div class="tile-grid">
            <PanelCard v-for="tile in tilePageConfig.tiles" :key="tile.title" :title="tile.title" :subtitle="tile.description">
              <button type="button" class="tile-card" @click="handleTileAction(tile)">
                <div class="tile-card__icon"><i :class="tile.icon"></i></div>
                <div class="tile-card__copy">{{ tile.copy }}</div>
                <span class="tile-card__cta">{{ tile.cta }}</span>
              </button>
            </PanelCard>
          </div>
        </section>

        <section v-else-if="reportPageConfig" class="reference-page">
          <div class="reference-page__header">
            <div>
              <div class="reference-page__eyebrow">{{ reportPageConfig.eyebrow }}</div>
              <h1 class="reference-page__title">{{ reportPageConfig.title }}</h1>
              <p class="reference-page__subtitle">{{ reportPageConfig.subtitle }}</p>
            </div>
          </div>

          <div class="reference-page__grid reference-page__grid--two">
            <PanelCard :title="reportPageConfig.primaryTitle" :subtitle="reportPageConfig.primarySubtitle">
              <div class="metric-columns">
                <div v-for="metric in reportPageConfig.metrics" :key="metric.label" class="metric-box">
                  <span>{{ metric.label }}</span>
                  <strong>{{ metric.value }}</strong>
                </div>
              </div>
            </PanelCard>

            <PanelCard :title="reportPageConfig.secondaryTitle" :subtitle="reportPageConfig.secondarySubtitle">
              <div class="stack-list">
                <div v-for="row in reportPageConfig.rows" :key="row.id" class="list-row">
                  <div class="list-row__icon"><i :class="row.icon"></i></div>
                  <div>
                    <div class="list-row__title">{{ row.title }}</div>
                    <div class="list-row__sub">{{ row.subtitle }}</div>
                  </div>
                  <div class="list-row__meta-group">
                    <strong v-if="row.tag">{{ row.tag }}</strong>
                    <span>{{ row.meta }}</span>
                  </div>
                </div>
                <div v-if="!reportPageConfig.rows.length" class="empty-state">There is not enough graded or activity data yet to populate this report.</div>
              </div>
            </PanelCard>
          </div>
        </section>

        <section v-else-if="activeNavKey === 'account'" class="reference-page">
          <div class="reference-page__header">
            <div>
              <div class="reference-page__eyebrow">Account</div>
              <h1 class="reference-page__title">Profile & Preferences</h1>
              <p class="reference-page__subtitle">Manage your profile, portal notifications, and password in the same premium dashboard language.</p>
            </div>
          </div>

          <div class="reference-page__grid reference-page__grid--two">
            <PanelCard title="Profile" subtitle="Keep your contact details current and your account recognizable.">
              <div class="profile-card">
                <div class="profile-card__avatar" @click="triggerAvatarPicker">
                  <img v-if="avatarDisplayUrl" :src="avatarDisplayUrl" :alt="displayName" />
                  <span v-else>{{ avatarInitials }}</span>
                </div>
                <div class="profile-card__meta">
                  <strong>{{ displayName }}</strong>
                  <span>{{ roleLabel }}</span>
                </div>
              </div>

              <input ref="avatarInput" type="file" class="hidden-input" accept="image/*" @change="handleAvatarSelected" />

              <label class="field">
                <span>Full Name</span>
                <input v-model="accountForm.fullName" type="text" />
              </label>
              <label class="field">
                <span>Email</span>
                <input v-model="accountForm.email" type="email" />
              </label>
              <label class="field">
                <span>Phone</span>
                <input v-model="accountForm.phone" type="text" />
              </label>

              <div v-if="accountFeedback.message" :class="['inline-alert', accountFeedback.type === 'success' ? 'is-success' : 'is-danger']">
                {{ accountFeedback.message }}
              </div>

              <div class="inline-actions">
                <button type="button" class="secondary-action" :disabled="avatarUploading" @click="removeAvatar">Remove Photo</button>
                <button type="button" class="primary-action" :disabled="accountSaving" @click="saveAccountSettings">
                  {{ accountSaving ? "Saving..." : "Save Profile" }}
                </button>
              </div>
            </PanelCard>

            <div class="stack-panels">
              <PanelCard title="Notifications" subtitle="Choose which updates should reach you first.">
                <div class="toggle-list">
                  <label v-for="option in notificationOptions" :key="option.key" class="toggle-row">
                    <div>
                      <strong>{{ option.label }}</strong>
                      <span>{{ option.description }}</span>
                    </div>
                    <input v-model="notificationForm[option.key]" type="checkbox" />
                  </label>
                </div>

                <div v-if="notificationFeedback.message" :class="['inline-alert', notificationFeedback.type === 'success' ? 'is-success' : 'is-danger']">
                  {{ notificationFeedback.message }}
                </div>

                <button type="button" class="primary-action" :disabled="notificationSaving" @click="saveNotificationPreferences">
                  {{ notificationSaving ? "Saving..." : "Save Preferences" }}
                </button>
              </PanelCard>

              <PanelCard title="Security" subtitle="Update your password to keep your university account protected.">
                <label class="field">
                  <span>Current Password</span>
                  <input v-model="passwordForm.currentPassword" type="password" />
                </label>
                <label class="field">
                  <span>New Password</span>
                  <input v-model="passwordForm.newPassword" type="password" />
                </label>
                <label class="field">
                  <span>Confirm Password</span>
                  <input v-model="passwordForm.confirmPassword" type="password" />
                </label>

                <div v-if="passwordFeedback.message" :class="['inline-alert', passwordFeedback.type === 'success' ? 'is-success' : 'is-danger']">
                  {{ passwordFeedback.message }}
                </div>

                <button type="button" class="primary-action" :disabled="passwordSaving" @click="savePasswordChange">
                  {{ passwordSaving ? "Updating..." : "Update Password" }}
                </button>
              </PanelCard>
            </div>
          </div>
        </section>

        <section v-else class="reference-page">
          <div class="reference-page__header">
            <div>
              <div class="reference-page__eyebrow">Portal</div>
              <h1 class="reference-page__title">{{ activeNavItem?.label || "Workspace" }}</h1>
              <p class="reference-page__subtitle">This section is being prepared in the same design system. Try another page from the sidebar.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useLmsStore } from "./stores/lms";
import logoUrl from "./assets/logo.png";
import DoctorWorkspace from "./components/DoctorWorkspace.vue";
import PanelCard from "./components/dashboard/PanelCard.vue";
import ProgressDonut from "./components/dashboard/ProgressDonut.vue";
import StudentDashboard from "./components/dashboard/StudentDashboard.vue";
import TeacherDashboard from "./components/dashboard/TeacherDashboard.vue";
import AdminDashboard from "./components/dashboard/AdminDashboard.vue";
import CourseHubPage from "./components/dashboard/CourseHubPage.vue";
import DemoLogin from "./components/DemoLogin.vue";

const store = useLmsStore();
const searchQuery = ref("");
const themeMode = ref("light");
const THEME_STORAGE_KEY = "xrevia-lms-theme";
const SIDEBAR_STORAGE_KEY = "xrevia-lms-sidebar-collapsed";
const isSidebarCollapsed = ref(false);
const selectedCourseId = ref(null);
const selectedQuizId = ref(null);
const quizAnswers = ref({});
const quizSubmitting = ref(false);
const quizFeedback = ref({ type: "", message: "" });
const assignmentSubmittingId = ref(null);
const assignmentDrafts = reactive({});
const assignmentFeedback = reactive({});
const avatarInput = ref(null);
const avatarUploading = ref(false);
const accountSaving = ref(false);
const notificationSaving = ref(false);
const passwordSaving = ref(false);
const accountFeedback = ref({ type: "", message: "" });
const notificationFeedback = ref({ type: "", message: "" });
const passwordFeedback = ref({ type: "", message: "" });
const accountForm = ref({ fullName: "", email: "", phone: "" });
const notificationForm = ref({ announcements: true, quizzes: true, progress: true });
const passwordForm = ref({ currentPassword: "", newPassword: "", confirmPassword: "" });
const activeNavKey = ref("dashboard");
const isDemoMode = computed(() => store.environmentMode === "demo");
const showDemoLogin = computed(() => isDemoMode.value && store.requiresDemoLogin);

const notificationOptions = [
  {
    key: "announcements",
    label: "Course announcements",
    description: "Receive important news and course updates from instructors.",
  },
  {
    key: "quizzes",
    label: "Quiz reminders",
    description: "Stay ready for new quizzes, availability windows, and results.",
  },
  {
    key: "progress",
    label: "Progress nudges",
    description: "Friendly reminders when lessons or coursework are waiting for you.",
  },
];

const currentRole = computed(() => {
  if (store.viewerMode === "admin") return "admin";
  if (store.viewerMode === "doctor") return "teacher";
  return "student";
});

const roleLabel = computed(() => {
  if (currentRole.value === "admin") return "Administrator";
  if (currentRole.value === "teacher") return "Professor";
  return "Student";
});

const portalBrandLabel = computed(() => {
  if (currentRole.value === "admin") return "LMS | Admin Portal";
  if (currentRole.value === "teacher") return "LMS | Faculty Portal";
  return "LMS | Student Portal";
});

const displayName = computed(() => {
  const name = store.student.fullName || (currentRole.value === "admin" ? "Administrator" : currentRole.value === "teacher" ? "Dr. Hassan" : "Student");
  if (currentRole.value === "teacher" && !/^dr\./i.test(name)) {
    return `Dr. ${name}`;
  }
  return name;
});

const teacherDisplayName = computed(() => {
  const name = store.student.fullName || "Hassan";
  return /^dr\./i.test(name) ? name : `Dr. ${name}`;
});

const firstName = computed(() => (store.student.fullName || "Student").split(/\s+/).filter(Boolean)[0] || "Student");
const avatarDisplayUrl = computed(() => store.student.avatarUrl || "");
const avatarInitials = computed(() =>
  (store.student.fullName || roleLabel.value)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "XL",
);

const navigationSections = computed(() => {
  if (currentRole.value === "teacher") {
    return [
      {
        title: "Teaching",
        items: [
          { key: "dashboard", label: "Dashboard", icon: "fas fa-th-large", kind: "dashboard", visibilityKey: "dashboard" },
          { key: "courses", label: "My Courses", icon: "fas fa-layer-group", kind: "course-hub", visibilityKey: "courses" },
          { key: "students", label: "Students", icon: "fas fa-user-graduate", kind: "workspace", target: "enrollments", visibilityKey: "enrollments" },
          { key: "assignments", label: "Assignments", icon: "fas fa-file-signature", kind: "workspace", target: "courses", visibilityKey: "courses" },
          { key: "gradebook", label: "Gradebook", icon: "fas fa-chart-line", kind: "workspace", target: "quiz-results", visibilityKey: "quizResults" },
          { key: "attendance", label: "Attendance", icon: "fas fa-user-check", kind: "workspace", target: "enrollments", visibilityKey: "enrollments" },
          { key: "quizzes", label: "Quizzes", icon: "fas fa-clipboard-list", kind: "workspace", target: "quizzes", visibilityKey: "quizzes" },
          { key: "announcements", label: "Announcements", icon: "fas fa-bullhorn", kind: "workspace", target: "announcements", visibilityKey: "announcements" },
        ],
      },
      {
        title: "Communication",
        items: [
          { key: "reports", label: "Reports", icon: "fas fa-chart-bar", kind: "page" },
        ],
      },
    ];
  }

  if (currentRole.value === "admin") {
    return [
      {
        title: "Management",
        items: [
          { key: "dashboard", label: "Dashboard", icon: "fas fa-th-large", kind: "dashboard", visibilityKey: "dashboard" },
          { key: "users", label: "Users", icon: "fas fa-users", kind: "page" },
          { key: "students", label: "Students", icon: "fas fa-user-graduate", kind: "page" },
          { key: "professors", label: "Professors", icon: "fas fa-chalkboard-teacher", kind: "page" },
          { key: "courses", label: "Courses", icon: "fas fa-book-open", kind: "course-hub", visibilityKey: "courses" },
          { key: "departments", label: "Departments", icon: "fas fa-building-columns", kind: "page" },
          { key: "reports", label: "Reports", icon: "fas fa-chart-column", kind: "page" },
          { key: "analytics", label: "Analytics", icon: "fas fa-wave-square", kind: "page" },
        ],
      },
      {
        title: "System",
        items: [
          { key: "settings", label: "Settings", icon: "fas fa-cog", kind: "page" },
          { key: "permissions", label: "Permissions", icon: "fas fa-shield-alt", kind: "page" },
        ],
      },
    ];
  }

  return [
    {
      title: "Academic",
      items: [
        { key: "dashboard", label: "Dashboard", icon: "fas fa-th-large", kind: "dashboard", visibilityKey: "dashboard" },
        { key: "courses", label: "Courses", icon: "fas fa-book-open", kind: "course-hub", visibilityKey: "courses" },
        { key: "assignments", label: "Assignments", icon: "fas fa-file-signature", kind: "page" },
        { key: "calendar", label: "Calendar", icon: "far fa-calendar-alt", kind: "page" },
        { key: "grades", label: "Grades", icon: "fas fa-chart-line", kind: "page" },
        { key: "announcements", label: "Announcements", icon: "fas fa-bullhorn", kind: "page", visibilityKey: "announcements" },
        { key: "resources", label: "Resources", icon: "fas fa-folder-open", kind: "page" },
      ],
    },
    {
      title: "Support",
      items: [
        { key: "discussion", label: "Discussion", icon: "far fa-comments", kind: "page" },
        { key: "help-center", label: "Help Center", icon: "fas fa-circle-question", kind: "page" },
      ],
    },
  ];
});

const hiddenItems = [
  { key: "account", label: "Account", kind: "page" },
];

const visibilityByKey = computed(() => ({
  dashboard: store.lmsVisibility.dashboard,
  courses: store.lmsVisibility.courses,
  lessons: store.lmsVisibility.lessons,
  announcements: store.lmsVisibility.announcements,
  enrollments: store.lmsVisibility.enrollments,
  quizzes: store.lmsVisibility.quizzes,
  questions: store.lmsVisibility.questions,
  quizResults: store.lmsVisibility.quizResults,
}));

const isItemVisible = (item) => {
  if (!item.visibilityKey) return true;
  return visibilityByKey.value[item.visibilityKey] !== false;
};

const visibleSections = computed(() =>
  navigationSections.value
    .map((section) => ({
      ...section,
      items: section.items.filter(isItemVisible),
    }))
    .filter((section) => section.items.length),
);

const navLookup = computed(() => {
  const map = Object.create(null);
  [...visibleSections.value.flatMap((section) => section.items), ...hiddenItems].forEach((item) => {
    map[item.key] = item;
  });
  return map;
});

const activeNavItem = computed(() => navLookup.value[activeNavKey.value] || visibleSections.value[0]?.items[0] || hiddenItems[0]);
const searchPlaceholder = computed(() => {
  if (currentRole.value === "admin") return "Search users, courses, departments...";
  if (currentRole.value === "teacher") return "Search courses, students, assignments...";
  return "Search anything...";
});

const topbarActions = computed(() => {
  const utilityActions = isDemoMode.value
    ? [
        { key: "theme", icon: themeMode.value === "dark" ? "fas fa-sun" : "far fa-moon", action: "toggle-theme" },
        { key: "account-switch", icon: "fas fa-user-shield", action: "switch-account" },
        { key: "workspace-settings", icon: "fas fa-cog", action: currentRole.value === "admin" ? "settings" : "account" },
      ]
    : [
        { key: "theme", icon: themeMode.value === "dark" ? "fas fa-sun" : "far fa-moon", action: "toggle-theme" },
        { key: "backend", icon: "fas fa-th-large", action: "backend" },
        { key: "settings", icon: "fas fa-cog", action: "backend-settings" },
      ];

  if (currentRole.value === "admin") {
    return [
      ...utilityActions,
      { key: "notifications", icon: "far fa-bell", count: notificationCount.value, action: "notifications" },
    ];
  }
  if (currentRole.value === "teacher") {
    return [
      ...utilityActions,
      { key: "notifications", icon: "far fa-bell", count: notificationCount.value, action: "announcements" },
      { key: "schedule", icon: "far fa-calendar-alt", action: "reports" },
    ];
  }
  return [
    ...utilityActions,
    { key: "notifications", icon: "far fa-bell", count: notificationCount.value, action: "announcements" },
  ];
});

const normalizedSearch = computed(() => searchQuery.value.trim().toLowerCase());
const includesSearch = (...values) => {
  if (!normalizedSearch.value) return true;
  return values
    .flat()
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedSearch.value));
};

const filteredCourses = computed(() =>
  store.courses.filter((course) =>
    includesSearch(course.name, course.code, course.teacher, course.department, course.term),
  ),
);

const studentCountsByCourse = computed(() => {
  const counts = new Map();
  store.enrollments.forEach((enrollment) => {
    counts.set(enrollment.courseId, (counts.get(enrollment.courseId) || 0) + 1);
  });
  return counts;
});

const selectedCourse = computed(() => store.courses.find((course) => course.id === selectedCourseId.value) || filteredCourses.value[0] || store.courses[0] || null);
const selectedCourseLessons = computed(() => store.lessons.filter((lesson) => lesson.courseId === selectedCourse.value?.id));
const selectedCourseAssignments = computed(() => store.assignments.filter((assignment) => assignment.courseId === selectedCourse.value?.id));
const selectedCourseQuizzes = computed(() => store.quizzes.filter((quiz) => quiz.courseId === selectedCourse.value?.id));
const selectedCourseAnnouncements = computed(() => store.announcements.filter((announcement) => announcement.courseId === selectedCourse.value?.id));
const selectedCourseEvents = computed(() => store.calendarEvents.filter((event) => event.courseId === selectedCourse.value?.id));
const selectedCourseGradeRows = computed(() => store.gradebookRows.filter((row) => row.courseId === selectedCourse.value?.id));
const selectedCourseStudentCount = computed(() => {
  if (!selectedCourse.value) return 0;
  if (currentRole.value === "student") return selectedCourse.value.enrolled ? 1 : 0;
  return studentCountsByCourse.value.get(selectedCourse.value.id) || selectedCourse.value.activeStudents || 0;
});
const selectedCoursePendingSubmissionCount = computed(() =>
  selectedCourseAssignments.value.reduce((total, assignment) => total + (assignment.pendingCount || 0), 0),
);

const notificationCount = computed(() => Math.min(store.notificationsFeed.length, 9));

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

const overallProgress = computed(() => {
  const values = store.enrollments.map((enrollment) => Number(enrollment.progress) || 0);
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
});

const completedLessonCount = computed(() => store.lessons.filter((lesson) => lesson.isCompleted).length);
const inProgressLessonCount = computed(() => store.lessons.filter((lesson) => lesson.started && !lesson.isCompleted).length);
const notStartedLessonCount = computed(() => Math.max(store.lessons.length - completedLessonCount.value - inProgressLessonCount.value, 0));
const studyHoursThisWeek = computed(() => Math.round((completedLessonCount.value * 1.8) + (inProgressLessonCount.value * 1.2)));

const attendanceSummary = computed(() => {
  if (!store.attendanceRecords.length) {
    return { percentage: null, present: 0, late: 0, absent: 0 };
  }
  const present = store.attendanceRecords.filter((record) => record.status === "present").length;
  const late = store.attendanceRecords.filter((record) => record.status === "late").length;
  const absent = store.attendanceRecords.filter((record) => record.status === "absent").length;
  const total = store.attendanceRecords.length;
  return {
    percentage: total ? ((present + late) / total) * 100 : 0,
    present,
    late,
    absent,
  };
});

const recentAttendanceHistory = computed(() =>
  [...store.attendanceRecords]
    .sort((left, right) => timestampFor(right.sessionDate || right.markedOn) - timestampFor(left.sessionDate || left.markedOn) || right.id - left.id)
    .slice(0, 5),
);

const attendanceStanding = computed(() => {
  if (attendanceSummary.value.percentage === null) {
    return {
      label: "Not marked yet",
      note: "Your instructors have not published attendance yet. New class sessions will appear here as soon as they are recorded.",
      tone: "neutral",
    };
  }
  if (attendanceSummary.value.percentage >= 90) {
    return {
      label: "Excellent standing",
      note: "You are consistently showing up and protecting your academic momentum.",
      tone: "success",
    };
  }
  if (attendanceSummary.value.percentage >= 75) {
    return {
      label: "On track",
      note: "Your attendance is healthy. Keep an eye on upcoming lectures so it stays that way.",
      tone: "warning",
    };
  }
  return {
    label: "Needs attention",
    note: "Your attendance is trending low. Check the next scheduled sessions and reach out to your instructor if you need support.",
    tone: "danger",
  };
});

const averageCourseGrade = computed(() => {
  const values = store.courses.map((course) => course.averagePercentage).filter((value) => value !== null && value !== undefined);
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
});

const studentQuizAverage = computed(() => {
  if (!store.quizResults.length) return null;
  return store.quizResults.reduce((sum, row) => sum + (Number(row.score) || 0), 0) / store.quizResults.length;
});

const studentAssignmentAverage = computed(() => {
  const graded = store.assignmentSubmissions.filter((submission) => submission.percentage !== null && submission.percentage !== undefined);
  if (!graded.length) return null;
  return graded.reduce((sum, row) => sum + (Number(row.percentage) || 0), 0) / graded.length;
});

const upcomingAssignments = computed(() =>
  [...store.assignments]
    .filter((assignment) => assignment.canSubmit || assignment.ownSubmission)
    .sort((left, right) => timestampFor(left.dueDate || left.availableFrom) - timestampFor(right.dueDate || right.availableFrom))
    .slice(0, 4),
);

const upcomingQuizzes = computed(() =>
  [...store.quizzes]
    .filter((quiz) => quiz.canTake)
    .sort((left, right) => timestampFor(left.deadline || left.availableFrom) - timestampFor(right.deadline || right.availableFrom))
    .slice(0, 4),
);

const filteredAssignments = computed(() =>
  store.assignments.filter((assignment) => includesSearch(assignment.name, assignment.course, assignment.description, assignment.instructions)),
);

const filteredQuizzes = computed(() =>
  store.quizzes.filter((quiz) => includesSearch(quiz.name, quiz.course, quiz.statusLabel)),
);

const filteredCalendarEvents = computed(() =>
  sortEventsByDistance(store.calendarEvents.filter((event) => includesSearch(event.title, event.subtitle, event.type))),
);

const sortEventsByDistance = (events) => {
  const now = Date.now();
  return [...events].sort((left, right) => {
    const leftStamp = timestampFor(left.startsAt);
    const rightStamp = timestampFor(right.startsAt);
    const leftDistance = leftStamp >= now ? leftStamp - now : now - leftStamp + 7 * 24 * 60 * 60 * 1000;
    const rightDistance = rightStamp >= now ? rightStamp - now : now - rightStamp + 7 * 24 * 60 * 60 * 1000;
    return leftDistance - rightDistance || leftStamp - rightStamp;
  });
};

const filteredGradeEntries = computed(() =>
  store.gradebookRows.filter((row) => includesSearch(row.title, row.course, row.feedback, row.status)),
);

const selectedQuiz = computed(() => store.quizzes.find((quiz) => quiz.id === selectedQuizId.value) || null);
const selectedQuizQuestions = computed(() => store.questions.filter((question) => question.quizId === selectedQuizId.value));
const selectedQuizAnsweredCount = computed(() => selectedQuizQuestions.value.filter((question) => Boolean(quizAnswers.value[question.id])).length);

const studentDashboardStats = computed(() => [
  { label: "My Courses", value: store.courses.length, sub: "Active this semester", icon: "fas fa-book-open", tone: "blue" },
  { label: "Assignments Due Soon", value: upcomingAssignments.value.length, sub: upcomingAssignments.value[0] ? relativeDueLabel(upcomingAssignments.value[0].dueDate) : "No urgent deadlines", icon: "fas fa-file-signature", tone: "cyan" },
  { label: "Average Grade", value: formatScore(averageCourseGrade.value), sub: store.quizResults.length ? `${store.quizResults.length} assessments recorded` : "Grades will appear here soon", icon: "fas fa-star", tone: "gold" },
  { label: "Study Hours This Week", value: studyHoursThisWeek.value, sub: completedLessonCount.value ? "Built from your learning activity" : "Start a lesson to build momentum", icon: "fas fa-clock", tone: "violet" },
]);

const studentDashboardCourses = computed(() =>
  filteredCourses.value.slice(0, 3).map((course, index) => ({
    id: course.id,
    title: course.name,
    code: course.code || course.teacher,
    subtitle: course.teacher || course.department || "Course instructor",
    badge: course.progressPercent ? `${Math.round(course.progressPercent)}%` : "Not Started",
    tone: ["blue", "violet", "green"][index % 3],
    icon: ["fas fa-chart-line", "fas fa-code", "fas fa-brain"][index % 3],
    detailRows: [
      { label: "Lessons", value: course.totalLessons || 0 },
      { label: "Assignments", value: course.totalAssignments || 0 },
    ],
    progress: course.progressPercent || 0,
    progressLabel: course.progressPercent ? `${Math.round(course.progressPercent)}% completed` : "Ready to begin",
  })),
);

const studentTodoItems = computed(() => {
  const assignmentItems = upcomingAssignments.value.map((assignment) => ({
    id: `assignment-${assignment.id}`,
    title: assignment.name,
    subtitle: assignment.course,
    sortAt: assignment.dueDate || assignment.availableFrom || "",
    badge: relativeDueLabel(assignment.dueDate || assignment.availableFrom),
    badgeTone: relativeDueTone(assignment.dueDate || assignment.availableFrom),
  }));
  const quizItems = upcomingQuizzes.value.map((quiz) => ({
    id: `quiz-${quiz.id}`,
    title: quiz.name,
    subtitle: quiz.course,
    sortAt: quiz.deadline || quiz.availableFrom || "",
    badge: relativeDueLabel(quiz.deadline || quiz.availableFrom),
    badgeTone: relativeDueTone(quiz.deadline || quiz.availableFrom),
  }));
  return [...assignmentItems, ...quizItems]
    .sort((left, right) => timestampFor(left.sortAt) - timestampFor(right.sortAt) || left.title.localeCompare(right.title))
    .slice(0, 4);
});

const studentAnnouncementCards = computed(() =>
  store.announcements.slice(0, 4).map((announcement) => ({
    id: announcement.id,
    title: announcement.title,
    subtitle: announcement.course,
    date: formatDateShort(announcement.date),
  })),
);

const studentCalendarCards = computed(() =>
  sortEventsByDistance(store.calendarEvents).slice(0, 4).map((event) => ({
    id: event.id,
    title: event.title,
    subtitle: event.subtitle,
    time: formatTime(event.startsAt),
    rawDate: event.startsAt,
  })),
);

const studentProgressSegments = computed(() => [
  { label: "Completed", value: completedLessonCount.value, color: "#496A8A" },
  { label: "In Progress", value: inProgressLessonCount.value, color: "#A07A3D" },
  { label: "Not Started", value: notStartedLessonCount.value, color: "#C9C1B7" },
]);

const teacherAveragePerformance = computed(() => {
  const values = store.courses.map((course) => course.averagePercentage).filter((value) => value !== null && value !== undefined);
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
});

const teacherDashboardStats = computed(() => [
  { label: "Courses Teaching", value: store.courses.length, sub: "Active teaching portfolio", icon: "fas fa-book-open", tone: "violet" },
  { label: "Total Students", value: new Set(store.enrollments.map((row) => row.studentId)).size, sub: "Across your assigned courses", icon: "fas fa-users", tone: "cyan" },
  { label: "Pending Submissions", value: store.assignmentSubmissions.filter((row) => ["submitted", "late"].includes(row.status)).length, sub: "Ready for grading", icon: "fas fa-inbox", tone: "gold" },
  { label: "Average Class Performance", value: formatScore(teacherAveragePerformance.value), sub: "Across quizzes and assignments", icon: "fas fa-chart-line", tone: "green" },
]);

const teacherDashboardCourses = computed(() =>
  filteredCourses.value.slice(0, 3).map((course, index) => ({
    id: course.id,
    title: course.name,
    code: course.code || course.department || "Course",
    subtitle: `${studentCountsByCourse.value.get(course.id) || course.activeStudents || 0} students`,
    badge: course.status || "Active",
    tone: ["violet", "blue", "gold"][index % 3],
    icon: ["fas fa-book-open", "fas fa-user-graduate", "fas fa-microchip"][index % 3],
    detailRows: [
      { label: "Assignments", value: course.totalAssignments || 0 },
      { label: "Quizzes", value: course.totalQuizzes || 0 },
    ],
  })),
);

const teacherPendingAssignments = computed(() =>
  store.assignments
    .map((assignment) => ({
      id: assignment.id,
      title: assignment.name,
      subtitle: assignment.course,
      submitted: assignment.submissionCount || 0,
      pending: assignment.pendingCount || Math.max((studentCountsByCourse.value.get(assignment.courseId) || 0) - (assignment.submissionCount || 0), 0),
    }))
    .filter((row) => row.submitted || row.pending)
    .slice(0, 4),
);

const teacherPerformancePoints = computed(() =>
  filteredCourses.value
    .filter((course) => course.averagePercentage !== null && course.averagePercentage !== undefined)
    .slice(0, 6)
    .map((course, index) => ({
      label: course.code || `C${index + 1}`,
      value: Math.round(course.averagePercentage ?? course.completionRate ?? course.progressPercent ?? 0),
    })),
);

const teacherPerformanceDelta = computed(() => {
  if (teacherPerformancePoints.value.length < 2) return "No trend yet";
  const first = teacherPerformancePoints.value[0].value;
  const last = teacherPerformancePoints.value[teacherPerformancePoints.value.length - 1].value;
  const diff = Math.round(last - first);
  return diff >= 0 ? `+${diff}%` : `${diff}%`;
});

const teacherScheduleCards = computed(() =>
  sortEventsByDistance(store.calendarEvents).slice(0, 4).map((event) => ({
    id: event.id,
    title: event.title,
    subtitle: `${event.subtitle} · ${formatDateShort(event.startsAt)}`,
    time: formatTime(event.startsAt),
  })),
);

const teacherMessageCards = computed(() =>
  store.assignmentSubmissions.slice(0, 4).map((submission) => ({
    id: submission.id,
    sender: submission.studentName || "Student",
    excerpt: `Submitted ${submission.assignment}${submission.feedback ? ` · ${submission.feedback}` : ""}`,
    time: formatDateShort(submission.submittedOn || submission.updatedOn),
  })),
);

const adminStudents = computed(() => {
  if (store.availableStudents.length) {
    return store.availableStudents
      .filter((student) => includesSearch(student.name, student.email, student.login))
      .map((student) => ({
        id: student.id,
        name: student.name,
        subtitle: student.email || student.login || "Student account",
        meta: "Student",
        initials: initialsFor(student.name),
        createdAt: student.createdAt || student.updatedAt || student.lastLogin || "",
      }));
  }
  const seen = new Set();
  return store.enrollments
    .filter((enrollment) => {
      if (seen.has(enrollment.studentId)) return false;
      seen.add(enrollment.studentId);
      return includesSearch(enrollment.studentName, enrollment.course);
    })
    .map((enrollment) => ({
      id: enrollment.studentId,
      name: enrollment.studentName,
      subtitle: enrollment.course,
      meta: "Student",
      initials: initialsFor(enrollment.studentName),
    }));
});

const adminProfessors = computed(() => {
  const map = new Map();
  store.courses.forEach((course) => {
    const key = course.teacher || "Professor";
    if (!map.has(key) && includesSearch(key, course.department, course.term)) {
      map.set(key, {
        id: key,
        name: key,
        subtitle: course.department || "Faculty",
        meta: course.term || "Active",
        initials: initialsFor(key),
      });
    }
  });
  return Array.from(map.values());
});

const adminDepartments = computed(() => {
  const counts = new Map();
  store.courses.forEach((course) => {
    const key = course.department || "General Studies";
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return Array.from(counts.entries()).map(([name, count]) => ({
    id: name,
    name,
    subtitle: `${count} course${count === 1 ? "" : "s"}`,
    meta: "Department",
    initials: initialsFor(name),
  }));
});

const adminDashboardStats = computed(() => [
  { label: "Students Count", value: adminStudents.value.length, sub: "Registered on the portal", icon: "fas fa-user-graduate", tone: "green" },
  { label: "Professors Count", value: adminProfessors.value.length, sub: "Active teaching staff", icon: "fas fa-chalkboard-teacher", tone: "gold" },
  { label: "Courses Count", value: store.courses.length, sub: "Visible academic offerings", icon: "fas fa-book-open", tone: "blue" },
  { label: "Departments Count", value: adminDepartments.value.length, sub: "Structured academic units", icon: "fas fa-building-columns", tone: "cyan" },
]);

const adminAverageGrade = computed(() => {
  const values = [
    ...store.assignmentSubmissions
      .filter((submission) => submission.status === "graded" && submission.percentage !== null && submission.percentage !== undefined)
      .map((submission) => submission.percentage),
    ...store.quizResults
      .filter((result) => result.percentage !== null && result.percentage !== undefined)
      .map((result) => result.percentage),
  ];
  return averageOf(values);
});

const adminPublishedCourseCount = computed(() => store.courses.filter((course) => course.isPublished).length);
const adminHighCompletionCourseCount = computed(() => store.courses.filter((course) => (course.completionRate || 0) >= 80).length);
const adminGradedRecordCount = computed(
  () =>
    store.assignmentSubmissions.filter((submission) => submission.status === "graded").length +
    store.quizResults.length,
);

const adminAnalyticsCards = computed(() => [
  {
    label: "Active Enrollments",
    value: store.enrollments.length,
    delta: `${adminPublishedCourseCount.value} published course${adminPublishedCourseCount.value === 1 ? "" : "s"}`,
    icon: "fas fa-user-check",
  },
  {
    label: "Completion Rate",
    value: `${Math.round(averageOf(store.courses.map((course) => course.completionRate)) || 0)}%`,
    delta: `${adminHighCompletionCourseCount.value} course${adminHighCompletionCourseCount.value === 1 ? "" : "s"} above 80%`,
    icon: "fas fa-chart-pie",
  },
  {
    label: "Attendance Rate",
    value: `${Math.round(averageOf(store.courses.map((course) => course.attendanceRate)) || 0)}%`,
    delta: `${store.attendanceSessions.length} session${store.attendanceSessions.length === 1 ? "" : "s"} tracked`,
    icon: "fas fa-calendar-check",
  },
  {
    label: "Average Grade",
    value: formatScore(adminAverageGrade.value),
    delta: `${adminGradedRecordCount.value} graded record${adminGradedRecordCount.value === 1 ? "" : "s"}`,
    icon: "fas fa-star",
  },
]);

const adminRecentRegistrations = computed(() =>
  [...adminStudents.value]
    .sort((left, right) => timestampFor(right.createdAt) - timestampFor(left.createdAt))
    .slice(0, 4)
    .map((student) => ({
      ...student,
      meta: student.createdAt ? formatDateShort(student.createdAt) : "Student",
    })),
);

const adminSystemActivity = computed(() => {
  const rows = [
    ...store.announcements.slice(0, 3).map((announcement) => ({
      id: `announcement-${announcement.id}`,
      title: announcement.title,
      subtitle: `${announcement.course} announcement published`,
      meta: formatDateShort(announcement.date),
    })),
    ...store.assignments.slice(0, 3).map((assignment) => ({
      id: `assignment-${assignment.id}`,
      title: assignment.name,
      subtitle: `${assignment.course} assignment updated`,
      meta: assignment.dueDate ? formatDateShort(assignment.dueDate) : "Scheduled",
    })),
    ...store.attendanceSessions.slice(0, 2).map((session) => ({
      id: `attendance-${session.id}`,
      title: session.name,
      subtitle: `${session.course} attendance session ${session.status === "closed" ? "closed" : "opened"}`,
      meta: formatDateShort(session.sessionDate),
    })),
    ...store.quizResults.slice(0, 2).map((result) => ({
      id: `quiz-result-${result.id}`,
      title: result.quiz,
      subtitle: `${result.studentName || "Student"} completed ${result.quiz}`,
      meta: formatDateShort(result.date),
    })),
  ];
  return rows.slice(0, 5);
});

const adminReportBars = computed(() => [
  {
    label: "Enrollment",
    value: store.courses.length
      ? Math.round(
          (store.courses.filter((course) => (course.activeStudents || 0) > 0 || store.enrollments.some((enrollment) => enrollment.courseId === course.id)).length /
            store.courses.length) *
            100,
        )
      : 0,
  },
  { label: "Completion", value: Math.round(averageOf(store.courses.map((course) => course.completionRate)) || 0) },
  { label: "Attendance", value: Math.round(averageOf(store.courses.map((course) => course.attendanceRate)) || 0) },
  { label: "Performance", value: Math.round(adminAverageGrade.value || 0) },
]);

const selectedCourseCalendarCards = computed(() =>
  sortEventsByDistance(selectedCourseEvents.value).slice(0, 4).map((event) => ({
    id: event.id,
    title: event.title,
    subtitle: `${event.subtitle} · ${formatDateShort(event.startsAt)}`,
    type: event.type,
  })),
);

const resourceEntries = computed(() =>
  store.lessons
    .flatMap((lesson) => {
      const rows = [];
      if (lesson.downloadUrl) {
        rows.push({
          id: `file-${lesson.id}`,
          title: lesson.fileName || `${lesson.name} attachment`,
          subtitle: `${lesson.course} · downloadable material`,
          url: lesson.downloadUrl,
          icon: "fas fa-file-pdf",
        });
      }
      if (lesson.externalResourceUrl) {
        rows.push({
          id: `resource-${lesson.id}`,
          title: lesson.name,
          subtitle: `${lesson.course} · external resource`,
          url: lesson.externalResourceUrl,
          icon: "fas fa-link",
        });
      }
      if (lesson.videoUrl) {
        rows.push({
          id: `video-${lesson.id}`,
          title: lesson.name,
          subtitle: `${lesson.course} · video lecture`,
          url: lesson.videoUrl,
          icon: "fas fa-play-circle",
        });
      }
      if (!rows.length) {
        rows.push({
          id: `notes-${lesson.id}`,
          title: `${lesson.name} Notes`,
          subtitle: `${lesson.course} · ${lesson.moduleTitle || lesson.weekLabel || "lesson notes"}`,
          icon: "fas fa-book-reader",
          lessonId: lesson.id,
        });
      }
      return rows;
    })
    .filter((row) => includesSearch(row.title, row.subtitle)),
);

const studentMessageRows = computed(() =>
  store.notificationsFeed
    .filter((entry) => includesSearch(entry.title, entry.subtitle, entry.kind))
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      subtitle: entry.subtitle,
      meta: formatDateShort(entry.date),
      icon: entry.kind === "announcement" ? "fas fa-bullhorn" : "fas fa-bell",
      tag: entry.kind,
    })),
);

const discussionTiles = computed(() => [
  {
    title: "Ask your professor",
    description: "Start a thoughtful course discussion or request clarification on a topic.",
    copy: selectedCourse.value ? `Open a discussion for ${selectedCourse.value.name} or continue an existing thread.` : "Choose a course to start a discussion thread.",
    cta: "Open discussion",
    action: { type: "navigate", key: "discussion" },
    icon: "far fa-comments",
  },
  {
    title: "Peer collaboration",
    description: "Use study groups and course communities to keep learning social and productive.",
    copy: "Save key resources, respond to classmates, and keep ideas organized.",
    cta: "Open resources",
    action: { type: "navigate", key: "resources" },
    icon: "fas fa-users",
  },
]);

const helpTiles = computed(() => [
  {
    title: "Profile & Security",
    description: "Update your personal details and password whenever you need.",
    copy: "Everything account-related stays inside a clean portal settings page.",
    cta: "Open account",
    action: { type: "navigate", key: "account" },
    icon: "fas fa-user-cog",
  },
  {
    title: "Need LMS Support?",
    description: "Contact the university LMS team or review guidance for common issues.",
    copy: "Reach out if a file, grade, quiz, or attendance update looks wrong.",
    cta: "Open account",
    action: { type: "navigate", key: "account" },
    icon: "fas fa-life-ring",
  },
]);

const adminSettingsTiles = computed(() => [
  {
    title: isDemoMode.value ? "Open Settings Workspace" : "Open Odoo Settings",
    description: isDemoMode.value ? "Manage the demo LMS settings view directly inside this dashboard." : "Jump into full administrative configuration when you need backend control.",
    copy: isDemoMode.value ? "The GitHub Pages version stays fully self-contained, so settings open inside the demo workspace." : "Use the native admin console for technical settings and platform-wide changes.",
    cta: "Open settings",
    action: isDemoMode.value ? { type: "navigate", key: "settings" } : { type: "url", url: "/odoo/settings#xrevia_lms" },
    icon: "fas fa-sliders-h",
  },
  {
    title: isDemoMode.value ? "Review User Directory" : "Open Backend Dashboard",
    description: isDemoMode.value ? "Browse the demo user, student, and professor directories without leaving the static site." : "Continue deeper operational work in the backend app switcher.",
    copy: isDemoMode.value ? "This keeps the public demo working even without a live Odoo backend behind it." : "User management, reports, and advanced administration remain available there.",
    cta: isDemoMode.value ? "Open users" : "Open backend",
    action: isDemoMode.value ? { type: "navigate", key: "users" } : { type: "url", url: "/odoo" },
    icon: "fas fa-th-large",
  },
]);

const adminPermissionTiles = computed(() => [
  {
    title: "Role Governance",
    description: "Students, teachers, and admins now live in the same visual system with explicit role separation.",
    copy: "Use this area as the clear home for permission notes and governance reminders.",
    cta: "Open users",
    action: { type: "navigate", key: "users" },
    icon: "fas fa-user-shield",
  },
  {
    title: "LMS Visibility",
    description: "Website navigation visibility can still be managed from the LMS settings section.",
    copy: "Hide or show dashboard areas without deleting any academic data underneath.",
    cta: "Open settings",
    action: { type: "navigate", key: "settings" },
    icon: "fas fa-eye",
  },
]);

const listPageConfig = computed(() => {
  const roleKey = `${currentRole.value}:${activeNavKey.value}`;
  switch (roleKey) {
    case "student:messages":
      return {
        eyebrow: "Messages",
        title: "Notification Center",
        subtitle: "Announcements, reminders, and important academic alerts stay visible here.",
        panelTitle: "Recent Updates",
        panelSubtitle: "Everything important that reached your portal recently.",
        rows: studentMessageRows.value,
        badge: `${studentMessageRows.value.length} items`,
      };
    case "student:announcements":
      return {
        eyebrow: "Announcements",
        title: "Course Announcements",
        subtitle: "Read the latest academic updates from your instructors and courses.",
        panelTitle: "Published Announcements",
        panelSubtitle: "Recent announcements sorted from newest to oldest.",
        rows: store.announcements
          .filter((row) => includesSearch(row.title, row.message, row.course))
          .map((row) => ({
            id: row.id,
            title: row.title,
            subtitle: row.course,
            meta: formatDateShort(row.date),
            icon: "fas fa-bullhorn",
            tag: "Announcement",
          })),
        badge: `${store.announcements.length} updates`,
      };
    case "teacher:messages":
      return {
        eyebrow: "Messages",
        title: "Faculty Messages",
        subtitle: "Keep student communication, submissions, and feedback requests in one place.",
        panelTitle: "Recent Student Activity",
        panelSubtitle: "Submission notes and message-like activity from students.",
        rows: teacherMessageCards.value.map((row) => ({
          id: row.id,
          title: row.sender,
          subtitle: row.excerpt,
          meta: row.time,
          icon: "far fa-envelope",
          tag: "Student",
        })),
        badge: `${teacherMessageCards.value.length} updates`,
      };
    case "admin:users":
      return {
        eyebrow: "Users",
        title: "All Users",
        subtitle: "A combined operational view of students and professors currently visible in the LMS.",
        panelTitle: "University User Directory",
        panelSubtitle: "A clean list of active portal users derived from the LMS data.",
        rows: [...adminProfessors.value, ...adminStudents.value].slice(0, 20).map((row) => ({
          id: row.id,
          title: row.name,
          subtitle: row.subtitle,
          meta: row.meta,
          initials: row.initials,
          tag: row.meta,
        })),
        badge: `${adminProfessors.value.length + adminStudents.value.length} users`,
      };
    case "admin:students":
      return {
        eyebrow: "Students",
        title: "Student Directory",
        subtitle: "A student-only view for academic administration and monitoring.",
        panelTitle: "Active Students",
        panelSubtitle: "Recently active or visible student accounts in the LMS.",
        rows: adminStudents.value.map((row) => ({
          id: row.id,
          title: row.name,
          subtitle: row.subtitle,
          meta: row.meta,
          initials: row.initials,
          tag: "Student",
        })),
        badge: `${adminStudents.value.length} students`,
      };
    case "admin:professors":
      return {
        eyebrow: "Professors",
        title: "Professor Directory",
        subtitle: "A focused view of instructors currently represented across LMS courses.",
        panelTitle: "Active Professors",
        panelSubtitle: "Derived from assigned course ownership and teaching activity.",
        rows: adminProfessors.value.map((row) => ({
          id: row.id,
          title: row.name,
          subtitle: row.subtitle,
          meta: row.meta,
          initials: row.initials,
          tag: "Professor",
        })),
        badge: `${adminProfessors.value.length} professors`,
      };
    case "admin:departments":
      return {
        eyebrow: "Departments",
        title: "Departments",
        subtitle: "Academic structure grouped cleanly by department and course distribution.",
        panelTitle: "Department Overview",
        panelSubtitle: "A simple operational list of departments represented in LMS courses.",
        rows: adminDepartments.value.map((row) => ({
          id: row.id,
          title: row.name,
          subtitle: row.subtitle,
          meta: row.meta,
          initials: row.initials,
          tag: "Department",
        })),
        badge: `${adminDepartments.value.length} departments`,
      };
    default:
      return null;
  }
});

const resourcePageConfig = computed(() => {
  const roleKey = `${currentRole.value}:${activeNavKey.value}`;
  if (roleKey === "student:resources") {
    return {
      eyebrow: "Resources",
      title: "Course Resources",
      subtitle: "Lecture files, external readings, videos, and downloadable materials organized for quick access.",
      panelTitle: "Learning Materials",
      panelSubtitle: "Structured resources grouped from your visible lessons and course content.",
      rows: resourceEntries.value,
    };
  }
  return null;
});

const tilePageConfig = computed(() => {
  const roleKey = `${currentRole.value}:${activeNavKey.value}`;
  if (roleKey === "student:discussion") {
    return {
      eyebrow: "Discussion",
      title: "Course Discussion Space",
      subtitle: "A place to ask questions, keep conversations organized, and stay engaged academically.",
      tiles: discussionTiles.value,
    };
  }
  if (roleKey === "student:help-center") {
    return {
      eyebrow: "Help Center",
      title: "Help Center",
      subtitle: "Support resources, profile settings, and helpful next steps in one clear page.",
      tiles: helpTiles.value,
    };
  }
  if (roleKey === "admin:settings") {
    return {
      eyebrow: "Settings",
      title: "Administrative Settings",
      subtitle: "Quick links into the deeper system settings while keeping the same visual language on the website.",
      tiles: adminSettingsTiles.value,
    };
  }
  if (roleKey === "admin:permissions") {
    return {
      eyebrow: "Permissions",
      title: "Permissions & Role Rules",
      subtitle: "A high-level view of the LMS role governance, visibility, and permission structure.",
      tiles: adminPermissionTiles.value,
    };
  }
  return null;
});

const reportPageConfig = computed(() => {
  const roleKey = `${currentRole.value}:${activeNavKey.value}`;
  if (roleKey === "teacher:reports") {
    return {
      eyebrow: "Reports",
      title: "Teaching Reports",
      subtitle: "Monitor course health, submission flow, grading readiness, and attendance from one place.",
      primaryTitle: "Teaching Metrics",
      primarySubtitle: "The numbers that matter most to your current teaching load.",
      metrics: [
        { label: "Average Performance", value: formatScore(teacherAveragePerformance.value) },
        { label: "Pending Submissions", value: store.assignmentSubmissions.filter((row) => ["submitted", "late"].includes(row.status)).length },
        { label: "Attendance Sessions", value: store.attendanceSessions.length },
        { label: "Courses", value: store.courses.length },
      ],
      secondaryTitle: "Recent Teaching Activity",
      secondarySubtitle: "Submission activity and announcement flow at a glance.",
      rows: [
        ...teacherPendingAssignments.value.map((row) => ({
          id: `assignment-${row.id}`,
          title: row.title,
          subtitle: row.subtitle,
          meta: `${row.submitted} submitted`,
          tag: `${row.pending} pending`,
          icon: "fas fa-file-signature",
        })),
        ...teacherMessageCards.value.map((row) => ({
          id: `message-${row.id}`,
          title: row.sender,
          subtitle: row.excerpt,
          meta: row.time,
          tag: "Message",
          icon: "far fa-envelope",
        })),
      ].slice(0, 8),
    };
  }
  if (roleKey === "admin:reports" || roleKey === "admin:analytics") {
    return {
      eyebrow: roleKey === "admin:reports" ? "Reports" : "Analytics",
      title: roleKey === "admin:reports" ? "Administrative Reports" : "Administrative Analytics",
      subtitle: "A polished university-wide view of users, courses, departments, and operational performance.",
      primaryTitle: "University Metrics",
      primarySubtitle: "Summaries across enrollments, courses, attendance, and academic completion.",
      metrics: [
        { label: "Users", value: adminStudents.value.length + adminProfessors.value.length },
        { label: "Courses", value: store.courses.length },
        { label: "Attendance Rate", value: `${Math.round(averageOf(store.courses.map((course) => course.attendanceRate)) || 0)}%` },
        { label: "Completion Rate", value: `${Math.round(averageOf(store.courses.map((course) => course.completionRate)) || 0)}%` },
      ],
      secondaryTitle: "Operational Activity",
      secondarySubtitle: "Recent administrative movement happening across the platform.",
      rows: adminSystemActivity.value.map((row) => ({
        id: row.id,
        title: row.title,
        subtitle: row.subtitle,
        meta: row.meta,
        tag: "System",
        icon: "fas fa-circle",
      })),
    };
  }
  return null;
});

const syncAccountForm = () => {
  accountForm.value = {
    fullName: store.student.fullName || "",
    email: store.student.email || "",
    phone: store.student.phone || "",
  };
};

const syncNotificationForm = () => {
  notificationForm.value = {
    announcements: store.student.notifications?.announcements !== false,
    quizzes: store.student.notifications?.quizzes !== false,
    progress: store.student.notifications?.progress !== false,
  };
};

const resetPasswordForm = () => {
  passwordForm.value = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  };
};

const navigateTo = (key) => {
  if (key === "logout") {
    void logoutNow();
    return;
  }
  const item = navLookup.value[key] || hiddenItems.find((entry) => entry.key === key);
  if (!item) return;
  activeNavKey.value = key;
  if (item.kind === "workspace") {
    store.activePage = item.target;
  }
  if (key === "courses" && !selectedCourseId.value && filteredCourses.value.length) {
    selectedCourseId.value = filteredCourses.value[0].id;
  }
};

const resetWorkspaceUi = () => {
  searchQuery.value = "";
  activeNavKey.value = "dashboard";
  selectedCourseId.value = null;
  selectedQuizId.value = null;
  quizAnswers.value = {};
  quizFeedback.value = { type: "", message: "" };
};

const toggleThemeMode = () => {
  themeMode.value = themeMode.value === "dark" ? "light" : "dark";
};

const handleTopbarAction = async (action) => {
  if (action.action === "toggle-theme") {
    toggleThemeMode();
    return;
  }
  if (action.action === "switch-account") {
    resetWorkspaceUi();
    await store.logoutDemo();
    return;
  }
  if (action.action === "backend") {
    window.location.href = "/odoo";
    return;
  }
  if (action.action === "backend-settings") {
    window.location.href = "/odoo/settings#xrevia_lms";
    return;
  }
  if (action.action === "settings") {
    navigateTo("settings");
    return;
  }
  if (action.action === "reports") {
    navigateTo(currentRole.value === "teacher" ? "reports" : "calendar");
    return;
  }
  navigateTo(action.action);
};

const selectCourse = (courseId) => {
  selectedCourseId.value = courseId;
};

const openCourse = (courseId) => {
  selectedCourseId.value = courseId;
  navigateTo("courses");
};

const handleCourseWorkspaceAction = (action) => {
  if (action === "course-settings") {
    navigateTo("assignments");
    return;
  }
  if (action === "lesson-builder") {
    store.activePage = "lessons";
    activeNavKey.value = "courses";
    return;
  }
  if (action === "roster") {
    activeNavKey.value = currentRole.value === "teacher" ? "students" : "courses";
    store.activePage = "enrollments";
    return;
  }
  if (action === "gradebook") {
    activeNavKey.value = currentRole.value === "teacher" ? "gradebook" : "courses";
    store.activePage = "quiz-results";
  }
};

const handleTeacherQuickAction = (action) => {
  if (action === "upload-material") {
    activeNavKey.value = "courses";
    store.activePage = "lessons";
    return;
  }
  if (action === "create-assignment") {
    navigateTo("assignments");
    return;
  }
  if (action === "take-attendance") {
    navigateTo("attendance");
    return;
  }
  if (action === "create-quiz") {
    navigateTo("quizzes");
  }
};

const handleAdminQuickAction = (action) => {
  if (action === "add-user") {
    navigateTo("users");
    return;
  }
  if (action === "create-course") {
    navigateTo("courses");
    return;
  }
  if (action === "manage-departments") {
    navigateTo("departments");
    return;
  }
  if (action === "generate-report") {
    navigateTo("reports");
  }
};

const handleTileAction = (tile) => {
  if (!tile?.action) return;
  if (tile.action.type === "navigate") {
    navigateTo(tile.action.key);
    return;
  }
  if (tile.action.type === "url") {
    window.location.href = tile.action.url;
  }
};

const assignmentDraft = (assignment) => {
  if (!assignmentDrafts[assignment.id]) {
    assignmentDrafts[assignment.id] = {
      submissionText: assignment.ownSubmission?.submissionText || "",
      fileBase64: "",
      fileName: "",
    };
  }
  return assignmentDrafts[assignment.id];
};

const setAssignmentFeedback = (assignmentId, type, message) => {
  assignmentFeedback[assignmentId] = { type, message };
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });

const handleAssignmentFileSelected = async (assignment, event) => {
  const file = event.target?.files?.[0];
  if (!file) return;
  try {
    const dataUrl = await readFileAsDataUrl(file);
    const draft = assignmentDraft(assignment);
    draft.fileBase64 = dataUrl;
    draft.fileName = file.name;
    setAssignmentFeedback(assignment.id, "success", `${file.name} is ready to upload.`);
  } catch (error) {
    setAssignmentFeedback(assignment.id, "error", error?.message || "Could not read the selected assignment file.");
  } finally {
    if (event.target) event.target.value = "";
  }
};

const submitAssignmentNow = async (assignment) => {
  assignmentSubmittingId.value = assignment.id;
  setAssignmentFeedback(assignment.id, "", "");
  try {
    const payload = await store.submitAssignment(assignment.id, assignmentDraft(assignment));
    assignmentDraft(assignment).fileBase64 = "";
    assignmentDraft(assignment).fileName = "";
    setAssignmentFeedback(assignment.id, "success", payload?.message || "Assignment submitted successfully.");
  } catch (error) {
    setAssignmentFeedback(assignment.id, "error", error?.message || "Could not submit the assignment.");
  } finally {
    assignmentSubmittingId.value = null;
  }
};

const openLesson = async (lessonId) => {
  const lesson = store.lessons.find((entry) => entry.id === lessonId);
  if (!lesson) return;
  navigateTo("courses");
  try {
    await store.trackLesson(lesson.id, lesson.started ? "progress" : "open", lesson.started ? Math.max(lesson.progressPercent || 0, 35) : 15);
  } catch (error) {
    console.warn(error);
  }
};

const openQuiz = (quizId) => {
  const quiz = store.quizzes.find((entry) => entry.id === quizId);
  if (!quiz) return;
  if (!quiz.canTake) {
    quizFeedback.value = {
      type: "error",
      message: quiz.closedReason || "This quiz is not currently available.",
    };
    selectedQuizId.value = null;
    navigateTo("assignments");
    return;
  }
  navigateTo("assignments");
  selectedQuizId.value = quizId;
  quizAnswers.value = {};
  quizFeedback.value = { type: "", message: "" };
};

const cancelQuiz = () => {
  selectedQuizId.value = null;
  quizAnswers.value = {};
  quizFeedback.value = { type: "", message: "" };
};

const chooseAnswer = (questionId, optionKey) => {
  quizAnswers.value = {
    ...quizAnswers.value,
    [questionId]: optionKey,
  };
};

const submitSelectedQuiz = async () => {
  if (!selectedQuiz.value) return;
  const missingAnswer = selectedQuizQuestions.value.some((question) => !quizAnswers.value[question.id]);
  if (missingAnswer) {
    quizFeedback.value = { type: "error", message: "Please answer every question before submitting." };
    return;
  }

  quizSubmitting.value = true;
  quizFeedback.value = { type: "", message: "" };
  try {
    const submission = await store.submitQuiz(selectedQuiz.value.id, quizAnswers.value);
    quizFeedback.value = {
      type: "success",
      message: `Quiz submitted. You scored ${formatScore(submission.score)} (${submission.correct_count}/${submission.total_count} correct).`,
    };
    selectedQuizId.value = null;
    quizAnswers.value = {};
    navigateTo("grades");
  } catch (error) {
    quizFeedback.value = { type: "error", message: error?.message || "Could not submit the quiz." };
  } finally {
    quizSubmitting.value = false;
  }
};

const triggerAvatarPicker = () => avatarInput.value?.click();

const handleAvatarSelected = async (event) => {
  const file = event.target?.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    accountFeedback.value = { type: "error", message: "Please choose an image file for your profile photo." };
    event.target.value = "";
    return;
  }
  avatarUploading.value = true;
  accountFeedback.value = { type: "", message: "" };
  try {
    const imageBase64 = await readFileAsDataUrl(file);
    const payload = await store.updateAvatar(imageBase64, false);
    accountFeedback.value = { type: "success", message: payload?.message || "Profile photo updated." };
  } catch (error) {
    accountFeedback.value = { type: "error", message: error?.message || "Could not update your profile photo." };
  } finally {
    avatarUploading.value = false;
    event.target.value = "";
  }
};

const removeAvatar = async () => {
  avatarUploading.value = true;
  accountFeedback.value = { type: "", message: "" };
  try {
    const payload = await store.updateAvatar(null, true);
    accountFeedback.value = { type: "success", message: payload?.message || "Profile photo removed." };
  } catch (error) {
    accountFeedback.value = { type: "error", message: error?.message || "Could not remove your profile photo." };
  } finally {
    avatarUploading.value = false;
  }
};

const saveAccountSettings = async () => {
  if (!accountForm.value.fullName.trim()) {
    accountFeedback.value = { type: "error", message: "Full name is required." };
    return;
  }
  accountSaving.value = true;
  accountFeedback.value = { type: "", message: "" };
  try {
    const payload = await store.updateProfile({ ...accountForm.value, notifications: notificationForm.value });
    accountFeedback.value = { type: "success", message: payload?.message || "Account settings updated." };
    syncAccountForm();
    syncNotificationForm();
  } catch (error) {
    accountFeedback.value = { type: "error", message: error?.message || "Could not update your account settings." };
  } finally {
    accountSaving.value = false;
  }
};

const saveNotificationPreferences = async () => {
  notificationSaving.value = true;
  notificationFeedback.value = { type: "", message: "" };
  try {
    const payload = await store.updateProfile({ ...accountForm.value, notifications: notificationForm.value });
    notificationFeedback.value = { type: "success", message: payload?.message || "Notification preferences updated." };
    syncNotificationForm();
  } catch (error) {
    notificationFeedback.value = { type: "error", message: error?.message || "Could not save notification preferences." };
  } finally {
    notificationSaving.value = false;
  }
};

const savePasswordChange = async () => {
  if (!passwordForm.value.currentPassword || !passwordForm.value.newPassword || !passwordForm.value.confirmPassword) {
    passwordFeedback.value = { type: "error", message: "Please complete all password fields." };
    return;
  }
  if (passwordForm.value.newPassword.length < 8) {
    passwordFeedback.value = { type: "error", message: "Your new password should be at least 8 characters long." };
    return;
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordFeedback.value = { type: "error", message: "The new password and confirmation do not match." };
    return;
  }
  passwordSaving.value = true;
  passwordFeedback.value = { type: "", message: "" };
  try {
    const payload = await store.changePassword(passwordForm.value.currentPassword, passwordForm.value.newPassword);
    passwordFeedback.value = { type: "success", message: payload?.message || "Password updated successfully." };
    resetPasswordForm();
  } catch (error) {
    passwordFeedback.value = { type: "error", message: error?.message || "Could not update your password." };
  } finally {
    passwordSaving.value = false;
  }
};

const loginDemoAccount = async (userId) => {
  resetWorkspaceUi();
  await store.loginDemo(userId);
};

const logoutNow = async () => {
  if (isDemoMode.value) {
    resetWorkspaceUi();
    await store.logoutDemo();
    return;
  }
  window.location.href = "/web/session/logout?redirect=/web/login";
};

const calendarIcon = (type) => {
  if (type === "assignment") return "fas fa-file-signature";
  if (type === "quiz") return "fas fa-clipboard-list";
  if (type === "attendance") return "fas fa-user-check";
  return "fas fa-bullhorn";
};

const attendanceStatusTone = (status) => {
  if (status === "present") return "success";
  if (status === "late") return "warning";
  if (status === "absent") return "danger";
  return "neutral";
};

const timestampFor = (value) => {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const stamp = new Date(value).getTime();
  return Number.isNaN(stamp) ? Number.MAX_SAFE_INTEGER : stamp;
};

const formatScore = (value) => {
  if (value === undefined || value === null || value === "") return "—";
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${Math.round(numeric * 10) / 10}%` : String(value);
};

const formatProgress = (value) => {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? `${Math.round(numeric)}%` : "0%";
};

const formatDate = (value) => {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const formatDateShort = (value) => {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
};

const formatTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
};

const relativeDueLabel = (value) => {
  if (!value) return "Open";
  const diff = Math.ceil((new Date(value).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (diff <= 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  return `Due in ${diff} days`;
};

const relativeDueTone = (value) => {
  if (!value) return "neutral";
  const diff = Math.ceil((new Date(value).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (diff <= 1) return "urgent";
  if (diff <= 3) return "soon";
  return "calm";
};

const averageOf = (values) => {
  const filtered = values.filter((value) => value !== null && value !== undefined && Number.isFinite(Number(value)));
  if (!filtered.length) return null;
  return filtered.reduce((sum, value) => sum + Number(value), 0) / filtered.length;
};

const initialsFor = (value) =>
  String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "XL";

const applyBodyTheme = (mode) => {
  if (typeof document === "undefined") return;
  document.body.classList.toggle("xrevia-theme-dark", mode === "dark");
  document.body.classList.toggle("xrevia-theme-light", mode !== "dark");
};

watch(themeMode, (mode) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  }
  applyBodyTheme(mode);
});

watch(isSidebarCollapsed, (value) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, value ? "true" : "false");
  }
});

watch(
  () => visibleSections.value,
  (sections) => {
    const visibleKeys = new Set(sections.flatMap((section) => section.items.map((item) => item.key)));
    if (activeNavKey.value === "account") return;
    if (!visibleKeys.has(activeNavKey.value)) {
      activeNavKey.value = sections[0]?.items[0]?.key || "dashboard";
    }
  },
  { immediate: true, deep: true },
);

watch(
  () => filteredCourses.value,
  (courses) => {
    if (!courses.length) {
      selectedCourseId.value = null;
      return;
    }
    if (!selectedCourseId.value || !store.courses.some((course) => course.id === selectedCourseId.value)) {
      selectedCourseId.value = courses[0].id;
    }
  },
  { immediate: true, deep: true },
);

watch(
  () => store.student,
  () => {
    syncAccountForm();
    syncNotificationForm();
  },
  { immediate: true, deep: true },
);

onMounted(() => {
  if (typeof window !== "undefined") {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const storedSidebarState = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (storedTheme === "dark" || storedTheme === "light") {
      themeMode.value = storedTheme;
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      themeMode.value = "dark";
    }
    if (storedSidebarState === "true" || storedSidebarState === "false") {
      isSidebarCollapsed.value = storedSidebarState === "true";
    }
  }
  applyBodyTheme(themeMode.value);
  store.load();
});
</script>

<style scoped>
:global(body) {
  margin: 0;
  font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #f7f5f1;
  color: #2b2b2b;
  transition: background 0.25s ease, color 0.25s ease;
}

:global(body.xrevia-theme-light) {
  background: linear-gradient(180deg, #f7f5f1 0%, #faf8f4 100%);
  color: #2b2b2b;
}

:global(body.xrevia-theme-dark) {
  background: linear-gradient(180deg, #151311 0%, #1d1a17 100%);
  color: #f4ede3;
}

:global(*) {
  box-sizing: border-box;
}

.reference-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr);
  gap: 22px;
  padding: 22px;
  background: linear-gradient(180deg, var(--page-bg-start) 0%, var(--page-bg-end) 100%);
  color: var(--text-primary);
  transition: background 0.25s ease, color 0.25s ease;
  --page-bg-start: #f7f5f1;
  --page-bg-end: #faf8f4;
  --surface-shell: rgba(255, 252, 248, 0.92);
  --surface-elevated: rgba(255, 253, 249, 0.88);
  --surface-card: #ffffff;
  --surface-muted: #fcfbf8;
  --surface-quiet: #f2ede5;
  --border-subtle: 1px solid rgba(122, 118, 111, 0.12);
  --border-strong: 1px solid rgba(122, 118, 111, 0.18);
  --shadow-soft: 0 18px 44px rgba(33, 27, 22, 0.06);
  --shadow-large: 0 30px 80px rgba(33, 27, 22, 0.09);
  --text-primary: #2b2b2b;
  --text-secondary: #7a766f;
  --text-muted: #8a867e;
  --text-quiet: #a59f96;
  --sidebar-start: #0b1d36;
  --sidebar-end: #142c4d;
  --sidebar-hover: rgba(255, 248, 238, 0.08);
  --sidebar-active-bg: linear-gradient(180deg, rgba(73, 106, 138, 0.34) 0%, rgba(73, 106, 138, 0.22) 100%);
  --sidebar-active-ring: inset 0 0 0 1px rgba(140, 166, 191, 0.22);
  --sidebar-badge-bg: #496a8a;
  --accent-strong: #496a8a;
  --accent-soft: rgba(73, 106, 138, 0.14);
  --accent-tint: #6f88a1;
  --accent-border: rgba(73, 106, 138, 0.24);
  --accent-shadow: rgba(73, 106, 138, 0.12);
  --status-danger-bg: #efe1d9;
  --status-danger-text: #8c594d;
  --status-warning-bg: #efe4cf;
  --status-warning-text: #8f6c35;
  --status-success-bg: #e2e9e3;
  --status-success-text: #516956;
  --status-neutral-bg: #ece6de;
  --status-neutral-text: #73695d;
  --alert-danger-bg: #f4e3dc;
  --alert-danger-text: #91584b;
  --alert-info-bg: #e8eeef;
  --alert-info-text: #496a8a;
  --overlay-icon-bg: rgba(255, 250, 243, 0.16);
  --overlay-badge-bg: rgba(18, 20, 24, 0.22);
  --tone-blue-bg-start: #f3f5f7;
  --tone-blue-bg-end: #fcfbf8;
  --tone-blue-icon-bg: rgba(49, 78, 110, 0.14);
  --tone-blue-icon: #314e6e;
  --tone-cyan-bg-start: #f2f4f3;
  --tone-cyan-bg-end: #fcfbf8;
  --tone-cyan-icon-bg: rgba(95, 125, 104, 0.14);
  --tone-cyan-icon: #5f7d68;
  --tone-gold-bg-start: #f7f1e6;
  --tone-gold-bg-end: #fcfbf8;
  --tone-gold-icon-bg: rgba(160, 122, 61, 0.16);
  --tone-gold-icon: #a07a3d;
  --tone-violet-bg-start: #f3ede7;
  --tone-violet-bg-end: #fcfbf8;
  --tone-violet-icon-bg: rgba(90, 64, 48, 0.14);
  --tone-violet-icon: #5a4030;
  --tone-green-bg-start: #eef4ef;
  --tone-green-bg-end: #fcfbf8;
  --tone-green-icon-bg: rgba(95, 125, 104, 0.16);
  --tone-green-icon: #5f7d68;
  --course-blue-start: #22364f;
  --course-blue-end: #395874;
  --course-violet-start: #5b4639;
  --course-violet-end: #7a604f;
  --course-green-start: #294136;
  --course-green-end: #4c6a58;
  --course-gold-start: #7d5f37;
  --course-gold-end: #a5834a;
  --chart-grid: rgba(122, 118, 111, 0.18);
}

.reference-shell--teacher {
  --sidebar-start: #3a2a1f;
  --sidebar-end: #5a4030;
  --sidebar-active-bg: linear-gradient(180deg, rgba(160, 122, 61, 0.34) 0%, rgba(160, 122, 61, 0.2) 100%);
  --sidebar-active-ring: inset 0 0 0 1px rgba(208, 183, 131, 0.2);
  --sidebar-badge-bg: #a07a3d;
  --accent-strong: #a07a3d;
  --accent-soft: rgba(160, 122, 61, 0.16);
  --accent-tint: #b08a47;
  --accent-border: rgba(160, 122, 61, 0.24);
  --accent-shadow: rgba(160, 122, 61, 0.14);
}

.reference-shell--admin {
  --sidebar-start: #173828;
  --sidebar-end: #24513b;
  --sidebar-active-bg: linear-gradient(180deg, rgba(95, 125, 104, 0.36) 0%, rgba(95, 125, 104, 0.22) 100%);
  --sidebar-active-ring: inset 0 0 0 1px rgba(145, 173, 155, 0.2);
  --sidebar-badge-bg: #5f7d68;
  --accent-strong: #5f7d68;
  --accent-soft: rgba(95, 125, 104, 0.16);
  --accent-tint: #6f8c75;
  --accent-border: rgba(95, 125, 104, 0.24);
  --accent-shadow: rgba(95, 125, 104, 0.14);
}

.reference-shell--dark {
  --page-bg-start: #151311;
  --page-bg-end: #1d1a17;
  --surface-shell: rgba(31, 27, 23, 0.96);
  --surface-elevated: rgba(39, 34, 30, 0.94);
  --surface-card: #241f1b;
  --surface-muted: #2b2520;
  --surface-quiet: #342d27;
  --border-subtle: 1px solid rgba(231, 223, 214, 0.08);
  --border-strong: 1px solid rgba(231, 223, 214, 0.14);
  --shadow-soft: 0 18px 44px rgba(0, 0, 0, 0.28);
  --shadow-large: 0 30px 80px rgba(0, 0, 0, 0.36);
  --text-primary: #f4ede3;
  --text-secondary: #c5bcaf;
  --text-muted: #a59c90;
  --text-quiet: #8d8479;
  --sidebar-start: #081426;
  --sidebar-end: #10213b;
  --sidebar-hover: rgba(255, 248, 238, 0.06);
  --sidebar-active-bg: linear-gradient(180deg, rgba(111, 136, 161, 0.26) 0%, rgba(111, 136, 161, 0.16) 100%);
  --sidebar-active-ring: inset 0 0 0 1px rgba(187, 201, 216, 0.12);
  --sidebar-badge-bg: #6f88a1;
  --accent-strong: #6f88a1;
  --accent-soft: rgba(111, 136, 161, 0.22);
  --accent-tint: #94a9bd;
  --accent-border: rgba(111, 136, 161, 0.28);
  --accent-shadow: rgba(0, 0, 0, 0.26);
  --status-danger-bg: #4a2d27;
  --status-danger-text: #efc1b4;
  --status-warning-bg: #4d3a22;
  --status-warning-text: #e7c98c;
  --status-success-bg: #24352b;
  --status-success-text: #b4d1bc;
  --status-neutral-bg: #3a322b;
  --status-neutral-text: #d0c6b9;
  --alert-danger-bg: #4a2d27;
  --alert-danger-text: #f0c3b8;
  --alert-info-bg: #24313a;
  --alert-info-text: #c8d9e7;
  --overlay-icon-bg: rgba(255, 245, 235, 0.1);
  --overlay-badge-bg: rgba(255, 245, 235, 0.12);
  --tone-blue-bg-start: #2c343c;
  --tone-blue-bg-end: #241f1b;
  --tone-blue-icon-bg: rgba(111, 136, 161, 0.18);
  --tone-blue-icon: #9ab1c8;
  --tone-cyan-bg-start: #293129;
  --tone-cyan-bg-end: #241f1b;
  --tone-cyan-icon-bg: rgba(111, 140, 117, 0.2);
  --tone-cyan-icon: #a5bead;
  --tone-gold-bg-start: #382d1f;
  --tone-gold-bg-end: #241f1b;
  --tone-gold-icon-bg: rgba(176, 138, 71, 0.22);
  --tone-gold-icon: #d3b37d;
  --tone-violet-bg-start: #32271f;
  --tone-violet-bg-end: #241f1b;
  --tone-violet-icon-bg: rgba(145, 112, 92, 0.2);
  --tone-violet-icon: #c4a693;
  --tone-green-bg-start: #263127;
  --tone-green-bg-end: #241f1b;
  --tone-green-icon-bg: rgba(111, 140, 117, 0.22);
  --tone-green-icon: #b3c8b9;
  --course-blue-start: #182737;
  --course-blue-end: #2f465d;
  --course-violet-start: #3b2d25;
  --course-violet-end: #604a3d;
  --course-green-start: #1b3027;
  --course-green-end: #355242;
  --course-gold-start: #5d4728;
  --course-gold-end: #84673c;
  --chart-grid: rgba(197, 188, 175, 0.16);
}

.reference-shell--dark.reference-shell--teacher {
  --sidebar-start: #241b15;
  --sidebar-end: #35271e;
  --sidebar-active-bg: linear-gradient(180deg, rgba(176, 138, 71, 0.24) 0%, rgba(176, 138, 71, 0.16) 100%);
  --sidebar-active-ring: inset 0 0 0 1px rgba(223, 196, 143, 0.12);
  --sidebar-badge-bg: #b08a47;
  --accent-strong: #b08a47;
  --accent-soft: rgba(176, 138, 71, 0.2);
  --accent-tint: #d3b37d;
  --accent-border: rgba(176, 138, 71, 0.28);
  --accent-shadow: rgba(0, 0, 0, 0.28);
}

.reference-shell--dark.reference-shell--admin {
  --sidebar-start: #11281d;
  --sidebar-end: #173828;
  --sidebar-active-bg: linear-gradient(180deg, rgba(111, 140, 117, 0.24) 0%, rgba(111, 140, 117, 0.16) 100%);
  --sidebar-active-ring: inset 0 0 0 1px rgba(181, 205, 188, 0.12);
  --sidebar-badge-bg: #6f8c75;
  --accent-strong: #6f8c75;
  --accent-soft: rgba(111, 140, 117, 0.2);
  --accent-tint: #aac0b0;
  --accent-border: rgba(111, 140, 117, 0.28);
  --accent-shadow: rgba(0, 0, 0, 0.28);
}

.reference-shell--sidebar-collapsed {
  grid-template-columns: 92px minmax(0, 1fr);
}

.reference-sidebar {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px 18px 18px;
  border-radius: 28px;
  background: linear-gradient(180deg, var(--sidebar-start) 0%, var(--sidebar-end) 100%);
  color: #fffaf4;
  box-shadow: var(--shadow-large);
  transition: padding 0.22s ease, gap 0.22s ease, border-radius 0.22s ease;
}

.reference-sidebar__toggle {
  position: absolute;
  top: 24px;
  right: -16px;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-card);
  color: var(--accent-strong);
  box-shadow: var(--shadow-soft);
  cursor: pointer;
  z-index: 3;
  transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.reference-sidebar__toggle:hover {
  transform: translateX(2px);
}

.reference-sidebar.is-collapsed {
  padding-inline: 12px;
  gap: 16px;
}

.reference-sidebar.is-collapsed .reference-brand {
  justify-content: center;
  padding-right: 10px;
}

.reference-sidebar.is-collapsed .reference-brand > div,
.reference-sidebar.is-collapsed .reference-profile__name,
.reference-sidebar.is-collapsed .reference-profile__role,
.reference-sidebar.is-collapsed .reference-nav__title,
.reference-sidebar.is-collapsed .reference-nav__item span,
.reference-sidebar.is-collapsed .reference-nav__item small,
.reference-sidebar.is-collapsed .reference-logout span {
  display: none;
}

.reference-sidebar.is-collapsed .reference-profile {
  padding: 12px 8px;
}

.reference-sidebar.is-collapsed .reference-profile__avatar {
  width: 52px;
  height: 52px;
  border-radius: 18px;
}

.reference-sidebar.is-collapsed .reference-nav__item,
.reference-sidebar.is-collapsed .reference-logout {
  justify-content: center;
  padding-inline: 0;
}

.reference-sidebar.is-collapsed .reference-nav__item i,
.reference-sidebar.is-collapsed .reference-logout i {
  width: auto;
  font-size: 16px;
}

.reference-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.reference-brand__logo {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.reference-brand__title {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.reference-brand__subtitle {
  margin-top: 4px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.72);
}

.reference-profile {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 18px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.reference-profile__avatar,
.reference-user-chip__avatar {
  width: 68px;
  height: 68px;
  border-radius: 22px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
  color: #fffaf4;
  font-weight: 800;
}

.reference-user-chip__avatar {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  color: var(--text-primary);
  background: var(--accent-soft);
}

.reference-profile__avatar img,
.reference-user-chip__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.reference-profile__name {
  font-size: 16px;
  font-weight: 700;
}

.reference-profile__role {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
}

.reference-nav {
  display: flex;
  flex-direction: column;
  gap: 18px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.reference-nav__section {
  display: grid;
  gap: 8px;
}

.reference-nav__title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.46);
  padding-inline: 10px;
}

.reference-nav__item,
.reference-logout {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: none;
  border-radius: 16px;
  background: transparent;
  color: #f8fafc;
  font-size: 13px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}

.reference-nav__item i,
.reference-logout i {
  width: 16px;
}

.reference-nav__item:hover,
.reference-logout:hover {
  background: var(--sidebar-hover);
}

.reference-nav__item.is-active {
  background: var(--sidebar-active-bg);
  box-shadow: var(--sidebar-active-ring);
}

.reference-nav__item small {
  margin-left: auto;
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--sidebar-badge-bg);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}

.reference-main {
  min-width: 0;
  display: grid;
  gap: 18px;
}

.reference-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
}

.reference-search {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-radius: 22px;
  background: var(--surface-elevated);
  border: var(--border-subtle);
  box-shadow: var(--shadow-soft);
}

.reference-search i {
  color: var(--text-quiet);
}

.reference-search input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 14px;
  outline: none;
  color: var(--text-primary);
}

.reference-topbar__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.reference-icon-btn {
  position: relative;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 16px;
  background: var(--surface-elevated);
  color: var(--status-neutral-text);
  font-size: 16px;
  cursor: pointer;
  box-shadow: var(--shadow-soft);
}

.reference-icon-btn__count {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--status-danger-text);
  color: #fffaf4;
  font-size: 10px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.reference-user-chip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px 8px 8px;
  border: none;
  border-radius: 20px;
  background: var(--surface-elevated);
  box-shadow: var(--shadow-soft);
  cursor: pointer;
}

.reference-user-chip strong {
  display: block;
  color: var(--text-primary);
  font-size: 13px;
}

.reference-user-chip small {
  display: block;
  margin-top: 3px;
  color: var(--text-secondary);
  font-size: 11px;
}

.reference-user-chip i {
  color: var(--text-quiet);
}

.reference-surface {
  min-height: calc(100vh - 90px);
  background: var(--surface-shell);
  border-radius: 30px;
  border: var(--border-subtle);
  box-shadow: var(--shadow-large);
  padding: 28px;
  overflow: hidden;
}

.reference-alert {
  margin-bottom: 18px;
  padding: 14px 16px;
  border-radius: 16px;
  background: var(--alert-danger-bg);
  color: var(--alert-danger-text);
  font-size: 14px;
}

.reference-alert--info {
  background: var(--alert-info-bg);
  color: var(--alert-info-text);
}

.reference-page {
  display: grid;
  gap: 22px;
}

.reference-page__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
}

.reference-page__eyebrow {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--accent-strong);
}

.reference-page__title {
  margin: 10px 0 0;
  font-size: 34px;
  line-height: 1.05;
  letter-spacing: -0.04em;
  color: var(--text-primary);
}

.reference-page__subtitle {
  margin: 10px 0 0;
  max-width: 760px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-secondary);
}

.reference-page__badge {
  padding: 10px 14px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 700;
}

.reference-page__grid {
  display: grid;
  gap: 18px;
}

.reference-page__grid--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.stack-list,
.stack-panels {
  display: grid;
  gap: 16px;
}

.assignment-card,
.quiz-selector__item,
.list-row,
.resource-row,
.tile-card,
.metric-box {
  border-radius: 20px;
  border: var(--border-subtle);
  background: var(--surface-muted);
}

.assignment-card,
.tile-card {
  padding: 16px;
}

.assignment-card__head,
.quiz-session__head,
.inline-actions,
.quiz-session__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.assignment-card h3,
.quiz-session h3 {
  margin: 0;
  font-size: 18px;
  color: var(--text-primary);
}

.assignment-card p,
.quiz-session p {
  margin: 6px 0 0;
  color: var(--text-secondary);
  font-size: 12px;
}

.assignment-card__copy {
  margin-top: 12px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-secondary);
}

.assignment-card__meta {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: var(--text-muted);
}

.field {
  display: grid;
  gap: 8px;
}

.field span {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
}

.field input,
.field textarea {
  width: 100%;
  border: var(--border-strong);
  border-radius: 16px;
  background: var(--surface-card);
  padding: 12px 14px;
  font-size: 14px;
  color: var(--text-primary);
  outline: none;
}

.primary-action,
.secondary-action,
.link-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}

.primary-action {
  border: none;
  background: var(--accent-strong);
  color: #fffaf4;
  cursor: pointer;
}

.primary-action:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.secondary-action {
  border: var(--border-strong);
  background: var(--surface-card);
  color: var(--text-secondary);
  cursor: pointer;
}

.link-chip {
  border: var(--border-strong);
  background: var(--surface-card);
  color: var(--text-secondary);
}

.inline-alert {
  padding: 12px 14px;
  border-radius: 14px;
  font-size: 13px;
}

.inline-alert.is-success {
  background: var(--status-success-bg);
  color: var(--status-success-text);
}

.inline-alert.is-danger {
  background: var(--alert-danger-bg);
  color: var(--alert-danger-text);
}

.quiz-selector {
  display: grid;
  gap: 10px;
}

.quiz-selector__item,
.list-row,
.resource-row {
  width: 100%;
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
}

.quiz-selector__item {
  text-align: left;
  cursor: pointer;
}

.quiz-selector__item.is-active {
  border-color: var(--accent-border);
  box-shadow: 0 12px 28px var(--accent-shadow);
}

.quiz-selector__item strong,
.list-row__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.quiz-selector__item small,
.list-row__sub {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.quiz-session {
  display: grid;
  gap: 16px;
}

.quiz-question {
  padding: 16px;
  border-radius: 20px;
  background: var(--surface-muted);
  border: var(--border-subtle);
}

.quiz-question__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.quiz-option {
  margin-top: 12px;
  display: grid;
  grid-template-columns: auto auto 1fr;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 16px;
  background: var(--surface-card);
  border: var(--border-strong);
  cursor: pointer;
}

.quiz-option span {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-quiet);
}

.quiz-option strong {
  font-size: 13px;
  color: var(--text-primary);
}

.status-badge {
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.status-badge--success {
  background: var(--status-success-bg);
  color: var(--status-success-text);
}

.status-badge--danger {
  background: var(--alert-danger-bg);
  color: var(--status-danger-text);
}

.status-badge--warning {
  background: var(--status-warning-bg);
  color: var(--status-warning-text);
}

.status-badge--neutral {
  background: var(--status-neutral-bg);
  color: var(--status-neutral-text);
}

.list-row--stacked {
  align-items: flex-start;
}

.list-row__icon,
.tile-card__icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: var(--accent-soft);
  color: var(--accent-strong);
  flex: 0 0 auto;
}

.list-row__avatar {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-size: 13px;
  font-weight: 800;
  flex: 0 0 auto;
}

.list-row__meta-group {
  display: grid;
  justify-items: end;
  gap: 4px;
  font-size: 11px;
  color: var(--text-quiet);
}

.list-row__meta-group strong {
  color: var(--accent-strong);
}

.metric-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.metric-box {
  padding: 16px;
}

.metric-box span {
  display: block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-quiet);
}

.metric-box strong {
  display: block;
  margin-top: 8px;
  font-size: 26px;
  color: var(--text-primary);
}

.tile-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.tile-card {
  width: 100%;
  min-height: 190px;
  display: grid;
  align-content: start;
  gap: 16px;
  border: none;
  text-align: left;
  cursor: pointer;
}

.tile-card__copy {
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-secondary);
}

.tile-card__cta {
  font-size: 12px;
  font-weight: 700;
  color: var(--accent-strong);
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 20px;
  background: var(--surface-muted);
  border: var(--border-subtle);
}

.profile-card__avatar {
  width: 68px;
  height: 68px;
  border-radius: 22px;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-size: 24px;
  font-weight: 800;
  cursor: pointer;
}

.profile-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-card__meta strong {
  display: block;
  font-size: 16px;
  color: var(--text-primary);
}

.profile-card__meta span {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.toggle-list {
  display: grid;
  gap: 12px;
}

.toggle-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 18px;
  background: var(--surface-muted);
  border: var(--border-subtle);
}

.toggle-row strong {
  display: block;
  font-size: 14px;
  color: var(--text-primary);
}

.toggle-row span {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.hidden-input {
  display: none;
}

.empty-state {
  padding: 18px;
  border-radius: 18px;
  background: var(--surface-muted);
  color: var(--text-muted);
  font-size: 13px;
}

@media (max-width: 1200px) {
  .reference-shell {
    grid-template-columns: 220px minmax(0, 1fr);
  }

  .reference-page__grid--two,
  .metric-columns,
  .tile-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 980px) {
  .reference-shell {
    grid-template-columns: 1fr;
  }

  .reference-shell--sidebar-collapsed {
    grid-template-columns: 1fr;
  }

  .reference-sidebar {
    order: 2;
  }

  .reference-sidebar__toggle {
    right: 18px;
  }

  .reference-sidebar.is-collapsed {
    padding: 24px 18px 18px;
    gap: 20px;
  }

  .reference-sidebar.is-collapsed .reference-brand {
    justify-content: flex-start;
    padding-right: 0;
  }

  .reference-sidebar.is-collapsed .reference-brand > div,
  .reference-sidebar.is-collapsed .reference-profile__name,
  .reference-sidebar.is-collapsed .reference-profile__role,
  .reference-sidebar.is-collapsed .reference-nav__title,
  .reference-sidebar.is-collapsed .reference-nav__item span,
  .reference-sidebar.is-collapsed .reference-logout span {
    display: block;
  }

  .reference-sidebar.is-collapsed .reference-nav__item small {
    display: inline-flex;
  }

  .reference-sidebar.is-collapsed .reference-profile {
    padding: 18px;
  }

  .reference-sidebar.is-collapsed .reference-profile__avatar {
    width: 68px;
    height: 68px;
    border-radius: 22px;
  }

  .reference-sidebar.is-collapsed .reference-nav__item,
  .reference-sidebar.is-collapsed .reference-logout {
    justify-content: flex-start;
    padding-inline: 14px;
  }

  .reference-sidebar.is-collapsed .reference-nav__item i,
  .reference-sidebar.is-collapsed .reference-logout i {
    width: 16px;
    font-size: inherit;
  }
}

@media (max-width: 760px) {
  .reference-shell {
    padding: 14px;
  }

  .reference-topbar,
  .reference-page__header {
    flex-direction: column;
    align-items: stretch;
  }

  .reference-topbar__actions {
    justify-content: space-between;
  }

  .reference-surface {
    padding: 20px;
  }
}
</style>
