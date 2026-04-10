from odoo import fields, models


class LmsLesson(models.Model):
    _name = 'lms.lesson'
    _description = 'LMS Lesson'
    _order = 'sequence, id'

    name = fields.Char(required=True)
    course_id = fields.Many2one('lms.course', required=True, ondelete='cascade')
    sequence = fields.Integer(default=10)
    content = fields.Html()
    file = fields.Binary(attachment=True)
    file_filename = fields.Char(string='Filename')
    video_url = fields.Char(string='Video URL')
