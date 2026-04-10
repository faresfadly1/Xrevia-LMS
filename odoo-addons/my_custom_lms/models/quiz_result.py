from odoo import api, fields, models


class LmsQuizResult(models.Model):
    _name = 'lms.quiz.result'
    _description = 'LMS Quiz Result'
    _order = 'id desc'

    student_id = fields.Many2one('res.users', required=True, string='Student')
    quiz_id = fields.Many2one('lms.quiz', required=True, ondelete='cascade')
    score = fields.Integer(default=0)
    max_score = fields.Integer(default=0)
    percentage = fields.Float(compute='_compute_percentage', store=True)
    passed = fields.Boolean(compute='_compute_percentage', store=True)
    line_ids = fields.One2many('lms.quiz.result.line', 'result_id', string='Answers')
    submitted_on = fields.Datetime(default=fields.Datetime.now)

    @api.depends('score', 'max_score')
    def _compute_percentage(self):
        for rec in self:
            if rec.max_score:
                rec.percentage = (rec.score / rec.max_score) * 100.0
            else:
                rec.percentage = 0.0
            rec.passed = rec.percentage >= 50.0


class LmsQuizResultLine(models.Model):
    _name = 'lms.quiz.result.line'
    _description = 'LMS Quiz Result Line'
    _order = 'id'

    result_id = fields.Many2one('lms.quiz.result', required=True, ondelete='cascade')
    question_id = fields.Many2one('lms.question', required=True)
    selected_answer = fields.Selection(
        [('a', 'A'), ('b', 'B'), ('c', 'C'), ('d', 'D')],
        required=True,
    )
    is_correct = fields.Boolean(default=False)
    points = fields.Integer(default=0)
