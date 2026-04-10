from odoo import http
from odoo.http import request


class LmsWebsite(http.Controller):
    def _check_access(self, course, user):
        if not course:
            return False
        if course.teacher_id.id == user.id:
            return True
        enrollment = request.env['lms.enrollment'].sudo().search([
            ('course_id', '=', course.id),
            ('student_id', '=', user.id),
        ], limit=1)
        return bool(enrollment)

    @http.route('/', type='http', auth='user', website=True)
    def home(self, **kwargs):
        courses = request.env['lms.course'].sudo().search([])
        return request.render('xrevia_lms_vue.lms_index', {
            'courses': courses,
        })

    @http.route('/courses/<int:course_id>', type='http', auth='user', website=True)
    def course_detail(self, course_id, **kwargs):
        course = request.env['lms.course'].sudo().browse(course_id)
        if not self._check_access(course, request.env.user):
            return request.redirect('/web/login?redirect=/%s' % course_id)
        return request.render('my_custom_lms.website_course_detail', {
            'course': course,
            'lessons': course.lesson_ids,
            'quizzes': course.quiz_ids,
            'announcements': course.announcement_ids,
        })

    @http.route('/courses/<int:course_id>/lesson/<int:lesson_id>', type='http', auth='user', website=True)
    def course_lesson(self, course_id, lesson_id, **kwargs):
        course = request.env['lms.course'].sudo().browse(course_id)
        lesson = request.env['lms.lesson'].sudo().browse(lesson_id)
        if not self._check_access(course, request.env.user):
            return request.redirect('/web/login?redirect=/%s' % course_id)
        return request.render('my_custom_lms.website_lesson', {
            'course': course,
            'lesson': lesson,
        })

    @http.route('/courses/<int:course_id>/quiz/<int:quiz_id>', type='http', auth='user', website=True, methods=['GET', 'POST'])
    def course_quiz(self, course_id, quiz_id, **post):
        course = request.env['lms.course'].sudo().browse(course_id)
        quiz = request.env['lms.quiz'].sudo().browse(quiz_id)
        if not self._check_access(course, request.env.user):
            return request.redirect('/web/login?redirect=/%s' % course_id)
        if quiz.course_id.id != course.id:
            return request.not_found()

        if request.httprequest.method == 'POST':
            total = 0
            score = 0
            line_vals = []
            for question in quiz.question_ids:
                total += question.points
                selected = post.get('q_%s' % question.id)
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
                'student_id': request.env.user.id,
                'quiz_id': quiz.id,
                'score': score,
                'max_score': total,
                'line_ids': line_vals,
            })
            return request.render('my_custom_lms.website_quiz_result', {
                'course': course,
                'quiz': quiz,
                'result': result,
            })

        return request.render('my_custom_lms.website_quiz', {
            'course': course,
            'quiz': quiz,
            'questions': quiz.question_ids,
        })

# LMS API (student portal)
from odoo import http
from odoo.http import request, Response
import json

class LMSApi(http.Controller):
    @http.route('/lms/api/bootstrap', type='http', auth='user', methods=['GET'], website=True, csrf=False)
    def lms_bootstrap(self, **kwargs):
        env = request.env
        user = env.user
        partner = user.partner_id
        partner_id = partner.id

        def read(model, domain, fields):
            m = env[model].sudo()
            safe = [f for f in fields if f in m._fields]
            if not safe:
                return []
            return m.search_read(domain, safe)

        enrollments = read('lms.enrollment', [('student_id', '=', partner_id)], ['id','student_id','course_id','status','state','create_date'])
        course_ids = [e['course_id'][0] for e in enrollments if e.get('course_id')]

        courses = read('lms.course', [('id','in',course_ids)] if course_ids else [('id','=',0)], ['id','name','description','teacher_id'])
        lessons = read('lms.lesson', [('course_id','in',course_ids)] if course_ids else [('id','=',0)], ['id','name','title','course_id','sequence','video_url','description'])
        announcements = read('lms.announcement', [('course_id','in',course_ids)] if course_ids else [('id','=',0)], ['id','course_id','title','message','date','create_date'])
        quizzes = read('lms.quiz', [('course_id','in',course_ids)] if course_ids else [('id','=',0)], ['id','course_id','name','title','description','date','create_date'])

        quiz_ids = [q['id'] for q in quizzes]
        questions = read('lms.question', [('quiz_id','in',quiz_ids)] if quiz_ids else [('id','=',0)], ['id','quiz_id','name','title','question'])

        quiz_results = read('lms.quiz.result', [('student_id','=',partner_id)], ['id','quiz_id','score','state','status','date','create_date'])
        result_ids = [r['id'] for r in quiz_results]
        quiz_result_lines = read('lms.quiz.result.line', [('result_id','in',result_ids)] if result_ids else [('id','=',0)], ['id','result_id','question_id','answer','is_correct','score'])

        student = {
            "name": user.name,
            "program": getattr(partner, 'program', '') if hasattr(partner, 'program') else "",
            "semester": getattr(partner, 'semester', '') if hasattr(partner, 'semester') else "",
        }

        payload = {
            "student": student,
            "courses": courses,
            "lessons": lessons,
            "announcements": announcements,
            "enrollments": enrollments,
            "quizzes": quizzes,
            "questions": questions,
            "quiz_results": quiz_results,
            "quiz_result_lines": quiz_result_lines,
        }
        return Response(json.dumps(payload), content_type='application/json; charset=utf-8')
