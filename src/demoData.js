const DEMO_DB_STORAGE_KEY = "xrevia-lms-demo-db";
const DEMO_ROLE_STORAGE_KEY = "xrevia-lms-demo-role";
const DEMO_ROLES = ["student", "teacher", "admin"];
const DEMO_VIEWER_MODE = {
  student: "student",
  teacher: "doctor",
  admin: "admin",
};

const clone = (value) => JSON.parse(JSON.stringify(value));
const average = (values) => {
  const filtered = values.map(Number).filter((value) => Number.isFinite(value));
  if (!filtered.length) return null;
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
};
const nowIso = () => new Date().toISOString();
const shiftDate = (days = 0, hours = 10, minutes = 0) => {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString();
};
const normalizeRole = (role) => (DEMO_ROLES.includes(role) ? role : "student");
const fileDataUrl = (label) => `data:text/plain;base64,${btoa(label)}`;

const seedDemoDatabase = () => ({
  users: [
    {
      id: 101,
      role: "student",
      name: "Fares Fadly",
      login: "fares.fadly@xrevia.edu",
      email: "fares.fadly@xrevia.edu",
      phone: "+90 555 120 3344",
      timezone: "Europe/Istanbul",
      language: "en_US",
      program: "Computer Science",
      semester: "Spring 2026",
      notifications: { announcements: true, quizzes: true, progress: true },
      last_login: shiftDate(0, 8, 15),
      create_date: shiftDate(-35, 9, 0),
      write_date: shiftDate(-1, 17, 20),
      login_date: shiftDate(0, 8, 15),
      avatar_url: "",
      password: "DemoPass123!",
    },
    {
      id: 102,
      role: "student",
      name: "Sara Mohamed",
      login: "sara.mohamed@xrevia.edu",
      email: "sara.mohamed@xrevia.edu",
      phone: "+90 555 220 1188",
      timezone: "Europe/Istanbul",
      language: "en_US",
      program: "Computer Science",
      semester: "Spring 2026",
      notifications: { announcements: true, quizzes: true, progress: true },
      last_login: shiftDate(-1, 18, 5),
      create_date: shiftDate(-28, 10, 0),
      write_date: shiftDate(-2, 14, 10),
      login_date: shiftDate(-1, 18, 5),
      avatar_url: "",
      password: "DemoPass123!",
    },
    {
      id: 103,
      role: "student",
      name: "Mona Ahmed",
      login: "mona.ahmed@xrevia.edu",
      email: "mona.ahmed@xrevia.edu",
      phone: "+90 555 337 0091",
      timezone: "Europe/Istanbul",
      language: "en_US",
      program: "Software Engineering",
      semester: "Spring 2026",
      notifications: { announcements: true, quizzes: true, progress: true },
      last_login: shiftDate(-1, 12, 45),
      create_date: shiftDate(-21, 11, 0),
      write_date: shiftDate(-3, 16, 0),
      login_date: shiftDate(-1, 12, 45),
      avatar_url: "",
      password: "DemoPass123!",
    },
    {
      id: 104,
      role: "student",
      name: "Youssef Tarek",
      login: "youssef.tarek@xrevia.edu",
      email: "youssef.tarek@xrevia.edu",
      phone: "+90 555 441 8899",
      timezone: "Europe/Istanbul",
      language: "en_US",
      program: "Data Science",
      semester: "Spring 2026",
      notifications: { announcements: true, quizzes: true, progress: false },
      last_login: shiftDate(-2, 20, 15),
      create_date: shiftDate(-17, 15, 0),
      write_date: shiftDate(-4, 12, 20),
      login_date: shiftDate(-2, 20, 15),
      avatar_url: "",
      password: "DemoPass123!",
    },
    {
      id: 201,
      role: "teacher",
      name: "Layla Hassan",
      login: "layla.hassan@xrevia.edu",
      email: "layla.hassan@xrevia.edu",
      phone: "+90 555 500 1111",
      timezone: "Europe/Istanbul",
      language: "en_US",
      notifications: { announcements: true, quizzes: true, progress: true },
      last_login: shiftDate(0, 7, 45),
      create_date: shiftDate(-90, 9, 0),
      write_date: shiftDate(-1, 18, 0),
      login_date: shiftDate(0, 7, 45),
      avatar_url: "",
      password: "DemoPass123!",
    },
    {
      id: 202,
      role: "teacher",
      name: "Omar Khaled",
      login: "omar.khaled@xrevia.edu",
      email: "omar.khaled@xrevia.edu",
      phone: "+90 555 600 2222",
      timezone: "Europe/Istanbul",
      language: "en_US",
      notifications: { announcements: true, quizzes: true, progress: true },
      last_login: shiftDate(-1, 9, 0),
      create_date: shiftDate(-110, 9, 0),
      write_date: shiftDate(-3, 13, 0),
      login_date: shiftDate(-1, 9, 0),
      avatar_url: "",
      password: "DemoPass123!",
    },
    {
      id: 301,
      role: "admin",
      name: "Ahmed Nabil",
      login: "ahmed.nabil@xrevia.edu",
      email: "ahmed.nabil@xrevia.edu",
      phone: "+90 555 700 3333",
      timezone: "Europe/Istanbul",
      language: "en_US",
      notifications: { announcements: true, quizzes: true, progress: true },
      last_login: shiftDate(0, 7, 30),
      create_date: shiftDate(-180, 9, 0),
      write_date: shiftDate(-1, 19, 0),
      login_date: shiftDate(0, 7, 30),
      avatar_url: "",
      password: "DemoPass123!",
    },
  ],
  courses: [
    {
      id: 401,
      name: "Data Structures",
      description: "Core algorithms, trees, hashing, and problem-solving strategies for efficient software systems.",
      teacher_id: 201,
      x_course_code: "CS 204",
      x_department: "Computer Science",
      x_term: "Spring 2026",
      x_status: "active",
      x_is_published: true,
      x_auto_enroll: false,
      cover_url: "",
      create_date: shiftDate(-60, 9, 0),
      write_date: shiftDate(-1, 17, 10),
    },
    {
      id: 402,
      name: "Software Engineering",
      description: "Product thinking, system design, collaboration, and delivery practices for production-ready software.",
      teacher_id: 201,
      x_course_code: "SE 301",
      x_department: "Software Engineering",
      x_term: "Spring 2026",
      x_status: "active",
      x_is_published: true,
      x_auto_enroll: false,
      cover_url: "",
      create_date: shiftDate(-58, 10, 0),
      write_date: shiftDate(-2, 15, 40),
    },
    {
      id: 403,
      name: "Artificial Intelligence",
      description: "Machine learning foundations, AI ethics, and practical problem-solving with intelligent systems.",
      teacher_id: 202,
      x_course_code: "AI 101",
      x_department: "Artificial Intelligence",
      x_term: "Spring 2026",
      x_status: "active",
      x_is_published: true,
      x_auto_enroll: false,
      cover_url: "",
      create_date: shiftDate(-50, 9, 0),
      write_date: shiftDate(-3, 11, 0),
    },
    {
      id: 404,
      name: "Database Systems",
      description: "Relational design, SQL optimization, transaction models, and scalable data architecture.",
      teacher_id: 202,
      x_course_code: "DB 220",
      x_department: "Data Science",
      x_term: "Spring 2026",
      x_status: "active",
      x_is_published: true,
      x_auto_enroll: false,
      cover_url: "",
      create_date: shiftDate(-47, 9, 0),
      write_date: shiftDate(-4, 12, 30),
    },
  ],
  lessons: [
    { id: 501, course_id: 401, name: "Arrays & Complexity", sequence: 1, x_module_title: "Module 1", x_week_label: "Week 1", x_topic_title: "Big-O", x_unit_title: "Foundations", video_url: "https://www.youtube.com/watch?v=V6mKVRU1evU", x_external_resource_url: "https://www.geeksforgeeks.org/time-complexities-of-all-sorting-algorithms/", content: "Understand arrays, memory layout, and time complexity tradeoffs.", file_filename: "arrays-guide.txt", file_url: fileDataUrl("Arrays and complexity guide") },
    { id: 502, course_id: 401, name: "Stacks & Queues", sequence: 2, x_module_title: "Module 1", x_week_label: "Week 2", x_topic_title: "Linear Structures", x_unit_title: "Operations", video_url: "https://www.youtube.com/watch?v=F1F2imiOJfk", x_external_resource_url: "https://visualgo.net/en/list", content: "Build intuition for LIFO/FIFO structures and common interview patterns.", file_filename: "stacks-queues.txt", file_url: fileDataUrl("Stacks and queues notes") },
    { id: 503, course_id: 401, name: "Trees & Traversal", sequence: 3, x_module_title: "Module 2", x_week_label: "Week 3", x_topic_title: "Trees", x_unit_title: "Traversal", video_url: "https://www.youtube.com/watch?v=oSWTXtMglKE", x_external_resource_url: "https://www.programiz.com/dsa/trees", content: "Work with binary trees, traversal patterns, and recursion.", file_filename: "trees-traversal.txt", file_url: fileDataUrl("Trees traversal notes") },
    { id: 601, course_id: 402, name: "Requirements & Discovery", sequence: 1, x_module_title: "Sprint 1", x_week_label: "Week 1", x_topic_title: "Discovery", x_unit_title: "Requirements", video_url: "https://www.youtube.com/watch?v=4sM3Gatc0iI", x_external_resource_url: "https://www.atlassian.com/agile/project-management/requirements", content: "Translate user needs into structured software requirements.", file_filename: "requirements-discovery.txt", file_url: fileDataUrl("Requirements discovery notes") },
    { id: 602, course_id: 402, name: "Architecture & APIs", sequence: 2, x_module_title: "Sprint 2", x_week_label: "Week 2", x_topic_title: "Architecture", x_unit_title: "Backend", video_url: "https://www.youtube.com/watch?v=JwSS70SZdyM", x_external_resource_url: "https://martinfowler.com/architecture/", content: "Plan service boundaries, architecture tradeoffs, and API contracts.", file_filename: "architecture-apis.txt", file_url: fileDataUrl("Architecture and APIs guide") },
    { id: 603, course_id: 402, name: "Testing & Release", sequence: 3, x_module_title: "Sprint 3", x_week_label: "Week 3", x_topic_title: "Quality", x_unit_title: "Release", video_url: "https://www.youtube.com/watch?v=QJqNYhiHysM", x_external_resource_url: "https://martinfowler.com/articles/practical-test-pyramid.html", content: "Create a reliable release pipeline with layered testing strategy.", file_filename: "testing-release.txt", file_url: fileDataUrl("Testing and release checklist") },
    { id: 701, course_id: 403, name: "Machine Learning Basics", sequence: 1, x_module_title: "Unit 1", x_week_label: "Week 1", x_topic_title: "ML", x_unit_title: "Basics", video_url: "https://www.youtube.com/watch?v=ukzFI9rgwfU", x_external_resource_url: "https://developers.google.com/machine-learning/crash-course", content: "Introduction to supervised learning, training data, and model evaluation.", file_filename: "ml-basics.txt", file_url: fileDataUrl("Machine learning basics") },
    { id: 702, course_id: 403, name: "Responsible AI", sequence: 2, x_module_title: "Unit 2", x_week_label: "Week 2", x_topic_title: "Ethics", x_unit_title: "Governance", video_url: "https://www.youtube.com/watch?v=tJQSyzBUAew", x_external_resource_url: "https://ai.google/responsibility/principles/", content: "Bias, transparency, and responsible deployment in university and industry contexts.", file_filename: "responsible-ai.txt", file_url: fileDataUrl("Responsible AI notes") },
    { id: 801, course_id: 404, name: "Relational Modeling", sequence: 1, x_module_title: "Module 1", x_week_label: "Week 1", x_topic_title: "Schema Design", x_unit_title: "ERD", video_url: "https://www.youtube.com/watch?v=ztHopE5Wnpc", x_external_resource_url: "https://www.postgresql.org/docs/current/ddl.html", content: "Design resilient schemas for academic and product databases.", file_filename: "relational-modeling.txt", file_url: fileDataUrl("Relational modeling notes") },
    { id: 802, course_id: 404, name: "Transactions & Consistency", sequence: 2, x_module_title: "Module 2", x_week_label: "Week 2", x_topic_title: "Transactions", x_unit_title: "ACID", video_url: "https://www.youtube.com/watch?v=5ZjhNTM8XU8", x_external_resource_url: "https://www.postgresql.org/docs/current/tutorial-transactions.html", content: "Explore transaction isolation, locking, and consistency guarantees.", file_filename: "transactions-consistency.txt", file_url: fileDataUrl("Transactions and consistency guide") },
  ],
  lessonProgress: [
    { id: 901, student_id: 101, lesson_id: 501, course_id: 401, status: "completed", progress_percent: 100, first_opened_on: shiftDate(-5, 9, 15), last_opened_on: shiftDate(-5, 10, 30), completed_on: shiftDate(-5, 10, 30) },
    { id: 902, student_id: 101, lesson_id: 502, course_id: 401, status: "in_progress", progress_percent: 65, first_opened_on: shiftDate(-2, 14, 0), last_opened_on: shiftDate(-1, 11, 45), completed_on: "" },
    { id: 903, student_id: 101, lesson_id: 601, course_id: 402, status: "in_progress", progress_percent: 35, first_opened_on: shiftDate(-1, 15, 20), last_opened_on: shiftDate(0, 9, 5), completed_on: "" },
    { id: 904, student_id: 102, lesson_id: 501, course_id: 401, status: "completed", progress_percent: 100, first_opened_on: shiftDate(-6, 9, 0), last_opened_on: shiftDate(-6, 10, 0), completed_on: shiftDate(-6, 10, 0) },
    { id: 905, student_id: 102, lesson_id: 502, course_id: 401, status: "completed", progress_percent: 100, first_opened_on: shiftDate(-4, 11, 0), last_opened_on: shiftDate(-4, 12, 0), completed_on: shiftDate(-4, 12, 0) },
    { id: 906, student_id: 103, lesson_id: 601, course_id: 402, status: "completed", progress_percent: 100, first_opened_on: shiftDate(-5, 10, 0), last_opened_on: shiftDate(-5, 11, 0), completed_on: shiftDate(-5, 11, 0) },
    { id: 907, student_id: 103, lesson_id: 602, course_id: 402, status: "in_progress", progress_percent: 55, first_opened_on: shiftDate(-2, 16, 0), last_opened_on: shiftDate(-1, 17, 10), completed_on: "" },
    { id: 908, student_id: 104, lesson_id: 701, course_id: 403, status: "completed", progress_percent: 100, first_opened_on: shiftDate(-7, 8, 30), last_opened_on: shiftDate(-7, 9, 45), completed_on: shiftDate(-7, 9, 45) },
    { id: 909, student_id: 104, lesson_id: 702, course_id: 403, status: "in_progress", progress_percent: 45, first_opened_on: shiftDate(-3, 9, 30), last_opened_on: shiftDate(-1, 13, 20), completed_on: "" },
  ],
  enrollments: [
    { id: 1001, student_id: 101, course_id: 401, status: "enrolled", enrolled_on: shiftDate(-45, 9, 0), create_date: shiftDate(-45, 9, 0) },
    { id: 1002, student_id: 101, course_id: 402, status: "enrolled", enrolled_on: shiftDate(-43, 9, 0), create_date: shiftDate(-43, 9, 0) },
    { id: 1003, student_id: 102, course_id: 401, status: "enrolled", enrolled_on: shiftDate(-44, 10, 0), create_date: shiftDate(-44, 10, 0) },
    { id: 1004, student_id: 103, course_id: 402, status: "enrolled", enrolled_on: shiftDate(-42, 10, 0), create_date: shiftDate(-42, 10, 0) },
    { id: 1005, student_id: 104, course_id: 403, status: "enrolled", enrolled_on: shiftDate(-39, 11, 0), create_date: shiftDate(-39, 11, 0) },
    { id: 1006, student_id: 103, course_id: 404, status: "enrolled", enrolled_on: shiftDate(-38, 11, 0), create_date: shiftDate(-38, 11, 0) },
  ],
  announcements: [
    { id: 1101, course_id: 401, title: "Project proposal deadline reminder", message: "Please upload your project proposal before tomorrow at 6 PM.", date: shiftDate(1, 18, 0), create_date: shiftDate(-1, 9, 0) },
    { id: 1102, course_id: 401, title: "Lecture slides uploaded", message: "Slides for Trees & Traversal are now available in course resources.", date: shiftDate(-1, 12, 0), create_date: shiftDate(-1, 12, 0) },
    { id: 1103, course_id: 402, title: "API design workshop moved", message: "Tomorrow's workshop moves to Lab B. Please review the new API brief beforehand.", date: shiftDate(0, 16, 0), create_date: shiftDate(-1, 13, 0) },
    { id: 1104, course_id: 403, title: "AI ethics panel next week", message: "A guest speaker will join next week's seminar on responsible AI governance.", date: shiftDate(3, 15, 0), create_date: shiftDate(-2, 14, 0) },
    { id: 1105, course_id: 404, title: "Database lab guide published", message: "The normalization and indexing lab guide is now available for download.", date: shiftDate(2, 11, 0), create_date: shiftDate(-2, 10, 0) },
  ],
  assignments: [
    { id: 1201, course_id: 401, teacher_id: 201, name: "Project Proposal", description: "Draft the first version of your project proposal.", instructions: "Submit a concise proposal covering the problem, approach, and evaluation plan.", available_from: shiftDate(-4, 8, 0), due_date: shiftDate(1, 18, 0), allow_late: true, allow_resubmission: true, submission_type: "file_or_text", max_score: 100, weight: 0.2, is_published: true, resource_filename: "proposal-brief.txt", resource_url: fileDataUrl("Project proposal brief"), create_date: shiftDate(-4, 8, 0), write_date: shiftDate(-1, 10, 0) },
    { id: 1202, course_id: 401, teacher_id: 201, name: "Traversal Worksheet", description: "Work through DFS and BFS exercises.", instructions: "Attach your written reasoning or upload a PDF solution.", available_from: shiftDate(-2, 9, 0), due_date: shiftDate(4, 17, 0), allow_late: false, allow_resubmission: false, submission_type: "file_or_text", max_score: 50, weight: 0.15, is_published: true, resource_filename: "traversal-worksheet.txt", resource_url: fileDataUrl("Traversal worksheet") , create_date: shiftDate(-2, 9, 0), write_date: shiftDate(-1, 9, 0) },
    { id: 1203, course_id: 402, teacher_id: 201, name: "API Design Review", description: "Review the provided API and propose improvements.", instructions: "Respond with a structured critique and at least three improvements.", available_from: shiftDate(-3, 8, 30), due_date: shiftDate(2, 19, 0), allow_late: true, allow_resubmission: true, submission_type: "text", max_score: 100, weight: 0.25, is_published: true, resource_filename: "api-review-brief.txt", resource_url: fileDataUrl("API review brief"), create_date: shiftDate(-3, 8, 30), write_date: shiftDate(-1, 8, 30) },
    { id: 1204, course_id: 403, teacher_id: 202, name: "Bias Reflection", description: "Reflect on model bias and mitigation strategies.", instructions: "Write a short reflection using one real-world example.", available_from: shiftDate(-1, 8, 0), due_date: shiftDate(5, 16, 0), allow_late: false, allow_resubmission: true, submission_type: "text", max_score: 40, weight: 0.1, is_published: true, resource_filename: "bias-reflection.txt", resource_url: fileDataUrl("Bias reflection brief"), create_date: shiftDate(-1, 8, 0), write_date: shiftDate(-1, 8, 0) },
  ],
  assignmentSubmissions: [
    { id: 1301, assignment_id: 1201, course_id: 401, student_id: 101, status: "graded", submitted_on: shiftDate(-1, 17, 15), graded_on: shiftDate(0, 9, 30), score: 91, percentage: 91, feedback: "Clear framing and a strong evaluation plan.", submitted_filename: "fares-proposal.txt", submitted_file_url: fileDataUrl("Fares proposal submission"), create_date: shiftDate(-1, 17, 15), write_date: shiftDate(0, 9, 30) },
    { id: 1302, assignment_id: 1201, course_id: 401, student_id: 102, status: "submitted", submitted_on: shiftDate(0, 8, 40), graded_on: "", score: null, percentage: null, feedback: "", submitted_filename: "sara-proposal.txt", submitted_file_url: fileDataUrl("Sara proposal submission"), create_date: shiftDate(0, 8, 40), write_date: shiftDate(0, 8, 40) },
    { id: 1303, assignment_id: 1203, course_id: 402, student_id: 101, status: "submitted", submitted_on: shiftDate(0, 11, 5), graded_on: "", score: null, percentage: null, feedback: "", submitted_filename: "fares-api-review.txt", submitted_file_url: fileDataUrl("Fares API review"), create_date: shiftDate(0, 11, 5), write_date: shiftDate(0, 11, 5) },
    { id: 1304, assignment_id: 1203, course_id: 402, student_id: 103, status: "graded", submitted_on: shiftDate(-1, 15, 0), graded_on: shiftDate(0, 8, 20), score: 88, percentage: 88, feedback: "Good architecture reasoning and API consistency analysis.", submitted_filename: "mona-api-review.txt", submitted_file_url: fileDataUrl("Mona API review"), create_date: shiftDate(-1, 15, 0), write_date: shiftDate(0, 8, 20) },
  ],
  quizzes: [
    { id: 1401, course_id: 401, name: "DS Foundations Check", x_attempt_limit: 2, x_available_from: shiftDate(-3, 8, 0), x_deadline: shiftDate(3, 18, 0), x_time_limit_minutes: 25, x_pass_percentage: 60, x_weight: 0.15, x_show_results: true, create_date: shiftDate(-3, 8, 0), write_date: shiftDate(-1, 10, 30) },
    { id: 1402, course_id: 402, name: "Software Lifecycle Quiz", x_attempt_limit: 2, x_available_from: shiftDate(-2, 8, 0), x_deadline: shiftDate(4, 18, 0), x_time_limit_minutes: 20, x_pass_percentage: 65, x_weight: 0.2, x_show_results: true, create_date: shiftDate(-2, 8, 0), write_date: shiftDate(-1, 12, 10) },
    { id: 1403, course_id: 403, name: "AI Ethics Check", x_attempt_limit: 1, x_available_from: shiftDate(-1, 9, 0), x_deadline: shiftDate(6, 17, 0), x_time_limit_minutes: 15, x_pass_percentage: 70, x_weight: 0.1, x_show_results: true, create_date: shiftDate(-1, 9, 0), write_date: shiftDate(-1, 14, 10) },
  ],
  questions: [
    { id: 1501, quiz_id: 1401, question_text: "Which structure uses LIFO ordering?", answer_a: "Stack", answer_b: "Queue", answer_c: "Heap", answer_d: "Graph", correct_answer: "a", points: 1 },
    { id: 1502, quiz_id: 1401, question_text: "Which traversal visits left, root, right?", answer_a: "Preorder", answer_b: "Inorder", answer_c: "Postorder", answer_d: "Level order", correct_answer: "b", points: 1 },
    { id: 1503, quiz_id: 1401, question_text: "Hash tables are strongest for which average operation?", answer_a: "O(log n) search", answer_b: "O(1) lookup", answer_c: "O(n) traversal", answer_d: "O(n log n) sorting", correct_answer: "b", points: 1 },
    { id: 1504, quiz_id: 1402, question_text: "Which artifact captures user stories and priorities?", answer_a: "Backlog", answer_b: "Deployment log", answer_c: "Trace file", answer_d: "Runbook", correct_answer: "a", points: 1 },
    { id: 1505, quiz_id: 1402, question_text: "Which practice protects release quality best?", answer_a: "Skip tests", answer_b: "Merge late", answer_c: "Automated testing", answer_d: "Deploy manually only", correct_answer: "c", points: 1 },
    { id: 1506, quiz_id: 1402, question_text: "Which API concern matters most for long-term maintainability?", answer_a: "Random naming", answer_b: "Consistent contracts", answer_c: "No versioning ever", answer_d: "Large payloads", correct_answer: "b", points: 1 },
    { id: 1507, quiz_id: 1403, question_text: "What helps reduce unfair model outcomes?", answer_a: "Ignore the dataset", answer_b: "Bias evaluation", answer_c: "Hide metrics", answer_d: "Skip documentation", correct_answer: "b", points: 1 },
    { id: 1508, quiz_id: 1403, question_text: "Responsible AI governance should include", answer_a: "Transparency", answer_b: "Silence", answer_c: "Randomness", answer_d: "No review", correct_answer: "a", points: 1 },
  ],
  quizResults: [
    { id: 1601, quiz_id: 1401, course_id: 401, student_id: 101, score: 2, max_score: 3, percentage: 66.7, passed: true, submitted_on: shiftDate(-1, 19, 5), create_date: shiftDate(-1, 19, 5) },
    { id: 1602, quiz_id: 1401, course_id: 401, student_id: 102, score: 3, max_score: 3, percentage: 100, passed: true, submitted_on: shiftDate(-2, 18, 0), create_date: shiftDate(-2, 18, 0) },
    { id: 1603, quiz_id: 1402, course_id: 402, student_id: 103, score: 3, max_score: 3, percentage: 100, passed: true, submitted_on: shiftDate(-1, 18, 30), create_date: shiftDate(-1, 18, 30) },
    { id: 1604, quiz_id: 1403, course_id: 403, student_id: 104, score: 2, max_score: 2, percentage: 100, passed: true, submitted_on: shiftDate(-1, 17, 0), create_date: shiftDate(-1, 17, 0) },
  ],
  quizResultLines: [
    { id: 1701, result_id: 1601, question_id: 1501, selected_answer: "a", is_correct: true, points: 1, create_date: shiftDate(-1, 19, 5) },
    { id: 1702, result_id: 1601, question_id: 1502, selected_answer: "b", is_correct: true, points: 1, create_date: shiftDate(-1, 19, 5) },
    { id: 1703, result_id: 1601, question_id: 1503, selected_answer: "a", is_correct: false, points: 0, create_date: shiftDate(-1, 19, 5) },
    { id: 1704, result_id: 1602, question_id: 1501, selected_answer: "a", is_correct: true, points: 1, create_date: shiftDate(-2, 18, 0) },
    { id: 1705, result_id: 1602, question_id: 1502, selected_answer: "b", is_correct: true, points: 1, create_date: shiftDate(-2, 18, 0) },
    { id: 1706, result_id: 1602, question_id: 1503, selected_answer: "b", is_correct: true, points: 1, create_date: shiftDate(-2, 18, 0) },
    { id: 1707, result_id: 1603, question_id: 1504, selected_answer: "a", is_correct: true, points: 1, create_date: shiftDate(-1, 18, 30) },
    { id: 1708, result_id: 1603, question_id: 1505, selected_answer: "c", is_correct: true, points: 1, create_date: shiftDate(-1, 18, 30) },
    { id: 1709, result_id: 1603, question_id: 1506, selected_answer: "b", is_correct: true, points: 1, create_date: shiftDate(-1, 18, 30) },
    { id: 1710, result_id: 1604, question_id: 1507, selected_answer: "b", is_correct: true, points: 1, create_date: shiftDate(-1, 17, 0) },
    { id: 1711, result_id: 1604, question_id: 1508, selected_answer: "a", is_correct: true, points: 1, create_date: shiftDate(-1, 17, 0) },
  ],
  attendanceSessions: [
    { id: 1801, course_id: 401, lesson_id: 502, name: "Week 6 Lab Check-In", session_date: shiftDate(-1, 10, 0), status: "closed", notes: "Lab attendance for stacks and queues." },
    { id: 1802, course_id: 402, lesson_id: 602, name: "API Workshop Attendance", session_date: shiftDate(0, 13, 0), status: "draft", notes: "Live workshop participation." },
    { id: 1803, course_id: 403, lesson_id: 702, name: "Ethics Seminar Attendance", session_date: shiftDate(-2, 11, 0), status: "closed", notes: "Panel discussion presence." },
  ],
  attendanceRecords: [
    { id: 1901, session_id: 1801, course_id: 401, student_id: 101, status: "present", note: "On time", marked_on: shiftDate(-1, 10, 10), create_date: shiftDate(-1, 10, 10) },
    { id: 1902, session_id: 1801, course_id: 401, student_id: 102, status: "late", note: "Arrived after warm-up", marked_on: shiftDate(-1, 10, 12), create_date: shiftDate(-1, 10, 12) },
    { id: 1903, session_id: 1803, course_id: 403, student_id: 104, status: "present", note: "Participated in the Q&A", marked_on: shiftDate(-2, 11, 10), create_date: shiftDate(-2, 11, 10) },
  ],
});

const loadDemoDatabase = () => {
  if (typeof window === "undefined") {
    return seedDemoDatabase();
  }

  try {
    const saved = window.localStorage.getItem(DEMO_DB_STORAGE_KEY);
    if (!saved) return seedDemoDatabase();
    return { ...seedDemoDatabase(), ...JSON.parse(saved) };
  } catch (error) {
    return seedDemoDatabase();
  }
};

let demoDb = loadDemoDatabase();

const persistDemoDatabase = () => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_DB_STORAGE_KEY, JSON.stringify(demoDb));
};

const resetDemoDatabase = () => {
  demoDb = seedDemoDatabase();
  persistDemoDatabase();
};

const nextId = (collection) => Math.max(0, ...demoDb[collection].map((row) => Number(row.id) || 0)) + 1;
const userById = () => new Map(demoDb.users.map((user) => [user.id, user]));
const courseById = () => new Map(demoDb.courses.map((course) => [course.id, course]));
const lessonById = () => new Map(demoDb.lessons.map((lesson) => [lesson.id, lesson]));
const quizById = () => new Map(demoDb.quizzes.map((quiz) => [quiz.id, quiz]));
const questionById = () => new Map(demoDb.questions.map((question) => [question.id, question]));
const assignmentById = () => new Map(demoDb.assignments.map((assignment) => [assignment.id, assignment]));
const sessionById = () => new Map(demoDb.attendanceSessions.map((session) => [session.id, session]));
const relation = (map, id, fallback = "Record") => [id, map.get(id)?.name || fallback];
const actorForRole = (role) => demoDb.users.find((user) => user.role === normalizeRole(role)) || demoDb.users[0];
const studentUsers = () => demoDb.users.filter((user) => user.role === "student");

const enrollmentStats = (enrollment) => {
  const lessons = demoDb.lessons.filter((lesson) => lesson.course_id === enrollment.course_id);
  const progressRows = demoDb.lessonProgress.filter(
    (row) => row.course_id === enrollment.course_id && row.student_id === enrollment.student_id,
  );
  const progressMap = new Map(progressRows.map((row) => [row.lesson_id, row]));
  const totalLessons = lessons.length;
  const completedLessons = lessons.filter((lesson) => (progressMap.get(lesson.id)?.progress_percent || 0) >= 100 || progressMap.get(lesson.id)?.status === "completed").length;
  const progress = totalLessons
    ? lessons.reduce((sum, lesson) => sum + (Number(progressMap.get(lesson.id)?.progress_percent) || 0), 0) / totalLessons
    : 0;
  const lastActivity = progressRows
    .map((row) => row.last_opened_on || row.completed_on || row.first_opened_on)
    .filter(Boolean)
    .sort()
    .at(-1) || enrollment.enrolled_on || enrollment.create_date || "";

  return {
    ...enrollment,
    progress: Math.round(progress),
    x_completed_lessons: completedLessons,
    x_total_lessons: totalLessons,
    x_last_activity_on: lastActivity,
  };
};

const buildComputedRows = () => {
  const users = userById();
  const courses = courseById();
  const lessons = lessonById();
  const quizzes = quizById();
  const questions = questionById();
  const assignments = assignmentById();
  const sessions = sessionById();

  const computedEnrollments = demoDb.enrollments.map(enrollmentStats);
  const enrollmentsByCourse = new Map();
  computedEnrollments.forEach((row) => {
    if (!enrollmentsByCourse.has(row.course_id)) enrollmentsByCourse.set(row.course_id, []);
    enrollmentsByCourse.get(row.course_id).push(row);
  });

  const lessonRows = demoDb.lessons.map((lesson) => {
    const progressRows = demoDb.lessonProgress.filter((row) => row.lesson_id === lesson.id);
    const totalStudents = enrollmentsByCourse.get(lesson.course_id)?.length || 0;
    const startedStudentCount = progressRows.filter((row) => (row.progress_percent || 0) > 0 || row.status !== "not_started").length;
    const completedStudentCount = progressRows.filter((row) => row.status === "completed" || (row.progress_percent || 0) >= 100).length;
    return {
      ...lesson,
      course_id: relation(courses, lesson.course_id, "Course"),
      x_started_student_count: startedStudentCount,
      x_completed_student_count: completedStudentCount,
      x_completion_rate: totalStudents ? (completedStudentCount / totalStudents) * 100 : 0,
    };
  });

  const attendanceSessionRows = demoDb.attendanceSessions.map((session) => {
    const records = demoDb.attendanceRecords.filter((row) => row.session_id === session.id);
    return {
      ...session,
      course_id: relation(courses, session.course_id, "Course"),
      lesson_id: session.lesson_id ? relation(lessons, session.lesson_id, "Lesson") : false,
      present_count: records.filter((record) => record.status === "present").length,
      late_count: records.filter((record) => record.status === "late").length,
      absent_count: records.filter((record) => record.status === "absent").length,
    };
  });

  const attendanceRecordRows = demoDb.attendanceRecords.map((record) => ({
    ...record,
    session_id: relation(sessions, record.session_id, "Session"),
    student_id: relation(users, record.student_id, "Student"),
    course_id: relation(courses, record.course_id, "Course"),
  }));

  const assignmentRows = demoDb.assignments.map((assignment) => {
    const submissions = demoDb.assignmentSubmissions.filter((row) => row.assignment_id === assignment.id);
    const graded = submissions.filter((row) => row.status === "graded" && row.percentage !== null && row.percentage !== undefined);
    const pending = submissions.filter((row) => ["submitted", "late"].includes(row.status));
    return {
      ...assignment,
      course_id: relation(courses, assignment.course_id, "Course"),
      teacher_id: relation(users, assignment.teacher_id, "Professor"),
      submission_count: submissions.length,
      graded_count: graded.length,
      pending_count: pending.length,
      average_percentage: average(graded.map((row) => row.percentage)),
    };
  });

  const assignmentSubmissionRows = demoDb.assignmentSubmissions.map((submission) => ({
    ...submission,
    assignment_id: relation(assignments, submission.assignment_id, "Assignment"),
    course_id: relation(courses, submission.course_id, "Course"),
    student_id: relation(users, submission.student_id, "Student"),
  }));

  const quizRows = demoDb.quizzes.map((quiz) => {
    const results = demoDb.quizResults.filter((row) => row.quiz_id === quiz.id);
    return {
      ...quiz,
      course_id: relation(courses, quiz.course_id, "Course"),
      total_questions: demoDb.questions.filter((row) => row.quiz_id === quiz.id).length,
      x_attempt_count: results.length,
      x_average_percentage: average(results.map((row) => row.percentage)),
      x_pass_rate: results.length ? (results.filter((row) => row.passed).length / results.length) * 100 : null,
    };
  });

  const questionRows = demoDb.questions.map((question) => ({
    ...question,
    quiz_id: relation(quizzes, question.quiz_id, "Quiz"),
  }));

  const quizResultRows = demoDb.quizResults.map((result) => ({
    ...result,
    quiz_id: relation(quizzes, result.quiz_id, "Quiz"),
    course_id: relation(courses, result.course_id, "Course"),
    student_id: relation(users, result.student_id, "Student"),
  }));

  const quizResultLineRows = demoDb.quizResultLines.map((line) => ({
    ...line,
    result_id: relation(new Map(demoDb.quizResults.map((result) => [result.id, { name: `Result ${result.id}` }])), line.result_id, "Result"),
    question_id: relation(questions, line.question_id, "Question"),
  }));

  const announcementRows = demoDb.announcements.map((announcement) => ({
    ...announcement,
    course_id: relation(courses, announcement.course_id, "Course"),
  }));

  const courseRows = demoDb.courses.map((course) => {
    const enrollments = computedEnrollments.filter((row) => row.course_id === course.id);
    const quizResults = demoDb.quizResults.filter((row) => row.course_id === course.id);
    const assignmentSubmissions = demoDb.assignmentSubmissions.filter((row) => row.course_id === course.id);
    const attendanceRecords = demoDb.attendanceRecords.filter((row) => row.course_id === course.id);
    const totalLessons = demoDb.lessons.filter((row) => row.course_id === course.id).length;
    const totalAssignments = demoDb.assignments.filter((row) => row.course_id === course.id).length;
    const totalQuizzes = demoDb.quizzes.filter((row) => row.course_id === course.id).length;
    const totalAnnouncements = demoDb.announcements.filter((row) => row.course_id === course.id).length;
    const totalAttendanceSessions = demoDb.attendanceSessions.filter((row) => row.course_id === course.id).length;
    const averageProgress = average(enrollments.map((row) => row.progress));
    const attendanceRate = attendanceRecords.length
      ? (attendanceRecords.filter((row) => ["present", "late"].includes(row.status)).length / attendanceRecords.length) * 100
      : null;
    const completionRate = average(
      enrollments.map((row) => {
        if (!row.x_total_lessons) return 0;
        return (row.x_completed_lessons / row.x_total_lessons) * 100;
      }),
    );
    return {
      ...course,
      teacher_id: relation(users, course.teacher_id, "Professor"),
      x_total_lessons: totalLessons,
      x_total_assignments: totalAssignments,
      x_total_quizzes: totalQuizzes,
      x_total_announcements: totalAnnouncements,
      x_total_attendance_sessions: totalAttendanceSessions,
      x_quiz_attempt_count: quizResults.length,
      x_average_percentage: average(quizResults.map((row) => row.percentage)),
      x_average_assignment_percentage: average(
        assignmentSubmissions.filter((row) => row.percentage !== null && row.percentage !== undefined).map((row) => row.percentage),
      ),
      x_active_student_count: enrollments.length,
      x_average_progress: averageProgress,
      x_attendance_rate: attendanceRate,
      x_completion_rate: completionRate,
      x_assignment_submission_count: assignmentSubmissions.length,
      x_pending_submission_count: assignmentSubmissions.filter((row) => ["submitted", "late"].includes(row.status)).length,
    };
  });

  return {
    users,
    computedEnrollments,
    courseRows,
    lessonRows,
    announcementRows,
    assignmentRows,
    assignmentSubmissionRows,
    attendanceSessionRows,
    attendanceRecordRows,
    quizRows,
    questionRows,
    quizResultRows,
    quizResultLineRows,
  };
};

const buildStudentPayload = (actor, computed) => {
  const enrollmentRows = computed.computedEnrollments.filter((row) => row.student_id === actor.id);
  const courseIds = new Set(enrollmentRows.map((row) => row.course_id));
  const quizIds = new Set(computed.quizRows.filter((row) => courseIds.has(row.course_id[0])).map((row) => row.id));
  const resultIds = new Set(computed.quizResultRows.filter((row) => row.student_id[0] === actor.id).map((row) => row.id));

  return {
    student: {
      name: actor.name,
      program: actor.program || "",
      semester: actor.semester || "",
      login: actor.login,
      email: actor.email,
      phone: actor.phone,
      timezone: actor.timezone,
      language: actor.language,
      last_login: actor.last_login,
      avatar_url: actor.avatar_url || "",
      has_avatar: Boolean(actor.avatar_url),
      notifications: actor.notifications,
    },
    viewer_mode: DEMO_VIEWER_MODE.student,
    lms_visibility: {
      dashboard: true,
      courses: true,
      lessons: true,
      announcements: true,
      enrollments: true,
      quizzes: true,
      questions: true,
      quizResults: true,
    },
    enrollments: enrollmentRows.map((row) => ({
      id: row.id,
      student_id: relation(computed.users, row.student_id, actor.name),
      course_id: relation(courseById(), row.course_id, "Course"),
      status: row.status,
      progress: row.progress,
      enrolled_on: row.enrolled_on,
      x_completed_lessons: row.x_completed_lessons,
      x_total_lessons: row.x_total_lessons,
      x_last_activity_on: row.x_last_activity_on,
    })),
    courses: computed.courseRows.filter((row) => courseIds.has(row.id)),
    lessons: computed.lessonRows.filter((row) => courseIds.has(row.course_id[0])),
    lesson_progress: demoDb.lessonProgress.filter((row) => row.student_id === actor.id && courseIds.has(row.course_id)).map((row) => ({
      id: row.id,
      student_id: relation(computed.users, row.student_id, actor.name),
      lesson_id: relation(lessonById(), row.lesson_id, "Lesson"),
      course_id: relation(courseById(), row.course_id, "Course"),
      status: row.status,
      progress_percent: row.progress_percent,
      first_opened_on: row.first_opened_on,
      last_opened_on: row.last_opened_on,
      completed_on: row.completed_on,
    })),
    announcements: computed.announcementRows.filter((row) => courseIds.has(row.course_id[0])),
    assignments: computed.assignmentRows.filter((row) => courseIds.has(row.course_id[0])),
    assignment_submissions: computed.assignmentSubmissionRows.filter((row) => row.student_id[0] === actor.id && courseIds.has(row.course_id[0])),
    attendance_sessions: computed.attendanceSessionRows.filter((row) => courseIds.has(row.course_id[0])),
    attendance_records: computed.attendanceRecordRows.filter((row) => row.student_id[0] === actor.id && courseIds.has(row.course_id[0])),
    quizzes: computed.quizRows.filter((row) => courseIds.has(row.course_id[0])),
    questions: computed.questionRows.filter((row) => quizIds.has(row.quiz_id[0])),
    quiz_results: computed.quizResultRows.filter((row) => row.student_id[0] === actor.id && courseIds.has(row.course_id[0])),
    quiz_result_lines: computed.quizResultLineRows.filter((row) => resultIds.has(row.result_id[0])),
    available_students: [],
  };
};

const buildStaffPayload = (actor, computed, role) => {
  const relevantCourseIds = new Set(
    role === "teacher"
      ? computed.courseRows.filter((row) => row.teacher_id[0] === actor.id).map((row) => row.id)
      : computed.courseRows.map((row) => row.id),
  );
  const relevantQuizIds = new Set(computed.quizRows.filter((row) => relevantCourseIds.has(row.course_id[0])).map((row) => row.id));
  const relevantResultIds = new Set(computed.quizResultRows.filter((row) => relevantCourseIds.has(row.course_id[0])).map((row) => row.id));

  return {
    student: {
      name: actor.name,
      program: role === "admin" ? "University Administration" : "Faculty of Computing",
      semester: "Spring 2026",
      login: actor.login,
      email: actor.email,
      phone: actor.phone,
      timezone: actor.timezone,
      language: actor.language,
      last_login: actor.last_login,
      avatar_url: actor.avatar_url || "",
      has_avatar: Boolean(actor.avatar_url),
      notifications: actor.notifications,
    },
    viewer_mode: DEMO_VIEWER_MODE[role],
    lms_visibility: {
      dashboard: true,
      courses: true,
      lessons: true,
      announcements: true,
      enrollments: true,
      quizzes: true,
      questions: true,
      quizResults: true,
    },
    enrollments: computed.computedEnrollments
      .filter((row) => relevantCourseIds.has(row.course_id))
      .map((row) => ({
        id: row.id,
        student_id: relation(computed.users, row.student_id, "Student"),
        course_id: relation(courseById(), row.course_id, "Course"),
        status: row.status,
        progress: row.progress,
        enrolled_on: row.enrolled_on,
        x_completed_lessons: row.x_completed_lessons,
        x_total_lessons: row.x_total_lessons,
        x_last_activity_on: row.x_last_activity_on,
      })),
    courses: computed.courseRows.filter((row) => relevantCourseIds.has(row.id)),
    lessons: computed.lessonRows.filter((row) => relevantCourseIds.has(row.course_id[0])),
    lesson_progress: demoDb.lessonProgress
      .filter((row) => relevantCourseIds.has(row.course_id))
      .map((row) => ({
        id: row.id,
        student_id: relation(computed.users, row.student_id, "Student"),
        lesson_id: relation(lessonById(), row.lesson_id, "Lesson"),
        course_id: relation(courseById(), row.course_id, "Course"),
        status: row.status,
        progress_percent: row.progress_percent,
        first_opened_on: row.first_opened_on,
        last_opened_on: row.last_opened_on,
        completed_on: row.completed_on,
      })),
    announcements: computed.announcementRows.filter((row) => relevantCourseIds.has(row.course_id[0])),
    assignments: computed.assignmentRows.filter((row) => relevantCourseIds.has(row.course_id[0])),
    assignment_submissions: computed.assignmentSubmissionRows.filter((row) => relevantCourseIds.has(row.course_id[0])),
    attendance_sessions: computed.attendanceSessionRows.filter((row) => relevantCourseIds.has(row.course_id[0])),
    attendance_records: computed.attendanceRecordRows.filter((row) => relevantCourseIds.has(row.course_id[0])),
    quizzes: computed.quizRows.filter((row) => relevantCourseIds.has(row.course_id[0])),
    questions: computed.questionRows.filter((row) => relevantQuizIds.has(row.quiz_id[0])),
    quiz_results: computed.quizResultRows.filter((row) => relevantCourseIds.has(row.course_id[0])),
    quiz_result_lines: computed.quizResultLineRows.filter((row) => relevantResultIds.has(row.result_id[0])),
    available_students: studentUsers().map((user) => ({
      id: user.id,
      name: user.name,
      login: user.login,
      email: user.email,
      x_lms_role: user.role,
      active: true,
      create_date: user.create_date,
      write_date: user.write_date,
      login_date: user.login_date,
    })),
  };
};

export const buildDemoPayload = (role = "student") => {
  const normalizedRole = normalizeRole(role);
  const actor = actorForRole(normalizedRole);
  const computed = buildComputedRows();
  return normalizedRole === "student" ? buildStudentPayload(actor, computed) : buildStaffPayload(actor, computed, normalizedRole);
};

export const isDemoEnvironment = () => {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get("mode") === "odoo") return false;
  if (params.get("mode") === "demo") return true;
  const host = window.location.hostname;
  return host.endsWith("github.io") || host === "localhost" || host === "127.0.0.1" || host === "";
};

export const getStoredDemoRole = () => {
  if (typeof window === "undefined") return "student";
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("role");
  if (DEMO_ROLES.includes(fromQuery)) {
    window.localStorage.setItem(DEMO_ROLE_STORAGE_KEY, fromQuery);
    return fromQuery;
  }
  return normalizeRole(window.localStorage.getItem(DEMO_ROLE_STORAGE_KEY) || "student");
};

export const setStoredDemoRole = (role) => {
  const normalizedRole = normalizeRole(role);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(DEMO_ROLE_STORAGE_KEY, normalizedRole);
  }
  return normalizedRole;
};

export const cycleStoredDemoRole = (currentRole) => {
  const index = DEMO_ROLES.indexOf(normalizeRole(currentRole));
  const nextRole = DEMO_ROLES[(index + 1) % DEMO_ROLES.length];
  return setStoredDemoRole(nextRole);
};

const actorPayload = (role) => {
  const actor = actorForRole(role);
  return {
    student: {
      name: actor.name,
      login: actor.login,
      email: actor.email,
      phone: actor.phone,
      timezone: actor.timezone,
      language: actor.language,
      last_login: actor.last_login,
      avatar_url: actor.avatar_url || "",
      has_avatar: Boolean(actor.avatar_url),
      notifications: actor.notifications,
    },
  };
};

const ensureTeacherCourse = (role, courseId) => {
  if (role !== "teacher") return;
  const actor = actorForRole(role);
  const course = demoDb.courses.find((row) => row.id === Number(courseId));
  if (course && course.teacher_id !== actor.id) {
    throw new Error("This demo teacher can only manage assigned courses.");
  }
};

export const demoApi = {
  reset: resetDemoDatabase,

  trackLesson(role, lessonId, action = "open", progressPercent = null) {
    const actor = actorForRole(role);
    const lesson = demoDb.lessons.find((row) => row.id === Number(lessonId));
    if (!lesson || actor.role !== "student") {
      throw new Error("Lesson progress is available only in student demo mode.");
    }

    let row = demoDb.lessonProgress.find((entry) => entry.lesson_id === lesson.id && entry.student_id === actor.id);
    if (!row) {
      row = {
        id: nextId("lessonProgress"),
        student_id: actor.id,
        lesson_id: lesson.id,
        course_id: lesson.course_id,
        status: "not_started",
        progress_percent: 0,
        first_opened_on: nowIso(),
        last_opened_on: nowIso(),
        completed_on: "",
      };
      demoDb.lessonProgress.push(row);
    }

    const nextProgress = progressPercent === null ? Math.max(Number(row.progress_percent) || 0, action === "open" ? 15 : 35) : Number(progressPercent);
    row.progress_percent = Math.min(100, Math.max(0, nextProgress || 0));
    row.status = row.progress_percent >= 100 ? "completed" : row.progress_percent > 0 ? "in_progress" : "not_started";
    row.last_opened_on = nowIso();
    if (!row.first_opened_on) row.first_opened_on = nowIso();
    row.completed_on = row.status === "completed" ? nowIso() : "";
    persistDemoDatabase();
    return { message: "Lesson progress updated." };
  },

  updateProfile(role, profile) {
    const actor = actorForRole(role);
    actor.name = profile.fullName?.trim() || actor.name;
    actor.email = profile.email?.trim() || "";
    actor.phone = profile.phone?.trim() || "";
    actor.notifications = { ...actor.notifications, ...(profile.notifications || {}) };
    actor.write_date = nowIso();
    persistDemoDatabase();
    return { message: "Profile updated.", ...actorPayload(role) };
  },

  updateAvatar(role, imageBase64, clear = false) {
    const actor = actorForRole(role);
    actor.avatar_url = clear ? "" : imageBase64 || actor.avatar_url || "";
    actor.write_date = nowIso();
    persistDemoDatabase();
    return { message: clear ? "Profile photo removed." : "Profile photo updated.", ...actorPayload(role) };
  },

  changePassword(role, currentPassword, newPassword) {
    const actor = actorForRole(role);
    if (actor.password !== currentPassword) {
      throw new Error("Your current password is incorrect.");
    }
    actor.password = newPassword;
    actor.write_date = nowIso();
    persistDemoDatabase();
    return { message: "Password updated successfully." };
  },

  saveCourse(role, courseId, values) {
    ensureTeacherCourse(role, courseId);
    const course = demoDb.courses.find((row) => row.id === Number(courseId));
    if (!course) throw new Error("Course not found.");
    Object.assign(course, values, { write_date: nowIso() });
    persistDemoDatabase();
    return { message: "Course updated." };
  },

  createLesson(role, values) {
    ensureTeacherCourse(role, values.course_id);
    demoDb.lessons.push({
      id: nextId("lessons"),
      ...values,
      create_date: nowIso(),
      write_date: nowIso(),
      file_filename: values.file_filename || "",
      file_url: values.file_url || "",
    });
    persistDemoDatabase();
    return { message: "Lesson created." };
  },

  updateLesson(role, lessonId, values) {
    const lesson = demoDb.lessons.find((row) => row.id === Number(lessonId));
    if (!lesson) throw new Error("Lesson not found.");
    ensureTeacherCourse(role, lesson.course_id);
    Object.assign(lesson, values, { write_date: nowIso() });
    persistDemoDatabase();
    return { message: "Lesson updated." };
  },

  deleteLesson(role, lessonId) {
    const lesson = demoDb.lessons.find((row) => row.id === Number(lessonId));
    if (!lesson) return { message: "Lesson deleted." };
    ensureTeacherCourse(role, lesson.course_id);
    demoDb.lessons = demoDb.lessons.filter((row) => row.id !== lesson.id);
    demoDb.lessonProgress = demoDb.lessonProgress.filter((row) => row.lesson_id !== lesson.id);
    demoDb.attendanceSessions = demoDb.attendanceSessions.map((session) => (session.lesson_id === lesson.id ? { ...session, lesson_id: null } : session));
    persistDemoDatabase();
    return { message: "Lesson deleted." };
  },

  createAnnouncement(role, values) {
    ensureTeacherCourse(role, values.course_id);
    demoDb.announcements.unshift({ id: nextId("announcements"), ...values, date: values.date || nowIso(), create_date: nowIso() });
    persistDemoDatabase();
    return { message: "Announcement created." };
  },

  updateAnnouncement(role, announcementId, values) {
    const announcement = demoDb.announcements.find((row) => row.id === Number(announcementId));
    if (!announcement) throw new Error("Announcement not found.");
    ensureTeacherCourse(role, announcement.course_id);
    Object.assign(announcement, values, { write_date: nowIso() });
    persistDemoDatabase();
    return { message: "Announcement updated." };
  },

  deleteAnnouncement(role, announcementId) {
    const announcement = demoDb.announcements.find((row) => row.id === Number(announcementId));
    if (announcement) ensureTeacherCourse(role, announcement.course_id);
    demoDb.announcements = demoDb.announcements.filter((row) => row.id !== Number(announcementId));
    persistDemoDatabase();
    return { message: "Announcement deleted." };
  },

  saveAssignment(role, courseId, values, assignmentId = null) {
    ensureTeacherCourse(role, courseId);
    const resourceUrl = values.resource_file || values.resource_url || values.resourceUrl || "";
    if (assignmentId) {
      const assignment = demoDb.assignments.find((row) => row.id === Number(assignmentId));
      if (!assignment) throw new Error("Assignment not found.");
      Object.assign(assignment, values, {
        course_id: Number(courseId),
        resource_url: resourceUrl || assignment.resource_url || "",
        write_date: nowIso(),
      });
      persistDemoDatabase();
      return { message: "Assignment updated." };
    }

    demoDb.assignments.unshift({
      id: nextId("assignments"),
      teacher_id: actorForRole(role).id,
      course_id: Number(courseId),
      ...values,
      resource_url: resourceUrl,
      create_date: nowIso(),
      write_date: nowIso(),
    });
    persistDemoDatabase();
    return { message: "Assignment created." };
  },

  deleteAssignment(role, assignmentId) {
    const assignment = demoDb.assignments.find((row) => row.id === Number(assignmentId));
    if (assignment) ensureTeacherCourse(role, assignment.course_id);
    demoDb.assignments = demoDb.assignments.filter((row) => row.id !== Number(assignmentId));
    demoDb.assignmentSubmissions = demoDb.assignmentSubmissions.filter((row) => row.assignment_id !== Number(assignmentId));
    persistDemoDatabase();
    return { message: "Assignment deleted." };
  },

  submitAssignment(role, assignmentId, submission) {
    const actor = actorForRole(role);
    if (actor.role !== "student") throw new Error("Assignments can only be submitted in student demo mode.");
    const assignment = demoDb.assignments.find((row) => row.id === Number(assignmentId));
    if (!assignment) throw new Error("Assignment not found.");

    const existing = demoDb.assignmentSubmissions.find((row) => row.assignment_id === assignment.id && row.student_id === actor.id);
    if (existing && !assignment.allow_resubmission) {
      throw new Error("This assignment no longer accepts resubmissions.");
    }

    const duePassed = assignment.due_date && new Date(assignment.due_date).getTime() < Date.now();
    if (duePassed && !assignment.allow_late) {
      throw new Error("The deadline has passed for this assignment.");
    }

    const payload = {
      assignment_id: assignment.id,
      course_id: assignment.course_id,
      student_id: actor.id,
      status: duePassed ? "late" : "submitted",
      submitted_on: nowIso(),
      graded_on: "",
      score: null,
      percentage: null,
      feedback: submission.submissionText || "Awaiting instructor review.",
      submitted_filename: submission.fileName || "submission.txt",
      submitted_file_url: submission.fileBase64 || fileDataUrl(submission.submissionText || "Assignment submission"),
      create_date: nowIso(),
      write_date: nowIso(),
    };

    if (existing) {
      Object.assign(existing, payload, { id: existing.id });
    } else {
      demoDb.assignmentSubmissions.unshift({ id: nextId("assignmentSubmissions"), ...payload });
    }
    persistDemoDatabase();
    return { message: "Assignment submitted successfully." };
  },

  gradeAssignment(role, submissionId, values) {
    const submission = demoDb.assignmentSubmissions.find((row) => row.id === Number(submissionId));
    if (!submission) throw new Error("Submission not found.");
    ensureTeacherCourse(role, submission.course_id);
    const assignment = demoDb.assignments.find((row) => row.id === submission.assignment_id);
    const maxScore = Number(assignment?.max_score) || 100;
    const score = Number(values.score) || 0;
    submission.score = score;
    submission.percentage = maxScore > 0 ? (score / maxScore) * 100 : score;
    submission.feedback = values.feedback || "";
    submission.status = values.status || "graded";
    submission.graded_on = nowIso();
    submission.write_date = nowIso();
    persistDemoDatabase();
    return { message: "Submission graded." };
  },

  createEnrollment(role, values) {
    ensureTeacherCourse(role, values.course_id);
    const exists = demoDb.enrollments.some(
      (row) => row.course_id === Number(values.course_id) && row.student_id === Number(values.student_id),
    );
    if (exists) {
      throw new Error("That student is already enrolled in this course.");
    }
    demoDb.enrollments.push({
      id: nextId("enrollments"),
      course_id: Number(values.course_id),
      student_id: Number(values.student_id),
      status: values.status || "enrolled",
      enrolled_on: nowIso(),
      create_date: nowIso(),
    });
    persistDemoDatabase();
    return { message: "Student enrolled successfully." };
  },

  deleteEnrollment(role, enrollmentId) {
    const enrollment = demoDb.enrollments.find((row) => row.id === Number(enrollmentId));
    if (enrollment) ensureTeacherCourse(role, enrollment.course_id);
    demoDb.enrollments = demoDb.enrollments.filter((row) => row.id !== Number(enrollmentId));
    persistDemoDatabase();
    return { message: "Enrollment removed." };
  },

  createAttendanceSession(role, values) {
    ensureTeacherCourse(role, values.courseId);
    demoDb.attendanceSessions.unshift({
      id: nextId("attendanceSessions"),
      course_id: Number(values.courseId),
      lesson_id: values.lessonId ? Number(values.lessonId) : null,
      name: values.name || "Attendance Session",
      session_date: values.sessionDate || nowIso(),
      status: "draft",
      notes: values.notes || "",
    });
    persistDemoDatabase();
    return { message: "Attendance session created." };
  },

  saveAttendance(role, sessionId, records, closeSession = false) {
    const session = demoDb.attendanceSessions.find((row) => row.id === Number(sessionId));
    if (!session) throw new Error("Attendance session not found.");
    ensureTeacherCourse(role, session.course_id);
    if (session.status === "closed") {
      throw new Error("This attendance session is closed. Reopen it before making changes.");
    }

    records.forEach((record) => {
      const isEnrolled = demoDb.enrollments.some(
        (row) => row.course_id === session.course_id && row.student_id === Number(record.student_id),
      );
      if (!isEnrolled) {
        throw new Error("One or more attendance rows do not belong to the selected course roster.");
      }
      const existing = demoDb.attendanceRecords.find(
        (row) => row.session_id === session.id && row.student_id === Number(record.student_id),
      );
      const payload = {
        session_id: session.id,
        course_id: session.course_id,
        student_id: Number(record.student_id),
        status: record.status || "present",
        note: record.note || "",
        marked_on: nowIso(),
        create_date: nowIso(),
      };
      if (existing) {
        Object.assign(existing, payload, { id: existing.id });
      } else {
        demoDb.attendanceRecords.push({ id: nextId("attendanceRecords"), ...payload });
      }
    });

    session.status = closeSession ? "closed" : "draft";
    persistDemoDatabase();
    return { message: closeSession ? "Attendance saved and session closed." : "Attendance saved." };
  },

  reopenAttendanceSession(role, sessionId) {
    const session = demoDb.attendanceSessions.find((row) => row.id === Number(sessionId));
    if (!session) throw new Error("Attendance session not found.");
    ensureTeacherCourse(role, session.course_id);
    session.status = "draft";
    persistDemoDatabase();
    return { message: "Attendance session reopened." };
  },

  deleteAttendanceSession(role, sessionId) {
    const session = demoDb.attendanceSessions.find((row) => row.id === Number(sessionId));
    if (session) ensureTeacherCourse(role, session.course_id);
    demoDb.attendanceSessions = demoDb.attendanceSessions.filter((row) => row.id !== Number(sessionId));
    demoDb.attendanceRecords = demoDb.attendanceRecords.filter((row) => row.session_id !== Number(sessionId));
    persistDemoDatabase();
    return { message: "Attendance session deleted." };
  },

  createQuiz(role, values) {
    ensureTeacherCourse(role, values.course_id);
    demoDb.quizzes.unshift({ id: nextId("quizzes"), ...values, course_id: Number(values.course_id), create_date: nowIso(), write_date: nowIso() });
    persistDemoDatabase();
    return { message: "Quiz created." };
  },

  updateQuiz(role, quizId, values) {
    const quiz = demoDb.quizzes.find((row) => row.id === Number(quizId));
    if (!quiz) throw new Error("Quiz not found.");
    ensureTeacherCourse(role, quiz.course_id);
    Object.assign(quiz, values, { write_date: nowIso() });
    persistDemoDatabase();
    return { message: "Quiz updated." };
  },

  deleteQuiz(role, quizId) {
    const quiz = demoDb.quizzes.find((row) => row.id === Number(quizId));
    if (quiz) ensureTeacherCourse(role, quiz.course_id);
    demoDb.quizzes = demoDb.quizzes.filter((row) => row.id !== Number(quizId));
    const questionIds = demoDb.questions.filter((row) => row.quiz_id === Number(quizId)).map((row) => row.id);
    const resultIds = demoDb.quizResults.filter((row) => row.quiz_id === Number(quizId)).map((row) => row.id);
    demoDb.questions = demoDb.questions.filter((row) => row.quiz_id !== Number(quizId));
    demoDb.quizResults = demoDb.quizResults.filter((row) => row.quiz_id !== Number(quizId));
    demoDb.quizResultLines = demoDb.quizResultLines.filter((row) => !resultIds.includes(row.result_id) && !questionIds.includes(row.question_id));
    persistDemoDatabase();
    return { message: "Quiz deleted." };
  },

  createQuestion(role, values) {
    const quiz = demoDb.quizzes.find((row) => row.id === Number(values.quiz_id));
    if (!quiz) throw new Error("Quiz not found.");
    ensureTeacherCourse(role, quiz.course_id);
    demoDb.questions.push({ id: nextId("questions"), ...values, quiz_id: Number(values.quiz_id) });
    persistDemoDatabase();
    return { message: "Question created." };
  },

  updateQuestion(role, questionId, values) {
    const question = demoDb.questions.find((row) => row.id === Number(questionId));
    if (!question) throw new Error("Question not found.");
    const quiz = demoDb.quizzes.find((row) => row.id === question.quiz_id);
    if (quiz) ensureTeacherCourse(role, quiz.course_id);
    Object.assign(question, values);
    persistDemoDatabase();
    return { message: "Question updated." };
  },

  deleteQuestion(role, questionId) {
    const question = demoDb.questions.find((row) => row.id === Number(questionId));
    if (question) {
      const quiz = demoDb.quizzes.find((row) => row.id === question.quiz_id);
      if (quiz) ensureTeacherCourse(role, quiz.course_id);
    }
    demoDb.questions = demoDb.questions.filter((row) => row.id !== Number(questionId));
    demoDb.quizResultLines = demoDb.quizResultLines.filter((row) => row.question_id !== Number(questionId));
    persistDemoDatabase();
    return { message: "Question deleted." };
  },

  submitQuiz(role, quizId, answers) {
    const actor = actorForRole(role);
    if (actor.role !== "student") throw new Error("Quizzes can only be submitted in student demo mode.");
    const quiz = demoDb.quizzes.find((row) => row.id === Number(quizId));
    if (!quiz) throw new Error("Quiz not found.");
    const quizQuestions = demoDb.questions.filter((row) => row.quiz_id === quiz.id);
    const attemptCount = demoDb.quizResults.filter((row) => row.quiz_id === quiz.id && row.student_id === actor.id).length;
    if (quiz.x_attempt_limit && attemptCount >= Number(quiz.x_attempt_limit)) {
      throw new Error("Attempt limit reached for this quiz.");
    }
    if (quiz.x_deadline && new Date(quiz.x_deadline).getTime() < Date.now()) {
      throw new Error("The quiz deadline has passed.");
    }

    const resultId = nextId("quizResults");
    let score = 0;
    quizQuestions.forEach((question) => {
      const selected = answers[question.id] || "";
      const isCorrect = selected === question.correct_answer;
      const points = isCorrect ? Number(question.points) || 1 : 0;
      score += points;
      demoDb.quizResultLines.push({
        id: nextId("quizResultLines"),
        result_id: resultId,
        question_id: question.id,
        selected_answer: selected,
        is_correct: isCorrect,
        points,
        create_date: nowIso(),
      });
    });
    const maxScore = quizQuestions.reduce((sum, question) => sum + (Number(question.points) || 1), 0);
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    demoDb.quizResults.unshift({
      id: resultId,
      quiz_id: quiz.id,
      course_id: quiz.course_id,
      student_id: actor.id,
      score,
      max_score: maxScore,
      percentage,
      passed: percentage >= (Number(quiz.x_pass_percentage) || 50),
      submitted_on: nowIso(),
      create_date: nowIso(),
    });
    persistDemoDatabase();
    return {
      message: "Quiz submitted successfully.",
      score: percentage,
      correct_count: quizQuestions.filter((question) => answers[question.id] === question.correct_answer).length,
      total_count: quizQuestions.length,
    };
  },
};
