from odoo import api, fields, models


class LmsLessonProgress(models.Model):
    _name = "lms.lesson.progress"
    _description = "LMS Lesson Progress"
    _order = "last_opened_on desc, id desc"

    student_id = fields.Many2one("res.users", required=True, string="Student", ondelete="cascade")
    lesson_id = fields.Many2one("lms.lesson", required=True, string="Lesson", ondelete="cascade")
    course_id = fields.Many2one("lms.course", related="lesson_id.course_id", store=True, readonly=True)
    status = fields.Selection(
        [("not_started", "Not Started"), ("in_progress", "In Progress"), ("completed", "Completed")],
        default="not_started",
        required=True,
    )
    progress_percent = fields.Float(string="Progress", default=0.0)
    first_opened_on = fields.Datetime(string="First Opened")
    last_opened_on = fields.Datetime(string="Last Activity")
    completed_on = fields.Datetime(string="Completed On")

    _sql_constraints = [
        ("unique_student_lesson", "unique(student_id, lesson_id)", "Lesson progress already exists for this student."),
    ]

    @api.model
    def _sanitize_values(self, vals):
        sanitized = dict(vals)
        if "progress_percent" in sanitized:
            try:
                numeric = float(sanitized["progress_percent"])
            except (TypeError, ValueError):
                numeric = 0.0
            numeric = max(0.0, min(numeric, 100.0))
            sanitized["progress_percent"] = numeric
            if numeric >= 100.0:
                sanitized.setdefault("status", "completed")
                sanitized.setdefault("completed_on", fields.Datetime.now())
            elif numeric > 0 and sanitized.get("status") in (None, False, "not_started"):
                sanitized["status"] = "in_progress"
        return sanitized

    @api.model_create_multi
    def create(self, vals_list):
        records = super().create([self._sanitize_values(vals) for vals in vals_list])
        records._sync_enrollment_progress()
        return records

    def write(self, vals):
        res = super().write(self._sanitize_values(vals))
        self._sync_enrollment_progress()
        return res

    def _sync_enrollment_progress(self):
        Enrollment = self.env["lms.enrollment"].sudo()
        for student_id, course_id in {(rec.student_id.id, rec.course_id.id) for rec in self if rec.student_id and rec.course_id}:
            enrollment = Enrollment.search([
                ("course_id", "=", course_id),
                ("student_id", "=", student_id),
            ], limit=1)
            if not enrollment:
                continue

            lessons = enrollment.course_id.lesson_ids
            if not lessons:
                enrollment.write({"progress": 0.0, "status": "enrolled"})
                continue

            records = self.sudo().search([
                ("student_id", "=", student_id),
                ("lesson_id", "in", lessons.ids),
            ])
            total_progress = sum(max(0.0, min(rec.progress_percent, 100.0)) for rec in records)
            overall_progress = min(total_progress / len(lessons), 100.0)
            enrollment_status = "completed" if overall_progress >= 99.9 else "enrolled"
            enrollment.write({
                "progress": overall_progress,
                "status": enrollment_status,
            })
