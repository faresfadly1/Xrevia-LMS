from odoo import api, fields, models


class LmsQuiz(models.Model):
    _inherit = "lms.quiz"

    result_ids = fields.One2many("lms.quiz.result", "quiz_id", string="Quiz Attempts")
    x_attempt_limit = fields.Integer(string="Attempt Limit", default=0, help="Set to 0 for unlimited attempts.")
    x_available_from = fields.Datetime(string="Available From")
    x_deadline = fields.Datetime(string="Submission Deadline")
    x_time_limit_minutes = fields.Integer(string="Time Limit (Minutes)", default=0)
    x_show_results = fields.Boolean(string="Show Results To Students", default=True)
    x_pass_percentage = fields.Float(string="Pass Percentage", default=50.0)
    x_weight = fields.Float(string="Grade Weight", default=1.0)
    x_attempt_count = fields.Integer(string="Total Attempts", compute="_compute_live_stats")
    x_unique_student_count = fields.Integer(string="Students Attempted", compute="_compute_live_stats")
    x_average_percentage = fields.Float(string="Average Grade", compute="_compute_live_stats")
    x_pass_rate = fields.Float(string="Pass Rate", compute="_compute_live_stats")

    @api.depends("result_ids.percentage", "result_ids.student_id", "result_ids.passed")
    def _compute_live_stats(self):
        for quiz in self:
            results = quiz.result_ids
            percentages = results.mapped("percentage")
            student_count = len(set(results.mapped("student_id").ids))
            passed_count = len(results.filtered(lambda rec: rec.passed))

            quiz.x_attempt_count = len(results)
            quiz.x_unique_student_count = student_count
            quiz.x_average_percentage = sum(percentages) / len(percentages) if percentages else 0.0
            quiz.x_pass_rate = (passed_count / len(results)) * 100.0 if results else 0.0
