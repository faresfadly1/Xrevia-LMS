from odoo import api, fields, models


class LmsCourse(models.Model):
    _inherit = "lms.course"

    x_course_code = fields.Char(string="Course Code")
    x_department = fields.Char(string="Department")
    x_term = fields.Char(string="Academic Term")
    x_status = fields.Selection(
        [("draft", "Draft"), ("active", "Active"), ("archived", "Archived")],
        string="Course Status",
        default="draft",
        tracking=True,
    )
    x_cover_image = fields.Binary(string="Cover Image", attachment=True)
    x_is_published = fields.Boolean(string="Published", default=False)
    x_auto_enroll = fields.Boolean(string="Auto Enroll Students", default=True)
    assignment_ids = fields.One2many("lms.assignment", "course_id", string="Assignments")
    attendance_session_ids = fields.One2many("lms.attendance.session", "course_id", string="Attendance Sessions")
    x_auto_enroll_excluded_user_ids = fields.Many2many(
        "res.users",
        "lms_course_auto_enroll_exclusion_rel",
        "course_id",
        "user_id",
        string="Auto Enroll Excluded Students",
        copy=False,
    )
    x_total_lessons = fields.Integer(string="Lesson Count", compute="_compute_live_analytics")
    x_total_assignments = fields.Integer(string="Assignment Count", compute="_compute_live_analytics")
    x_total_quizzes = fields.Integer(string="Quiz Count", compute="_compute_live_analytics")
    x_total_announcements = fields.Integer(string="Announcement Count", compute="_compute_live_analytics")
    x_total_attendance_sessions = fields.Integer(string="Attendance Sessions", compute="_compute_live_analytics")
    x_quiz_attempt_count = fields.Integer(string="Submission Count", compute="_compute_live_analytics")
    x_assignment_submission_count = fields.Integer(string="Assignment Submissions", compute="_compute_live_analytics")
    x_pending_submission_count = fields.Integer(string="Pending Grading", compute="_compute_live_analytics")
    x_average_percentage = fields.Float(string="Average Grade", compute="_compute_live_analytics")
    x_average_assignment_percentage = fields.Float(string="Average Assignment Grade", compute="_compute_live_analytics")
    x_active_student_count = fields.Integer(string="Active Students", compute="_compute_live_analytics")
    x_average_progress = fields.Float(string="Average Progress", compute="_compute_live_analytics")
    x_attendance_rate = fields.Float(string="Attendance Rate", compute="_compute_live_analytics")
    x_completion_rate = fields.Float(string="Completion Rate", compute="_compute_live_analytics")

    def _ensure_teacher_group_membership(self):
        teacher_group = self.env.ref("my_custom_lms.group_lms_teacher", raise_if_not_found=False)
        internal_group = self.env.ref("base.group_user", raise_if_not_found=False)
        if not teacher_group:
            return

        teachers = self.mapped("teacher_id").filtered(lambda user: user and user.active)
        for teacher in teachers:
            commands = []
            if internal_group and internal_group not in teacher.groups_id:
                commands.append((4, internal_group.id))
            if teacher_group not in teacher.groups_id:
                commands.append((4, teacher_group.id))
            if commands:
                teacher.sudo().write({"groups_id": commands})

    @api.model_create_multi
    def create(self, vals_list):
        records = super().create(vals_list)
        records._ensure_teacher_group_membership()
        if not self.env.context.get("skip_auto_enroll_sync"):
            records._sync_auto_enrollments()
        return records

    def write(self, vals):
        res = super().write(vals)
        self._ensure_teacher_group_membership()
        if not self.env.context.get("skip_auto_enroll_sync"):
            self._sync_auto_enrollments()
        return res

    @api.depends(
        "lesson_ids",
        "lesson_ids.progress_ids.status",
        "lesson_ids.progress_ids.student_id",
        "announcement_ids",
        "assignment_ids",
        "assignment_ids.submission_ids.status",
        "assignment_ids.submission_ids.percentage",
        "quiz_ids",
        "quiz_ids.result_ids.percentage",
        "quiz_ids.result_ids.student_id",
        "attendance_session_ids",
        "attendance_session_ids.record_ids.status",
        "enrollment_ids",
        "enrollment_ids.progress",
    )
    def _compute_live_analytics(self):
        for course in self:
            quiz_results = course.quiz_ids.mapped("result_ids")
            percentages = quiz_results.mapped("percentage")
            assignment_submissions = course.assignment_ids.mapped("submission_ids")
            assignment_percentages = assignment_submissions.filtered(lambda rec: rec.status == "graded").mapped("percentage")
            progress_values = [value for value in course.enrollment_ids.mapped("progress") if value is not None]

            lesson_progress = course.lesson_ids.mapped("progress_ids")
            started_records = lesson_progress.filtered(lambda rec: rec.status in ("in_progress", "completed"))
            completed_records = lesson_progress.filtered(lambda rec: rec.status == "completed")
            attendance_records = course.attendance_session_ids.mapped("record_ids")
            present_or_late = attendance_records.filtered(lambda rec: rec.status in ("present", "late"))

            enrolled_count = len(course.enrollment_ids)
            total_lessons = len(course.lesson_ids)
            completed_students = len(course.enrollment_ids.filtered(lambda rec: rec.progress >= 99.9))
            active_students = len(set(started_records.mapped("student_id").ids))
            possible_attendance = len(attendance_records)

            course.x_total_lessons = total_lessons
            course.x_total_assignments = len(course.assignment_ids)
            course.x_total_quizzes = len(course.quiz_ids)
            course.x_total_announcements = len(course.announcement_ids)
            course.x_total_attendance_sessions = len(course.attendance_session_ids)
            course.x_quiz_attempt_count = len(quiz_results)
            course.x_assignment_submission_count = len(assignment_submissions)
            course.x_pending_submission_count = len(assignment_submissions.filtered(lambda rec: rec.status in ("submitted", "late")))
            course.x_average_percentage = sum(percentages) / len(percentages) if percentages else 0.0
            course.x_average_assignment_percentage = (
                sum(assignment_percentages) / len(assignment_percentages) if assignment_percentages else 0.0
            )
            course.x_active_student_count = active_students
            course.x_average_progress = sum(progress_values) / len(progress_values) if progress_values else 0.0
            course.x_attendance_rate = (len(present_or_late) / possible_attendance) * 100.0 if possible_attendance else 0.0
            course.x_completion_rate = (completed_students / enrolled_count) * 100.0 if enrolled_count else 0.0

    def _portal_student_users(self):
        portal_group = self.env.ref("base.group_portal", raise_if_not_found=False)
        users = portal_group.users if portal_group else self.env["res.users"].search([("share", "=", True), ("active", "=", True)])
        return users.filtered(lambda user: user.active and not user._is_public())

    def _student_identity(self, user):
        student_field = self.env["lms.enrollment"]._fields.get("student_id")
        if not student_field:
            return None
        if student_field.comodel_name == "res.partner":
            return user.partner_id.id
        return user.id

    def _default_enrollment_values(self):
        enrollment_fields = self.env["lms.enrollment"]._fields
        values = {}
        for field_name in ("status", "state"):
            field = enrollment_fields.get(field_name)
            if not field or not getattr(field, "selection", None):
                continue
            selection = [item[0] if isinstance(item, (list, tuple)) else item for item in field.selection]
            for candidate in ("enrolled", "active", "open", "draft"):
                if candidate in selection:
                    values[field_name] = candidate
                    break
        return values

    def _sync_auto_enrollments(self):
        Enrollment = self.env["lms.enrollment"].sudo()
        defaults = self._default_enrollment_values()

        for course in self.filtered(lambda rec: rec.x_is_published and rec.x_auto_enroll):
            excluded_user_ids = set(course.x_auto_enroll_excluded_user_ids.ids)
            for user in course._portal_student_users().filtered(lambda user: user.id not in excluded_user_ids):
                student_id = course._student_identity(user)
                if not student_id:
                    continue
                domain = [("course_id", "=", course.id), ("student_id", "=", student_id)]
                if Enrollment.search_count(domain):
                    continue
                values = {
                    "course_id": course.id,
                    "student_id": student_id,
                }
                values.update(defaults)
                Enrollment.create(values)
