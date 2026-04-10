from odoo import api, fields, models


class LmsLesson(models.Model):
    _inherit = "lms.lesson"

    x_module_title = fields.Char(string="Module")
    x_week_label = fields.Char(string="Week / Section")
    x_topic_title = fields.Char(string="Topic")
    x_unit_title = fields.Char(string="Unit")
    x_external_resource_url = fields.Char(string="External Resource URL")
    progress_ids = fields.One2many("lms.lesson.progress", "lesson_id", string="Lesson Progress")
    x_started_student_count = fields.Integer(string="Started Students", compute="_compute_progress_stats")
    x_completed_student_count = fields.Integer(string="Completed Students", compute="_compute_progress_stats")
    x_completion_rate = fields.Float(string="Completion Rate", compute="_compute_progress_stats")

    @api.depends("progress_ids.status", "progress_ids.student_id", "course_id.enrollment_ids")
    def _compute_progress_stats(self):
        for lesson in self:
            started = lesson.progress_ids.filtered(lambda rec: rec.status in ("in_progress", "completed"))
            completed = lesson.progress_ids.filtered(lambda rec: rec.status == "completed")
            enrolled_count = len(lesson.course_id.enrollment_ids)

            lesson.x_started_student_count = len(set(started.mapped("student_id").ids))
            lesson.x_completed_student_count = len(set(completed.mapped("student_id").ids))
            lesson.x_completion_rate = (lesson.x_completed_student_count / enrolled_count) * 100.0 if enrolled_count else 0.0
