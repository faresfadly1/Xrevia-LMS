from odoo import api, fields, models


class LmsCourse(models.Model):
    _name = 'lms.course'
    _description = 'LMS Course'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    name = fields.Char(required=True, tracking=True)
    description = fields.Text()
    teacher_id = fields.Many2one(
        'res.users',
        string='Teacher',
        default=lambda self: self.env.user,
        required=True,
    )
    lesson_ids = fields.One2many('lms.lesson', 'course_id', string='Lessons')
    announcement_ids = fields.One2many('lms.announcement', 'course_id', string='Announcements')
    quiz_ids = fields.One2many('lms.quiz', 'course_id', string='Quizzes')
    enrollment_ids = fields.One2many('lms.enrollment', 'course_id', string='Enrollments')
    enrolled_count = fields.Integer(compute='_compute_enrolled_count')

    @api.depends('enrollment_ids')
    def _compute_enrolled_count(self):
        for course in self:
            course.enrolled_count = len(course.enrollment_ids)
