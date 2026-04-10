from odoo import http
from odoo.http import request


class LmsPortal(http.Controller):
    def _user_can_access_course(self, course, user):
        if not course:
            return False
        if course.teacher_id.id == user.id:
            return True
        enrollment = request.env['lms.enrollment'].sudo().search([
            ('course_id', '=', course.id),
            ('student_id', '=', user.id),
        ], limit=1)
        return bool(enrollment)

    @http.route('/my/courses', type='http', auth='user', website=True)
    def my_courses(self, **kwargs):
        user = request.env.user
        courses = request.env['lms.course'].sudo().search([
            '|',
            ('teacher_id', '=', user.id),
            ('enrollment_ids.student_id', '=', user.id),
        ])
        values = {
            'courses': courses,
        }
        return request.render('my_custom_lms.portal_my_courses', values)

    @http.route('/my/course/<int:course_id>', type='http', auth='user', website=True)
    def course_detail(self, course_id, **kwargs):
        user = request.env.user
        course = request.env['lms.course'].sudo().browse(course_id)
        if not self._user_can_access_course(course, user):
            return request.not_found()
        values = {
            'course': course,
            'lessons': course.lesson_ids,
            'announcements': course.announcement_ids,
            'quizzes': course.quiz_ids,
        }
        return request.render('my_custom_lms.portal_course_detail', values)

    @http.route('/my/course/<int:course_id>/lessons', type='http', auth='user', website=True)
    def course_lessons(self, course_id, **kwargs):
        user = request.env.user
        course = request.env['lms.course'].sudo().browse(course_id)
        if not self._user_can_access_course(course, user):
            return request.not_found()
        values = {
            'course': course,
            'lessons': course.lesson_ids,
        }
        return request.render('my_custom_lms.portal_course_lessons', values)

    @http.route('/my/course/<int:course_id>/quiz/<int:quiz_id>', type='http', auth='user', website=True, methods=['GET', 'POST'])
    def course_quiz(self, course_id, quiz_id, **post):
        user = request.env.user
        course = request.env['lms.course'].sudo().browse(course_id)
        quiz = request.env['lms.quiz'].sudo().browse(quiz_id)
        if not self._user_can_access_course(course, user):
            return request.not_found()
        if quiz.course_id.id != course.id:
            return request.not_found()

        if request.httprequest.method == 'POST':
            total = 0
            score = 0
            line_vals = []
            for question in quiz.question_ids:
                total += question.points
                key = 'q_%s' % question.id
                selected = post.get(key)
                if not selected:
                    continue
                is_correct = selected == question.correct_answer
                if is_correct:
                    score += question.points
                line_vals.append((0, 0, {
                    'question_id': question.id,
                    'selected_answer': selected,
                    'is_correct': is_correct,
                    'points': question.points if is_correct else 0,
                }))

            result = request.env['lms.quiz.result'].sudo().create({
                'student_id': user.id,
                'quiz_id': quiz.id,
                'score': score,
                'max_score': total,
                'line_ids': line_vals,
            })
            values = {
                'course': course,
                'quiz': quiz,
                'result': result,
            }
            return request.render('my_custom_lms.portal_quiz_result', values)

        values = {
            'course': course,
            'quiz': quiz,
            'questions': quiz.question_ids,
        }
        return request.render('my_custom_lms.portal_course_quiz', values)
