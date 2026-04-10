from odoo import api, fields, models


class LmsQuiz(models.Model):
    _name = 'lms.quiz'
    _description = 'LMS Quiz'

    name = fields.Char(required=True)
    course_id = fields.Many2one('lms.course', required=True, ondelete='cascade')
    question_ids = fields.One2many('lms.question', 'quiz_id', string='Questions')
    total_questions = fields.Integer(compute='_compute_total_questions')

    @api.depends('question_ids')
    def _compute_total_questions(self):
        for quiz in self:
            quiz.total_questions = len(quiz.question_ids)
