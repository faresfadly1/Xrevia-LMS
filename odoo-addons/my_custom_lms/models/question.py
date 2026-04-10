from odoo import fields, models


class LmsQuestion(models.Model):
    _name = 'lms.question'
    _description = 'LMS Quiz Question'
    _order = 'id'

    quiz_id = fields.Many2one('lms.quiz', required=True, ondelete='cascade')
    question_text = fields.Text(required=True)
    answer_a = fields.Char(required=True)
    answer_b = fields.Char(required=True)
    answer_c = fields.Char()
    answer_d = fields.Char()
    correct_answer = fields.Selection(
        [('a', 'A'), ('b', 'B'), ('c', 'C'), ('d', 'D')],
        required=True,
        default='a',
    )
    points = fields.Integer(default=1)
