from odoo import http
from odoo.http import request, Response
import json


class LMSApi(http.Controller):
    @http.route('/lms/api/bootstrap', type='http', auth='public', methods=['GET'], csrf=False, sitemap=False)
    def lms_bootstrap(self, **kwargs):
        user = request.env.user
        if user._is_public():
            return Response(
                json.dumps({
                    "error": "login_required",
                    "message": "Please log in as a student.",
                }),
                status=401,
                content_type='application/json; charset=utf-8',
            )

        env = request.env
        student_id = user.id

        def read(model, domain, fields):
            model_env = env[model].sudo()
            safe_fields = [field for field in fields if field in model_env._fields]
            if not safe_fields:
                return []
            return model_env.search_read(domain, safe_fields)

        enrollments = read(
            'lms.enrollment',
            [('student_id', '=', student_id)],
            ['id', 'student_id', 'course_id', 'status', 'state', 'create_date'],
        )
        course_ids = [row['course_id'][0] for row in enrollments if row.get('course_id')]

        courses = read(
            'lms.course',
            [('id', 'in', course_ids)] if course_ids else [('id', '=', 0)],
            ['id', 'name', 'description', 'teacher_id'],
        )
        lessons = read(
            'lms.lesson',
            [('course_id', 'in', course_ids)] if course_ids else [('id', '=', 0)],
            ['id', 'name', 'title', 'course_id', 'sequence', 'video_url', 'description'],
        )
        announcements = read(
            'lms.announcement',
            [('course_id', 'in', course_ids)] if course_ids else [('id', '=', 0)],
            ['id', 'course_id', 'title', 'message', 'date', 'create_date'],
        )
        quizzes = read(
            'lms.quiz',
            [('course_id', 'in', course_ids)] if course_ids else [('id', '=', 0)],
            ['id', 'course_id', 'name', 'title', 'description', 'date', 'create_date'],
        )

        quiz_ids = [row['id'] for row in quizzes]
        questions = read(
            'lms.question',
            [('quiz_id', 'in', quiz_ids)] if quiz_ids else [('id', '=', 0)],
            ['id', 'quiz_id', 'name', 'title', 'question'],
        )

        quiz_results = read(
            'lms.quiz.result',
            [('student_id', '=', student_id)],
            ['id', 'quiz_id', 'score', 'state', 'status', 'date', 'create_date'],
        )
        result_ids = [row['id'] for row in quiz_results]
        quiz_result_lines = read(
            'lms.quiz.result.line',
            [('result_id', 'in', result_ids)] if result_ids else [('id', '=', 0)],
            ['id', 'result_id', 'question_id', 'answer', 'is_correct', 'score'],
        )

        payload = {
            "student": {
                "name": user.name,
            },
            "courses": courses,
            "lessons": lessons,
            "announcements": announcements,
            "enrollments": enrollments,
            "quizzes": quizzes,
            "questions": questions,
            "quiz_results": quiz_results,
            "quiz_result_lines": quiz_result_lines,
        }
        return Response(
            json.dumps(payload),
            content_type='application/json; charset=utf-8',
        )
