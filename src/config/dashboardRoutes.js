/** Shared home + profile (both roles) */
export const DASHBOARD_HOME = "/dashboard";
export const DASHBOARD_PROFILE = "/dashboard/profile";

/** Teacher/admin area — do not share these paths with student pages */
export const ADMIN_PREFIX = "/dashboard/admin";

/** Student LMS area — do not share these paths with admin pages */
export const STUDENT_PREFIX = "/dashboard/student";

export const adminRoutes = {
  studentRegister: `${ADMIN_PREFIX}/student-register`,
  courseVideos: `${ADMIN_PREFIX}/course-videos`,
  studentsEnroll: `${ADMIN_PREFIX}/students-enroll`,
  studentsEnrollCreate: `${ADMIN_PREFIX}/students-enroll/create`,
  teacherEnrollCreate: `${ADMIN_PREFIX}/teacher-enroll/create`,
  teacherEnroll: (id) => `${ADMIN_PREFIX}/teacher-enroll/${id}`,
  teachers: `${ADMIN_PREFIX}/teachers`,
  ohsCourseManage: `${ADMIN_PREFIX}/ohs-course-manage`,
  liveClass: `${ADMIN_PREFIX}/live-class`,
  postJob: `${ADMIN_PREFIX}/post-job`,
  postJobEdit: (id) => `${ADMIN_PREFIX}/post-job/${id}`,
  allJobs: `${ADMIN_PREFIX}/all-jobs`,
  messages: `${ADMIN_PREFIX}/messages`,
  teacherInfo: `${ADMIN_PREFIX}/teacher-info`,
};

export const studentRoutes = {
  myVideos: `${STUDENT_PREFIX}/my-videos`,
  liveClass: `${STUDENT_PREFIX}/live-class`,
  googleMeet: `${STUDENT_PREFIX}/google-meet`,
  ohsCourse: `${STUDENT_PREFIX}/ohs-course`,
  jobsBoard: `${STUDENT_PREFIX}/jobs-board`,
  chat: `${STUDENT_PREFIX}/chat`,
  teacherInfo: `${STUDENT_PREFIX}/teacher-info`,
};
