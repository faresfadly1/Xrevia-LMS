from odoo import fields, models


class LmsAnnouncement(models.Model):
    _name = 'lms.announcement'
    _description = 'LMS Announcement'
    _order = 'id desc'

    title = fields.Char(required=True)
    message = fields.Text(required=True)
    course_id = fields.Many2one('lms.course', required=True, ondelete='cascade')
    date = fields.Datetime(default=fields.Datetime.now)
