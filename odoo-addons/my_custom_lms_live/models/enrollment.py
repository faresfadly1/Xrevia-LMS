from odoo import api, fields, models


class LmsEnrollment(models.Model):
    _inherit = "lms.enrollment"

    x_total_lessons = fields.Integer(string="Lesson Count", compute="_compute_progress_snapshot")
    x_completed_lessons = fields.Integer(string="Completed Lessons", compute="_compute_progress_snapshot")
    x_last_activity_on = fields.Datetime(string="Last Activity", compute="_compute_progress_snapshot")

    @api.model_create_multi
    def create(self, vals_list):
        records = super().create(vals_list)
        for enrollment in records.filtered(lambda rec: rec.course_id and rec.student_id):
            enrollment.course_id.with_context(skip_auto_enroll_sync=True).sudo().write({
                "x_auto_enroll_excluded_user_ids": [(3, enrollment.student_id.id)],
            })
        return records

    def unlink(self):
        for enrollment in self.filtered(lambda rec: rec.course_id and rec.student_id and rec.course_id.x_auto_enroll):
            enrollment.course_id.with_context(skip_auto_enroll_sync=True).sudo().write({
                "x_auto_enroll_excluded_user_ids": [(4, enrollment.student_id.id)],
            })
        return super().unlink()

    def _compute_progress_snapshot(self):
        Progress = self.env["lms.lesson.progress"].sudo()
        for enrollment in self:
            if not enrollment.course_id or not enrollment.student_id:
                enrollment.x_total_lessons = 0
                enrollment.x_completed_lessons = 0
                enrollment.x_last_activity_on = False
                continue

            progress_records = Progress.search([
                ("course_id", "=", enrollment.course_id.id),
                ("student_id", "=", enrollment.student_id.id),
            ], order="last_opened_on desc, id desc")

            enrollment.x_total_lessons = len(enrollment.course_id.lesson_ids)
            enrollment.x_completed_lessons = len(progress_records.filtered(lambda rec: rec.status == "completed"))
            enrollment.x_last_activity_on = progress_records[:1].last_opened_on if progress_records else False
