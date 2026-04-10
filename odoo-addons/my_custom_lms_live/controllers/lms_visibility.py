import json

from odoo import http

from .main import MyCustomLmsLiveController


class MyCustomLmsLiveVisibilityController(MyCustomLmsLiveController):
    def _lms_visibility_payload(self):
        params = http.request.env["ir.config_parameter"].sudo()

        def enabled(key):
            value = params.get_param(key, "True")
            return str(value).strip().lower() not in {"0", "false", "no", "off", ""}

        return {
            "dashboard": enabled("my_custom_lms_live.show_dashboard"),
            "courses": enabled("my_custom_lms_live.show_courses"),
            "lessons": enabled("my_custom_lms_live.show_lessons"),
            "announcements": enabled("my_custom_lms_live.show_announcements"),
            "enrollments": enabled("my_custom_lms_live.show_enrollments"),
            "quizzes": enabled("my_custom_lms_live.show_quizzes"),
            "questions": enabled("my_custom_lms_live.show_questions"),
            "quizResults": enabled("my_custom_lms_live.show_quiz_results"),
        }

    @http.route(
        "/lms/api/live_bootstrap",
        type="http",
        auth="public",
        website=True,
        csrf=False,
        sitemap=False,
        methods=["GET"],
    )
    def lms_live_bootstrap(self, **kwargs):
        response = super().lms_live_bootstrap(**kwargs)

        if getattr(response, "status_code", 200) != 200:
            return response

        try:
            payload = json.loads(response.get_data(as_text=True) or "{}")
        except Exception:
            return response

        payload["lms_visibility"] = self._lms_visibility_payload()
        response.set_data(json.dumps(payload, default=str))
        response.headers["Content-Type"] = "application/json; charset=utf-8"
        return response
