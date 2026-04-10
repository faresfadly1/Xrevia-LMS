{
    "name": "My Custom LMS Live",
    "version": "18.0.1.0.0",
    "depends": ["my_custom_lms", "portal", "website", "base_setup"],
    "data": [
        "security/ir.model.access.csv",
        "security/lms_rules.xml",
        "views/university_lms_views.xml",
        "views/student_accounts.xml",
        "views/teacher_analytics.xml",
        "views/progress_tracking.xml",
        "views/web_login.xml",
        "views/lms_settings.xml",
    ],
    "license": "LGPL-3",
    "installable": True,
    "application": False,
}
