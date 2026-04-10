from odoo import fields, models


class ResUsers(models.Model):
    _inherit = "res.users"

    x_notify_announcements = fields.Boolean(string="Notify Announcements", default=True)
    x_notify_quizzes = fields.Boolean(string="Notify Quizzes", default=True)
    x_notify_progress = fields.Boolean(string="Notify Progress", default=True)
