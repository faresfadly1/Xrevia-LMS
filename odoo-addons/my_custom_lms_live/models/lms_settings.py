from odoo import api, fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = "res.config.settings"

    x_lms_show_dashboard = fields.Boolean(string="Show Dashboard", default=True)
    x_lms_show_courses = fields.Boolean(string="Show Courses", default=True)
    x_lms_show_lessons = fields.Boolean(string="Show Lessons", default=True)
    x_lms_show_announcements = fields.Boolean(string="Show Announcements", default=True)
    x_lms_show_enrollments = fields.Boolean(string="Show Enrollments", default=True)
    x_lms_show_quizzes = fields.Boolean(string="Show Quizzes", default=True)
    x_lms_show_questions = fields.Boolean(string="Show Questions", default=True)
    x_lms_show_quiz_results = fields.Boolean(string="Show Quiz Results", default=True)

    @api.model
    def _lms_visibility_mapping(self):
        return {
            "x_lms_show_dashboard": "my_custom_lms_live.show_dashboard",
            "x_lms_show_courses": "my_custom_lms_live.show_courses",
            "x_lms_show_lessons": "my_custom_lms_live.show_lessons",
            "x_lms_show_announcements": "my_custom_lms_live.show_announcements",
            "x_lms_show_enrollments": "my_custom_lms_live.show_enrollments",
            "x_lms_show_quizzes": "my_custom_lms_live.show_quizzes",
            "x_lms_show_questions": "my_custom_lms_live.show_questions",
            "x_lms_show_quiz_results": "my_custom_lms_live.show_quiz_results",
        }

    @api.model
    def _lms_visibility_values(self):
        params = self.env["ir.config_parameter"].sudo()

        def enabled(key):
            value = params.get_param(key)
            if value in (None, ""):
                return True
            return str(value).strip().lower() not in {"0", "false", "no", "off", ""}

        return {
            field_name: enabled(key)
            for field_name, key in self._lms_visibility_mapping().items()
        }

    @api.model
    def default_get(self, fields_list):
        res = super().default_get(fields_list)
        values = self._lms_visibility_values()
        for field_name, value in values.items():
            if field_name in fields_list:
                res[field_name] = value
        return res

    @api.model
    def get_values(self):
        res = super().get_values()
        res.update(self._lms_visibility_values())
        return res

    def set_values(self):
        res = super().set_values()
        params = self.env["ir.config_parameter"].sudo()
        mapping = self._lms_visibility_mapping()
        for record in self:
            for field_name, key in mapping.items():
                params.set_param(key, "True" if bool(record[field_name]) else "False")
        return res
