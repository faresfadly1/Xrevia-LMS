from odoo import api, fields, models


class LmsAssignment(models.Model):
    _name = "lms.assignment"
    _description = "LMS Assignment"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "due_date asc, id desc"

    name = fields.Char(required=True, tracking=True)
    description = fields.Html()
    instructions = fields.Html()
    course_id = fields.Many2one("lms.course", required=True, ondelete="cascade", index=True)
    teacher_id = fields.Many2one("res.users", related="course_id.teacher_id", store=True, readonly=True)
    due_date = fields.Datetime(tracking=True)
    available_from = fields.Datetime()
    allow_late = fields.Boolean(default=False)
    allow_resubmission = fields.Boolean(default=False)
    submission_type = fields.Selection(
        [
            ("file", "File"),
            ("text", "Text"),
            ("file_or_text", "File or Text"),
        ],
        default="file_or_text",
        required=True,
    )
    max_score = fields.Float(default=100.0)
    weight = fields.Float(default=1.0)
    is_published = fields.Boolean(default=True)
    resource_file = fields.Binary(attachment=True)
    resource_filename = fields.Char()
    submission_ids = fields.One2many("lms.assignment.submission", "assignment_id", string="Submissions")
    submission_count = fields.Integer(compute="_compute_live_stats")
    graded_count = fields.Integer(compute="_compute_live_stats")
    pending_count = fields.Integer(compute="_compute_live_stats")
    average_percentage = fields.Float(compute="_compute_live_stats")

    @api.depends("submission_ids.status", "submission_ids.percentage")
    def _compute_live_stats(self):
        for assignment in self:
            submissions = assignment.submission_ids
            graded = submissions.filtered(lambda rec: rec.status == "graded")
            pending = submissions.filtered(lambda rec: rec.status in ("submitted", "late"))
            percentages = [rec.percentage for rec in graded if rec.percentage is not None]

            assignment.submission_count = len(submissions)
            assignment.graded_count = len(graded)
            assignment.pending_count = len(pending)
            assignment.average_percentage = sum(percentages) / len(percentages) if percentages else 0.0


class LmsAssignmentSubmission(models.Model):
    _name = "lms.assignment.submission"
    _description = "LMS Assignment Submission"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "submitted_on desc, id desc"

    assignment_id = fields.Many2one("lms.assignment", required=True, ondelete="cascade", index=True)
    student_id = fields.Many2one("res.users", required=True, index=True)
    course_id = fields.Many2one("lms.course", related="assignment_id.course_id", store=True, readonly=True)
    teacher_id = fields.Many2one("res.users", related="assignment_id.teacher_id", store=True, readonly=True)
    submission_text = fields.Html()
    submitted_file = fields.Binary(attachment=True)
    submitted_filename = fields.Char()
    status = fields.Selection(
        [
            ("draft", "Draft"),
            ("submitted", "Submitted"),
            ("late", "Late"),
            ("graded", "Graded"),
            ("missing", "Missing"),
        ],
        default="draft",
        required=True,
        tracking=True,
    )
    submitted_on = fields.Datetime()
    graded_on = fields.Datetime()
    score = fields.Float()
    percentage = fields.Float(compute="_compute_percentage", store=True)
    feedback = fields.Html()
    is_late = fields.Boolean(default=False)

    _sql_constraints = [
        (
            "lms_assignment_submission_unique_student",
            "unique(assignment_id, student_id)",
            "This student already has a submission for the assignment.",
        ),
    ]

    @api.depends("score", "assignment_id.max_score")
    def _compute_percentage(self):
        for submission in self:
            max_score = submission.assignment_id.max_score or 0.0
            if max_score > 0:
                submission.percentage = (submission.score or 0.0) / max_score * 100.0
            else:
                submission.percentage = 0.0
