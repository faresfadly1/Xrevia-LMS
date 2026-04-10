document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("xrevia_loggedIn");
      document.getElementById("loginContainer")?.classList.remove("hidden");
      document.getElementById("appContainer")?.classList.add("hidden");
    });
  }

  console.log("XREVIA_DEBUG: JS loaded");
  window.XREVIA_DEBUG = true;
  const COURSES = [
    { id: 1, code: "CS101", name: "Computer Science 101", instructor: "Dr. Alan Turing", schedule: "Mon/Wed 10:00 AM", credits: 3 },
    { id: 2, code: "WD201", name: "Web Development", instructor: "Prof. Ada Lovelace", schedule: "Tue/Thu 2:00 PM", credits: 4 },
    { id: 3, code: "DS301", name: "Data Structures", instructor: "Dr. Donald Knuth", schedule: "Mon/Wed 1:00 PM", credits: 3 },
    { id: 4, code: "AI401", name: "Artificial Intelligence", instructor: "Prof. Geoffrey Hinton", schedule: "Fri 9:00 AM", credits: 3 }
  ];

  const DEFAULT_ASSIGNMENTS = [
    { id: 1, courseId: 1, title: "Programming Basics Assignment", dueDate: "2026-04-10", status: "pending" },
    { id: 2, courseId: 1, title: "Algorithm Analysis", dueDate: "2026-04-15", status: "submitted" },
    { id: 3, courseId: 2, title: "HTML/CSS Project", dueDate: "2026-04-12", status: "pending" },
    { id: 4, courseId: 2, title: "JavaScript Interactive Website", dueDate: "2026-04-20", status: "pending" },
    { id: 5, courseId: 3, title: "Binary Tree Implementation", dueDate: "2026-04-08", status: "submitted" },
    { id: 6, courseId: 3, title: "Sorting Algorithms", dueDate: "2026-04-18", status: "pending" },
    { id: 7, courseId: 4, title: "Neural Network Basics", dueDate: "2026-04-25", status: "pending" }
  ];

  const GRADES = [
    { courseId: 1, letterGrade: "A-", percentage: 91, credits: 3 },
    { courseId: 2, letterGrade: "B+", percentage: 88, credits: 4 },
    { courseId: 3, letterGrade: "A", percentage: 94, credits: 3 },
    { courseId: 4, letterGrade: "In Progress", percentage: null, credits: 3 }
  ];

  const ANNOUNCEMENTS = [
    { id: 1, title: "Spring Break Schedule", content: "University closed April 5-9. No classes.", date: "Apr 1, 2026" },
    { id: 2, title: "Final Exam Registration", content: "Register for finals by April 20 via portal.", date: "Mar 28, 2026" },
    { id: 3, title: "Career Fair 2026", content: "Tech recruiters on campus April 22. Bring resumes!", date: "Mar 30, 2026" }
  ];

  const STUDENT_INFO = {
    fullName: "Emma Watson",
    studentId: "XRV-2407CS",
    email: "student@xrevia.com",
    program: "B.Sc. Computer Science",
    enrollmentYear: "2024"
  };

  function loadAssignments() {
    const stored = localStorage.getItem("xrevia_assignments");
    if (stored) {
      try { return JSON.parse(stored); } catch(e) { return [...DEFAULT_ASSIGNMENTS]; }
    }
    return [...DEFAULT_ASSIGNMENTS];
  }

  function saveAssignments(assignments) {
    localStorage.setItem("xrevia_assignments", JSON.stringify(assignments));
  }

  let currentAssignments = loadAssignments();

  function getCourseName(courseId) {
    const course = COURSES.find(c => c.id === courseId);
    return course ? course.name : "Unknown Course";
  }

  function renderDashboard() {
    const container = document.getElementById("dashboardView");
    const upcomingAssignments = currentAssignments
      .filter(a => a.status === "pending")
      .sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 4);

    const totalCourses = COURSES.length;
    const completedAssignments = currentAssignments.filter(a => a.status === "submitted").length;
    const totalAssignments = currentAssignments.length;
    const completionRate = totalAssignments ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 class="text-2xl font-bold text-gray-800">Welcome back, ${STUDENT_INFO.fullName}!</h2>
                <p class="text-gray-500 text-sm mt-1">${STUDENT_INFO.studentId} • ${STUDENT_INFO.program}</p>
              </div>
              <div class="bg-[#0B2B40]/10 rounded-full px-4 py-2">
                <span class="text-sm font-medium">Spring 2026</span>
              </div>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
              <div class="bg-gray-50 rounded-xl p-3 text-center"><p class="text-2xl font-bold text-[#0B2B40]">${totalCourses}</p><p class="text-xs text-gray-500">Enrolled Courses</p></div>
              <div class="bg-gray-50 rounded-xl p-3 text-center"><p class="text-2xl font-bold text-[#0B2B40]">${completedAssignments}/${totalAssignments}</p><p class="text-xs text-gray-500">Assignments Done</p></div>
              <div class="bg-gray-50 rounded-xl p-3 text-center"><p class="text-2xl font-bold text-[#0B2B40]">${completionRate}%</p><p class="text-xs text-gray-500">Completion Rate</p></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderCourses() {
    const container = document.getElementById("coursesView");
    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${COURSES.map(course => `
          <div class="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 card-hover transition-smooth">
            <div class="flex justify-between items-start">
              <div>
                <span class="bg-[#0B2B40]/10 text-[#0B2B40] text-xs font-bold px-2 py-1 rounded">${course.code}</span>
                <h3 class="text-xl font-bold mt-2">${course.name}</h3>
              </div>
            </div>
            <div class="mt-3 space-y-1 text-sm text-gray-600">
              <p>${course.instructor}</p>
              <p>${course.schedule}</p>
              <p>${course.credits} Credits</p>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderAssignments() {
    const container = document.getElementById("assignmentsView");
    container.innerHTML = `
      <div class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <h2 class="text-2xl font-bold text-gray-800">Course Assignments</h2>
        <div class="overflow-x-auto mt-5">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignment</th>
                <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-100">
              ${currentAssignments.map(ass => {
                const course = getCourseName(ass.courseId);
                const dueFormatted = new Date(ass.dueDate).toLocaleDateString();
                return `
                  <tr class="hover:bg-gray-50">
                    <td class="px-5 py-3 font-medium text-gray-800">${ass.title}</td>
                    <td class="px-5 py-3 text-gray-600">${course}</td>
                    <td class="px-5 py-3 text-gray-600">${dueFormatted}</td>
                    <td class="px-5 py-3">${ass.status}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderGrades() {
    const container = document.getElementById("gradesView");
    const gradeRows = GRADES.map(grade => {
      const course = COURSES.find(c => c.id === grade.courseId);
      if (!course) return '';
      const percentageDisplay = grade.percentage !== null ? `${grade.percentage}%` : '—';
      return `
        <tr class="border-b">
          <td class="px-5 py-3 font-medium">${course.code} - ${course.name}</td>
          <td class="px-5 py-3">${grade.letterGrade}</td>
          <td class="px-5 py-3">${percentageDisplay}</td>
          <td class="px-5 py-3">${grade.credits}</td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <h2 class="text-xl font-bold">Academic Performance</h2>
        <div class="overflow-x-auto mt-4">
          <table class="min-w-full">
            <thead class="bg-gray-50">
              <tr><th class="px-5 py-3 text-left text-xs font-medium">Course</th><th class="px-5 py-3 text-left text-xs font-medium">Grade</th><th class="px-5 py-3 text-left text-xs font-medium">Score</th><th class="px-5 py-3 text-left text-xs font-medium">Credits</th></tr>
            </thead>
            <tbody>${gradeRows}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  function setActiveView(viewId) {
    document.querySelectorAll('.view-section').forEach(section => section.classList.add('hidden'));
    document.getElementById(`${viewId}View`).classList.remove('hidden');

    document.querySelectorAll('.nav-tab').forEach(tab => {
      const navVal = tab.getAttribute('data-nav');
      if (navVal === viewId) {
        tab.classList.add('bg-white/20', 'text-white', 'font-semibold');
        tab.classList.remove('text-white/80');
      } else {
        tab.classList.remove('bg-white/20', 'text-white', 'font-semibold');
        tab.classList.add('text-white/80');
      }
    });

    if (viewId === 'dashboard') renderDashboard();
    else if (viewId === 'courses') renderCourses();
    else if (viewId === 'assignments') renderAssignments();
    else if (viewId === 'grades') renderGrades();
  }

  function handleLogin(email, password) {
    if (email === "student@xrevia.com" && password === "password123") {
      localStorage.setItem("xrevia_loggedIn", "true");
      document.getElementById("loginContainer").classList.add("hidden");
      document.getElementById("appContainer").classList.remove("hidden");
      setActiveView("dashboard");
    } else {
      document.getElementById("loginError").classList.remove("hidden");
    }
  }

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      alert("XREVIA_DEBUG: login submit fired");
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();
      const pwd = document.getElementById("loginPassword").value;
      handleLogin(email, pwd);
    });
  }

  document.querySelectorAll(".nav-tab").forEach(btn => {
    btn.addEventListener("click", function() {
      const view = this.getAttribute("data-nav");
      if (view) setActiveView(view);
    });
  });

  const logged = localStorage.getItem("xrevia_loggedIn") === "true";
  if (logged) {
    document.getElementById("loginContainer").classList.add("hidden");
    document.getElementById("appContainer").classList.remove("hidden");
    setActiveView("dashboard");
  }
});
