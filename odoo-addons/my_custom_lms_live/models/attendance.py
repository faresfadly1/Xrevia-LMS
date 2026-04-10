from odoo import api, fields, models


class LmsAttendanceSession(models.Model):
    _name = "lms.attendance.session"
    _description = "LMS Attendance Session"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "session_date desc, id desc"

    name = fields.Char(required=True)
    course_id = fields.Many2one("lms.course", required=True, ondelete="cascade", index=True)
    lesson_id = fields.Many2one("lms.lesson", ondelete="set null")
    teacher_id = fields.Many2one("res.users", related="course_id.teacher_id", store=True, readonly=True)
    session_date = fields.Datetime(required=True, default=fields.Datetime.now)
    status = fields.Selection([("draft", "Draft"), ("closed", "Closed")], default="draft", required=True)
    notes = fields.Text()
    record_ids = fields.One2many("lms.attendance.record", "session_id", string="Attendance Records")
    present_count = fields.Integer(compute="_compute_counts")
    absent_count = fields.Integer(compute="_compute_counts")
    late_count = fields.Integer(compute="_compute_counts")

    @api.depends("record_ids.status")
    def _compute_counts(self):
        for session in self:
            session.present_count = len(session.record_ids.filtered(lambda rec: rec.status == "present"))
            session.absent_count = len(session.record_ids.filtered(lambda rec: rec.status == "absent"))
            session.late_count = len(session.record_ids.filtered(lambda rec: rec.status == "late"))


class LmsAttendanceRecord(models.Model):
    _name = "lms.attendance.record"
    _description = "LMS Attendance Record"
    _order = "id desc"

    session_id = fields.Many2one("lms.attendance.session", required=True, ondelete="cascade", index=True)
    student_id = fields.Many2one("res.users", required=True, index=True)
    course_id = fields.Many2one("lms.course", related="session_id.course_id", store=True, readonly=True)
    teacher_id = fields.Many2one("res.users", related="session_id.teacher_id", store=True, readonly=True)
    status = fields.Selection(
        [("present", "Present"), ("late", "Late"), ("absent", "Absent")],
        default="present",
        required=True,
    )
    note = fields.Char()
    marked_on = fields.Datetime(default=fields.Datetime.now)

    _sql_constraints = [
        (
            "lms_attendance_unique_student_session",
            "unique(session_id, student_id)",
            "Each student can only have one attendance record per session.",
        ),
    ]
