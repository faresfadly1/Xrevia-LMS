from odoo import fields, http
from odoo.addons.web.controllers.home import Home
from odoo.exceptions import AccessDenied, UserError
from odoo.http import request, Response
import json


class LmsWebHome(Home):
    @http.route(['/web', '/odoo', '/odoo/<path:subpath>', '/scoped_app/<path:subpath>'], type='http', auth="none")
    def web_client(self, s_action=None, **kw):
        return super().web_client(s_action=s_action, **kw)


class MyCustomLmsLiveController(http.Controller):
    def _json_response(self, payload, status=200):
        return Response(
            json.dumps(payload, default=str),
            status=status,
            content_type="application/json; charset=utf-8",
        )

    def _safe_search_read(self, model_name, domain, field_names, order=None):
        model = request.env[model_name].sudo()
        safe_fields = [name for name in field_names if name in model._fields]
        if not safe_fields:
            return []
        return model.search_read(domain, safe_fields, limit=200, order=order)

    def _student_ids(self, user):
        return [user.id]

    def _student_enrollment(self, course, user):
        return request.env["lms.enrollment"].sudo().search([
            ("course_id", "=", course.id),
            ("student_id", "=", user.id),
        ], limit=1)

    def _clamp_progress(self, value, default=0.0):
        try:
            numeric = float(value)
        except (TypeError, ValueError):
            numeric = default
        return max(0.0, min(numeric, 100.0))

    def _student_payload(self, user):
        user = user.sudo()
        partner = user.partner_id.sudo()
        write_marker = partner.write_date or user.write_date or fields.Datetime.now()
        unique = int(write_marker.timestamp()) if write_marker else 0
        has_avatar = bool(partner.image_1920)
        avatar_url = f"/web/image/res.partner/{partner.id}/image_128?unique={unique}" if has_avatar else ""
        return {
            "name": user.name,
            "login": user.login,
            "email": partner.email or "",
            "phone": partner.phone or "",
            "timezone": user.tz or "",
            "language": user.lang or "",
            "last_login": getattr(user, "login_date", False) or "",
            "avatar_url": avatar_url,
            "has_avatar": has_avatar,
            "notifications": {
                "announcements": bool(user.x_notify_announcements),
                "quizzes": bool(user.x_notify_quizzes),
                "progress": bool(user.x_notify_progress),
            },
        }

    def _doctor_courses(self, user):
        return request.env["lms.course"].sudo().search([("teacher_id", "=", user.id)])

    def _managed_courses(self, user):
        if self._is_admin_user(user):
            return request.env["lms.course"].sudo().search([])
        return self._doctor_courses(user)

    def _doctor_action_url(self, user):
        action = request.env.ref("my_custom_lms.action_lms_course", raise_if_not_found=False)
        if not action:
            return "/odoo"

        courses = self._managed_courses(user)
        if len(courses) == 1:
            return f"/odoo/action-{action.id}/{courses.id}"
        return f"/odoo/action-{action.id}"

    def _ensure_doctor_course_access(self, course):
        course = course.sudo().exists()
        if not course:
            raise ValueError("Course not found.")

        user = request.env.user
        if self._is_admin_user(user):
            return course
        if not self._is_doctor_user(user):
            raise AccessDenied("Instructor or admin access is required.")
        if course.teacher_id.id != user.id:
            raise AccessDenied("You can only manage your own courses.")
        return course

    def _coerce_attendance_status(self, status):
        clean_status = (status or "").strip().lower() or "present"
        if clean_status not in {"present", "late", "absent"}:
            raise ValueError("Attendance status must be present, late, or absent.")
        return clean_status

    def _course_roster_student_ids(self, course):
        return set(course.enrollment_ids.sudo().mapped("student_id").ids)

    def _attendance_lesson_for_course(self, course, lesson_id):
        if not lesson_id:
            return False
        lesson = request.env["lms.lesson"].sudo().browse(int(lesson_id)).exists()
        if not lesson or lesson.course_id.id != course.id:
            raise ValueError("The selected lesson does not belong to this course.")
        return lesson

    def _course_cover_url(self, course):
        if not course.x_cover_image:
            return ""
        write_marker = course.write_date or fields.Datetime.now()
        unique = int(write_marker.timestamp()) if write_marker else 0
        return f"/web/image/lms.course/{course.id}/x_cover_image?unique={unique}"

    def _lms_visibility_payload(self):
        params = request.env["ir.config_parameter"].sudo()

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

    def _is_admin_user(self, user):
        return bool(
            getattr(user, "x_lms_role", False) == "admin"
            or user.has_group("my_custom_lms.group_lms_admin")
        )

    def _is_doctor_user(self, user):
        return user.has_group("my_custom_lms.group_lms_teacher") or bool(self._doctor_courses(user))

    def _viewer_mode(self, user):
        if self._is_admin_user(user):
            return "admin"
        if self._is_doctor_user(user):
            return "doctor"
        return "student"

    def _is_staff_viewer(self, viewer_mode):
        return viewer_mode in {"doctor", "admin"}

    @http.route("/xrevia/post_login_website", type="http", auth="user", website=True, csrf=False)
    def lms_post_login(self, **kwargs):
        return request.redirect("/xrevia-lms")

    @http.route("/lms/api/live_bootstrap", type="http", auth="public", website=True, csrf=False, sitemap=False, methods=["GET"])
    def lms_live_bootstrap(self, **kwargs):
        user = request.env.user

        if user._is_public():
            return self._json_response({"message": "Please log in to view LMS data."}, status=401)

        viewer_mode = self._viewer_mode(user)
        staff_viewer = self._is_staff_viewer(viewer_mode)
        student_ids = self._student_ids(user)
        if viewer_mode == "admin":
            course_domain = []
        elif viewer_mode == "doctor":
            course_domain = [("teacher_id", "=", user.id)]
        else:
            course_domain = [("x_is_published", "=", True), ("enrollment_ids.student_id", "=", user.id)]

        courses = self._safe_search_read(
            "lms.course",
            course_domain,
            [
                "id",
                "name",
                "description",
                "teacher_id",
                "x_course_code",
                "x_department",
                "x_term",
                "x_status",
                "x_is_published",
                "x_auto_enroll",
                "x_total_assignments",
                "x_total_lessons",
                "x_total_quizzes",
                "x_total_announcements",
                "x_total_attendance_sessions",
                "x_quiz_attempt_count",
                "x_assignment_submission_count",
                "x_pending_submission_count",
                "x_average_percentage",
                "x_average_assignment_percentage",
                "x_active_student_count",
                "x_average_progress",
                "x_attendance_rate",
                "x_completion_rate",
            ],
            order="id desc",
        )
        course_ids = [row["id"] for row in courses]
        course_records = {course.id: course for course in request.env["lms.course"].sudo().browse(course_ids).exists()}
        for row in courses:
            course = course_records.get(row["id"])
            row["cover_url"] = self._course_cover_url(course) if course else ""

        enrollment_domain = [("course_id", "in", course_ids or [0])]
        if not staff_viewer:
            enrollment_domain.insert(0, ("student_id", "in", student_ids))

        enrollments = self._safe_search_read(
            "lms.enrollment",
            enrollment_domain,
            [
                "id",
                "student_id",
                "course_id",
                "status",
                "progress",
                "enrolled_on",
                "x_completed_lessons",
                "x_total_lessons",
                "x_last_activity_on",
            ],
            order="id desc",
        )

        lessons = self._safe_search_read(
            "lms.lesson",
            [("course_id", "in", course_ids or [0])],
            [
                "id",
                "name",
                "course_id",
                "sequence",
                "video_url",
                "content",
                "file_filename",
                "x_module_title",
                "x_week_label",
                "x_topic_title",
                "x_unit_title",
                "x_external_resource_url",
                "x_started_student_count",
                "x_completed_student_count",
                "x_completion_rate",
            ],
            order="sequence, id",
        )
        lesson_ids = [row["id"] for row in lessons]

        lesson_progress_domain = [("lesson_id", "in", lesson_ids or [0])]
        if not staff_viewer:
            lesson_progress_domain.insert(0, ("student_id", "=", user.id))

        lesson_progress = self._safe_search_read(
            "lms.lesson.progress",
            lesson_progress_domain,
            [
                "id",
                "student_id",
                "lesson_id",
                "course_id",
                "status",
                "progress_percent",
                "first_opened_on",
                "last_opened_on",
                "completed_on",
            ],
            order="id desc",
        )

        announcements = self._safe_search_read(
            "lms.announcement",
            [("course_id", "in", course_ids or [0])],
            ["id", "course_id", "title", "name", "message", "date", "create_date"],
            order="date desc, id desc",
        )

        assignment_domain = [("course_id", "in", course_ids or [0])]
        if not staff_viewer:
            assignment_domain.append(("is_published", "=", True))

        assignments = self._safe_search_read(
            "lms.assignment",
            assignment_domain,
            [
                "id",
                "name",
                "description",
                "instructions",
                "course_id",
                "teacher_id",
                "due_date",
                "available_from",
                "allow_late",
                "allow_resubmission",
                "submission_type",
                "max_score",
                "weight",
                "is_published",
                "resource_filename",
                "submission_count",
                "graded_count",
                "pending_count",
                "average_percentage",
                "create_date",
            ],
            order="due_date asc, id desc",
        )
        assignment_ids = [row["id"] for row in assignments]

        submission_domain = [("assignment_id", "in", assignment_ids or [0])]
        if not staff_viewer:
            submission_domain.insert(0, ("student_id", "in", student_ids))

        assignment_submissions = self._safe_search_read(
            "lms.assignment.submission",
            submission_domain,
            [
                "id",
                "assignment_id",
                "student_id",
                "course_id",
                "status",
                "submitted_on",
                "graded_on",
                "score",
                "percentage",
                "feedback",
                "submitted_filename",
                "create_date",
                "write_date",
            ],
            order="submitted_on desc, id desc",
        )

        attendance_sessions = self._safe_search_read(
            "lms.attendance.session",
            [("course_id", "in", course_ids or [0])],
            [
                "id",
                "name",
                "course_id",
                "lesson_id",
                "session_date",
                "status",
                "notes",
                "present_count",
                "late_count",
                "absent_count",
                "create_date",
            ],
            order="session_date desc, id desc",
        )
        attendance_session_ids = [row["id"] for row in attendance_sessions]

        attendance_record_domain = [("session_id", "in", attendance_session_ids or [0])]
        if not staff_viewer:
            attendance_record_domain.insert(0, ("student_id", "=", user.id))

        attendance_records = self._safe_search_read(
            "lms.attendance.record",
            attendance_record_domain,
            [
                "id",
                "session_id",
                "student_id",
                "course_id",
                "status",
                "note",
                "marked_on",
                "create_date",
            ],
            order="id desc",
        )

        quizzes = self._safe_search_read(
            "lms.quiz",
            [("course_id", "in", course_ids or [0])],
            [
                "id",
                "course_id",
                "name",
                "x_available_from",
                "x_attempt_limit",
                "x_deadline",
                "x_time_limit_minutes",
                "x_show_results",
                "x_pass_percentage",
                "x_weight",
                "x_attempt_count",
                "x_average_percentage",
                "x_pass_rate",
                "total_questions",
            ],
        )
        quiz_ids = [row["id"] for row in quizzes]

        questions = self._safe_search_read(
            "lms.question",
            [("quiz_id", "in", quiz_ids or [0])],
            ["id", "quiz_id", "question_text", "answer_a", "answer_b", "answer_c", "answer_d", "correct_answer", "points"],
        )

        quiz_result_domain = [("quiz_id", "in", quiz_ids or [0])] if staff_viewer else [("student_id", "in", student_ids)]
        quiz_results = self._safe_search_read(
            "lms.quiz.result",
            quiz_result_domain,
            ["id", "quiz_id", "student_id", "score", "max_score", "percentage", "passed", "submitted_on", "create_date"],
            order="id desc",
        )
        result_ids = [row["id"] for row in quiz_results]

        available_students = []
        if staff_viewer:
            available_students = self._safe_search_read(
                "res.users",
                [("x_lms_role", "=", "student"), ("active", "=", True)],
                ["id", "name", "login", "email", "x_lms_role", "active", "create_date", "write_date", "login_date"],
                order="name asc, id asc",
            )

        quiz_result_lines = self._safe_search_read(
            "lms.quiz.result.line",
            [("result_id", "in", result_ids or [0])],
            ["id", "result_id", "question_id", "selected_answer", "is_correct", "points", "create_date"],
            order="id desc",
        )

        payload = {
            "viewer_mode": viewer_mode,
            "student": self._student_payload(user),
            "available_students": available_students,
            "lms_visibility": self._lms_visibility_payload(),
            "courses": courses,
            "lessons": lessons,
            "lesson_progress": lesson_progress,
            "announcements": announcements,
            "assignments": assignments,
            "assignment_submissions": assignment_submissions,
            "attendance_sessions": attendance_sessions,
            "attendance_records": attendance_records,
            "enrollments": enrollments,
            "quizzes": quizzes,
            "questions": questions,
            "quiz_results": quiz_results,
            "quiz_result_lines": quiz_result_lines,
        }
        return self._json_response(payload)

    @http.route("/lms/api/track_lesson", type="json", auth="user", website=True, csrf=False, methods=["POST"])
    def track_lesson(self, lesson_id, action="open", progress_percent=None):
        user = request.env.user
        lesson = request.env["lms.lesson"].sudo().browse(int(lesson_id)).exists()
        if not lesson:
            raise ValueError("Lesson not found.")
        if not lesson.course_id or not getattr(lesson.course_id, "x_is_published", False):
            raise ValueError("This lesson is not available to students yet.")

        enrollment = self._student_enrollment(lesson.course_id, user)
        if not enrollment:
            raise ValueError("You are not enrolled in this course.")

        Progress = request.env["lms.lesson.progress"].sudo()
        record = Progress.search([
            ("student_id", "=", user.id),
            ("lesson_id", "=", lesson.id),
        ], limit=1)

        now = fields.Datetime.now()
        action = (action or "open").strip().lower()
        existing_progress = record.progress_percent if record else 0.0
        values = {
            "student_id": user.id,
            "lesson_id": lesson.id,
            "last_opened_on": now,
        }

        if not record or not record.first_opened_on:
            values["first_opened_on"] = now

        if action in ("open", "start", "view"):
            next_progress = max(existing_progress, self._clamp_progress(progress_percent, 15.0))
            values["progress_percent"] = next_progress
            if (record and record.status != "completed") or not record:
                values["status"] = "completed" if next_progress >= 100.0 else "in_progress"
                if values["status"] == "completed":
                    values["completed_on"] = record.completed_on if record and record.completed_on else now
        elif action == "progress":
            next_progress = max(existing_progress, self._clamp_progress(progress_percent, existing_progress or 25.0))
            values["progress_percent"] = next_progress
            if next_progress >= 100.0:
                values["status"] = "completed"
                values["completed_on"] = record.completed_on if record and record.completed_on else now
            elif (record and record.status != "completed") or not record:
                values["status"] = "in_progress"
        elif action == "complete":
            values.update({
                "progress_percent": 100.0,
                "status": "completed",
                "completed_on": record.completed_on if record and record.completed_on else now,
            })
        else:
            raise ValueError("Unsupported lesson tracking action.")

        if record:
            record.write(values)
        else:
            record = Progress.create(values)

        enrollment.invalidate_recordset()
        enrollment.flush_recordset()

        return {
            "message": "Lesson progress saved.",
            "lesson_progress": {
                "id": record.id,
                "lesson_id": record.lesson_id.id,
                "status": record.status,
                "progress_percent": record.progress_percent,
                "first_opened_on": record.first_opened_on,
                "last_opened_on": record.last_opened_on,
                "completed_on": record.completed_on,
            },
            "course_progress": enrollment.progress,
        }

    @http.route("/lms/api/update_profile", type="json", auth="user", website=True, csrf=False, methods=["POST"])
    def update_profile(self, full_name=None, email=None, phone=None, notifications=None):
        user = request.env.user.sudo()
        partner = user.partner_id.sudo()

        full_name = (full_name or "").strip() or user.name
        email = (email or "").strip()
        phone = (phone or "").strip()
        notifications = notifications or {}

        if not full_name:
            raise ValueError("Full name is required.")
        if not isinstance(notifications, dict):
            raise ValueError("Notification preferences are invalid.")

        partner_vals = {}
        if partner.name != full_name:
            partner_vals["name"] = full_name
        if (partner.email or "") != email:
            partner_vals["email"] = email
        if (partner.phone or "") != phone:
            partner_vals["phone"] = phone
        if partner_vals:
            partner.write(partner_vals)

        user_vals = {}
        if user.name != full_name:
            user_vals["name"] = full_name

        notification_mapping = {
            "x_notify_announcements": "announcements",
            "x_notify_quizzes": "quizzes",
            "x_notify_progress": "progress",
        }
        for field_name, payload_key in notification_mapping.items():
            if payload_key in notifications:
                next_value = bool(notifications.get(payload_key))
                if bool(getattr(user, field_name)) != next_value:
                    user_vals[field_name] = next_value

        if user_vals:
            user.write(user_vals)

        return {
            "message": "Account settings updated.",
            "student": self._student_payload(user),
        }

    @http.route("/lms/api/update_avatar", type="json", auth="user", website=True, csrf=False, methods=["POST"])
    def update_avatar(self, image_base64=None, clear=False):
        user = request.env.user.sudo()
        partner = user.partner_id.sudo()

        if clear:
            partner.write({"image_1920": False})
            return {
                "message": "Profile photo removed.",
                "student": self._student_payload(user),
            }

        image_base64 = (image_base64 or "").strip()
        if image_base64.startswith("data:"):
            image_base64 = image_base64.split(",", 1)[1]

        if not image_base64:
            raise ValueError("Please choose an image to upload.")

        partner.write({"image_1920": image_base64})
        return {
            "message": "Profile photo updated.",
            "student": self._student_payload(user),
        }

    @http.route("/lms/api/change_password", type="json", auth="user", website=True, csrf=False, methods=["POST"])
    def change_password(self, current_password=None, new_password=None):
        current_password = current_password or ""
        new_password = new_password or ""

        if not current_password:
            raise ValueError("Please enter your current password.")
        if len(new_password) < 8:
            raise ValueError("Your new password must be at least 8 characters long.")

        try:
            request.env.user.change_password(current_password, new_password)
        except AccessDenied as exc:
            raise ValueError("Your current password is incorrect.") from exc
        except UserError as exc:
            raise ValueError(str(exc)) from exc

        return {
            "message": "Password updated successfully.",
        }

    @http.route("/lms/api/submit_quiz", type="json", auth="user", website=True, csrf=False, methods=["POST"])
    def submit_quiz(self, quiz_id, answers=None):
        user = request.env.user
        answers = answers or {}
        if not quiz_id or not isinstance(answers, dict):
            raise ValueError("Quiz id and answers are required.")

        env = request.env
        quiz = env["lms.quiz"].sudo().browse(int(quiz_id)).exists()
        if not quiz:
            raise ValueError("Quiz not found.")
        if not quiz.course_id or not getattr(quiz.course_id, "x_is_published", False):
            raise ValueError("This quiz is not available to students yet.")
        if quiz.x_available_from and fields.Datetime.now() < quiz.x_available_from:
            raise ValueError("This quiz is not open yet.")
        if quiz.x_deadline and fields.Datetime.now() > quiz.x_deadline:
            raise ValueError("This quiz is closed. The deadline has passed.")

        enrollment = self._student_enrollment(quiz.course_id, user)
        if not enrollment:
            raise ValueError("You are not enrolled in this course.")

        current_attempts = env["lms.quiz.result"].sudo().search_count([
            ("quiz_id", "=", quiz.id),
            ("student_id", "=", user.id),
        ])
        if quiz.x_attempt_limit and current_attempts >= quiz.x_attempt_limit:
            raise ValueError("You have already used all allowed attempts for this quiz.")

        questions = env["lms.question"].sudo().search([("quiz_id", "=", quiz.id)], order="id")
        if not questions:
            raise ValueError("This quiz has no questions yet.")

        normalized_answers = {}
        for question in questions:
            raw_value = answers.get(str(question.id), answers.get(question.id))
            selected_answer = str(raw_value or "").strip().lower()
            if selected_answer not in {"a", "b", "c", "d"}:
                raise ValueError("Please answer every question before submitting.")
            normalized_answers[question.id] = selected_answer

        total_points = sum(question.points or 1 for question in questions)
        earned_points = 0
        line_values = []
        for question in questions:
            selected_answer = normalized_answers[question.id]
            is_correct = selected_answer == (question.correct_answer or "").lower()
            points = question.points or 1
            earned_line_points = points if is_correct else 0
            earned_points += earned_line_points
            line_values.append({
                "question_id": question.id,
                "selected_answer": selected_answer,
                "is_correct": is_correct,
                "points": earned_line_points,
            })

        result = env["lms.quiz.result"].sudo().create({
            "quiz_id": quiz.id,
            "student_id": user.id,
            "score": earned_points,
            "max_score": total_points,
        })

        for values in line_values:
            values["result_id"] = result.id
            env["lms.quiz.result.line"].sudo().create(values)

        result.invalidate_recordset()
        result.flush_recordset()
        remaining_attempts = 0 if not quiz.x_attempt_limit else max(quiz.x_attempt_limit - (current_attempts + 1), 0)

        return {
            "message": "Quiz submitted successfully.",
            "result_id": result.id,
            "score": result.percentage,
            "earned_points": earned_points,
            "max_score": total_points,
            "correct_count": len([line for line in line_values if line["is_correct"]]),
            "total_count": len(line_values),
            "remaining_attempts": remaining_attempts,
            "deadline": quiz.x_deadline,
        }

    @http.route("/lms/api/submit_assignment", type="json", auth="user", website=True, csrf=False, methods=["POST"])
    def submit_assignment(self, assignment_id, submission_text=None, file_base64=None, file_name=None):
        user = request.env.user
        assignment = request.env["lms.assignment"].sudo().browse(int(assignment_id)).exists()
        if not assignment:
            raise ValueError("Assignment not found.")
        if not assignment.course_id or not assignment.course_id.x_is_published or not assignment.is_published:
            raise ValueError("This assignment is not available to students yet.")
        if assignment.available_from and fields.Datetime.now() < assignment.available_from:
            raise ValueError("This assignment is not open yet.")

        enrollment = self._student_enrollment(assignment.course_id, user)
        if not enrollment:
            raise ValueError("You are not enrolled in this course.")

        submission_text = submission_text or ""
        file_base64 = (file_base64 or "").strip()
        file_name = (file_name or "").strip()
        if file_base64.startswith("data:"):
            file_base64 = file_base64.split(",", 1)[1]

        if assignment.submission_type == "file" and not file_base64:
            raise ValueError("Please upload a file for this assignment.")
        if assignment.submission_type == "text" and not submission_text.strip():
            raise ValueError("Please add your written response before submitting.")
        if assignment.submission_type == "file_or_text" and not (file_base64 or submission_text.strip()):
            raise ValueError("Please upload a file or add a written response.")

        now = fields.Datetime.now()
        is_late = bool(assignment.due_date and now > assignment.due_date)
        if is_late and not assignment.allow_late:
            raise ValueError("Late submissions are not allowed for this assignment.")

        Submission = request.env["lms.assignment.submission"].sudo()
        submission = Submission.search([
            ("assignment_id", "=", assignment.id),
            ("student_id", "=", user.id),
        ], limit=1)
        if submission and submission.submitted_on and not assignment.allow_resubmission:
            raise ValueError("Resubmission is not allowed for this assignment.")

        values = {
            "assignment_id": assignment.id,
            "student_id": user.id,
            "submission_text": submission_text,
            "submitted_on": now,
            "status": "late" if is_late else "submitted",
            "is_late": is_late,
        }
        if file_base64:
            values["submitted_file"] = file_base64
            values["submitted_filename"] = file_name or "submission"

        if submission:
            values.update({"graded_on": False, "feedback": False, "score": submission.score if submission.status == "graded" else 0.0})
            submission.write(values)
        else:
            submission = Submission.create(values)

        return {
            "message": "Assignment submitted successfully.",
            "submission_id": submission.id,
            "status": submission.status,
            "submitted_on": submission.submitted_on,
        }

    @http.route("/lms/api/doctor/save_assignment", type="json", auth="user", website=True, csrf=False, methods=["POST"])
    def doctor_save_assignment(self, course_id=None, assignment_id=None, values=None):
        values = values or {}
        Assignment = request.env["lms.assignment"].sudo()
        assignment = Assignment.browse(int(assignment_id)).exists() if assignment_id else Assignment
        course = assignment.course_id if assignment_id else request.env["lms.course"].browse(int(course_id)).exists()
        course = self._ensure_doctor_course_access(course)

        clean_values = {
            "name": (values.get("name") or "").strip(),
            "description": values.get("description") or "",
            "instructions": values.get("instructions") or "",
            "due_date": values.get("due_date") or False,
            "available_from": values.get("available_from") or False,
            "allow_late": bool(values.get("allow_late")),
            "allow_resubmission": bool(values.get("allow_resubmission")),
            "submission_type": values.get("submission_type") or "file_or_text",
            "max_score": float(values.get("max_score") or 100.0),
            "weight": float(values.get("weight") or 1.0),
            "is_published": bool(values.get("is_published", True)),
            "course_id": course.id,
        }
        if not clean_values["name"]:
            raise ValueError("Assignment title is required.")

        resource_file = (values.get("resource_file") or "").strip()
        if resource_file.startswith("data:"):
            resource_file = resource_file.split(",", 1)[1]
        if resource_file:
            clean_values["resource_file"] = resource_file
            clean_values["resource_filename"] = (values.get("resource_filename") or "assignment-resource").strip()

        record = assignment if assignment_id else Assignment.create(clean_values)
        if assignment_id:
            record.write(clean_values)

        return {"message": "Assignment saved.", "assignment_id": record.id}

    @http.route("/lms/api/doctor/grade_assignment", type="json", auth="user", website=True, csrf=False, methods=["POST"])
    def doctor_grade_assignment(self, submission_id, score=None, feedback=None, status=None):
        submission = request.env["lms.assignment.submission"].sudo().browse(int(submission_id)).exists()
        if not submission:
            raise ValueError("Submission not found.")
        self._ensure_doctor_course_access(submission.course_id)

        submission.write({
            "score": float(score or 0.0),
            "feedback": feedback or "",
            "graded_on": fields.Datetime.now(),
            "status": status or "graded",
        })

        return {
            "message": "Submission graded.",
            "submission_id": submission.id,
            "percentage": submission.percentage,
        }

    @http.route("/lms/api/doctor/create_attendance_session", type="json", auth="user", website=True, csrf=False, methods=["POST"])
    def doctor_create_attendance_session(self, course_id, name=None, session_date=None, lesson_id=None, notes=None):
        course = self._ensure_doctor_course_access(request.env["lms.course"].browse(int(course_id)).exists())
        lesson = self._attendance_lesson_for_course(course, lesson_id)
        roster_student_ids = self._course_roster_student_ids(course)
        session = request.env["lms.attendance.session"].sudo().create({
            "name": (name or "").strip() or (lesson.name if lesson else f"{course.name} Session"),
            "course_id": course.id,
            "lesson_id": lesson.id if lesson else False,
            "session_date": session_date or fields.Datetime.now(),
            "notes": (notes or "").strip(),
            "status": "draft",
        })

        for enrollment in course.enrollment_ids.sudo():
            request.env["lms.attendance.record"].sudo().create({
                "session_id": session.id,
                "student_id": enrollment.student_id.id,
                "status": "absent",
            })

        return {
            "message": "Attendance session created.",
            "session_id": session.id,
            "roster_count": len(roster_student_ids),
        }

    @http.route("/lms/api/doctor/save_attendance", type="json", auth="user", website=True, csrf=False, methods=["POST"])
    def doctor_save_attendance(self, session_id, records=None, close_session=False):
        session = request.env["lms.attendance.session"].sudo().browse(int(session_id)).exists()
        if not session:
            raise ValueError("Attendance session not found.")
        self._ensure_doctor_course_access(session.course_id)
        if session.status == "closed":
            raise ValueError("This attendance session is closed. Reopen it before making changes.")

        records = records or []
        Record = request.env["lms.attendance.record"].sudo()
        roster_student_ids = self._course_roster_student_ids(session.course_id)
        for row in records:
            student_id = int(row.get("student_id"))
            if student_id not in roster_student_ids:
                raise ValueError("One or more attendance rows do not belong to the selected course roster.")
            status = self._coerce_attendance_status(row.get("status"))
            note = (row.get("note") or "").strip()
            record = Record.search([("session_id", "=", session.id), ("student_id", "=", student_id)], limit=1)
            values = {
                "status": status,
                "note": note,
                "marked_on": fields.Datetime.now(),
            }
            if record:
                record.write(values)
            else:
                values.update({"session_id": session.id, "student_id": student_id})
                Record.create(values)

        if close_session:
            session.write({"status": "closed"})

        return {
            "message": "Attendance saved.",
            "session_id": session.id,
            "status": session.status,
            "present_count": session.present_count,
            "late_count": session.late_count,
            "absent_count": session.absent_count,
        }

    @http.route("/lms/api/doctor/reopen_attendance", type="json", auth="user", website=True, csrf=False, methods=["POST"])
    def doctor_reopen_attendance(self, session_id):
        session = request.env["lms.attendance.session"].sudo().browse(int(session_id)).exists()
        if not session:
            raise ValueError("Attendance session not found.")
        self._ensure_doctor_course_access(session.course_id)
        session.write({"status": "draft"})
        return {
            "message": "Attendance session reopened.",
            "session_id": session.id,
            "status": session.status,
        }
