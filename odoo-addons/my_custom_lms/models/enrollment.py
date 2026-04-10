from odoo import api, fields, models


class LmsEnrollment(models.Model):
    _name = 'lms.enrollment'
    _description = 'LMS Enrollment'
    _order = 'id desc'

    student_id = fields.Many2one('res.users', required=True, string='Student')
    course_id = fields.Many2one('lms.course', required=True, ondelete='cascade')
    status = fields.Selection(
        [('enrolled', 'Enrolled'), ('completed', 'Completed')],
        default='enrolled',
        required=True,
    )
    progress = fields.Float(default=0.0, help='Progress percentage')
    enrolled_on = fields.Datetime(default=fields.Datetime.now)

    _sql_constraints = [
        ('unique_student_course', 'unique(student_id, course_id)', 'Student already enrolled in this course.'),
    ]

    @api.onchange('course_id')
    def _onchange_course_id(self):
        if self.course_id and not self.student_id:
            self.student_id = self.env.user
