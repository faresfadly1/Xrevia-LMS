from odoo import api, fields, models


class LmsQuizResult(models.Model):
    _inherit = "lms.quiz.result"

    course_id = fields.Many2one("lms.course", related="quiz_id.course_id", store=True, readonly=True)
    teacher_id = fields.Many2one("res.users", related="quiz_id.course_id.teacher_id", store=True, readonly=True)

    @api.depends("score", "max_score", "quiz_id.x_pass_percentage")
    def _compute_percentage(self):
        for rec in self:
            if rec.max_score:
                rec.percentage = (rec.score / rec.max_score) * 100.0
            else:
                rec.percentage = 0.0
            rec.passed = rec.percentage >= (rec.quiz_id.x_pass_percentage or 50.0)
