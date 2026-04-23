import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import PrivateRoute from "../components/PrivateRoute";
import TeacherRoute from "../components/TeacherRoute";
import StudentRoute from "../components/StudentRoute";
import Layout from "../components/Layout";
import ListTracker from "../pages/tracker/List";
import AddTracker from "../pages/tracker/Create";
import ForgetPassword from "../pages/ForgetPassword";
import ResetPassword from "../pages/ResetPassword";
import RouteProgress from "../RouteProgress";
import PublicRoute from "./PublicRoute";
import Edit from "../pages/tracker/Edit";
import OHSCourse from "../pages/OHSCourses/List";
import StudentRegister from "../pages/EnrollStudent/StudentRegister";
import StudentLiveClass from "../pages/LiveClass/StudentLiveClass";
import AdminLiveClass from "../pages/LiveClass/AdminLiveClass";
// import GoogleMeet from "../pages/GoogleMeet";

const Signup = lazy(() => import("../pages/Signup"));
const Login = lazy(() => import("../pages/Login"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Profile = lazy(() => import("../pages/Profile"));
const NotFound = lazy(() => import("../pages/NotFound"));
// const ListStudentEnroll = lazy(() => import("../pages/EnrollStudent/List"));
// const ContactUs = lazy(() => import("../pages/"));
const CreateStudentEnroll = lazy(() => import("../pages/EnrollStudent/Create"));
const EditStudentEnroll = lazy(() => import("../pages/EnrollStudent/Edit"));
const ContactUs = lazy(() => import("../pages/ContactUs/Edit"));
const ListTeacherEnroll = lazy(() => import("../pages/EnrollTeacher/List"));
const CreateTeacherEnroll = lazy(() => import("../pages/EnrollTeacher/Create"));
const SeeAllTeachersEnroll = lazy(() => import("../pages/EnrollTeacher/SeeAllTeachess"));
const EditTeacherEnroll = lazy(() => import("../pages/EnrollTeacher/Edit"));
const EditAssignment = lazy(() => import("../pages/UploadAssingnmnet/Edit"));
const ListAssignment = lazy(() => import("../pages/UploadAssingnmnet/List"));
const  CreateAssignment = lazy(() => import("../pages/UploadAssingnmnet/Create"));
const  CheckAssignment = lazy(() => import("../pages/checkAssignmnet/List"));
const CourseVideoList = lazy(() => import("../pages/CourseVideo/List"));
const MyVideos = lazy(() => import("../pages/CourseVideo/MyVideos"));
const GoogleMeet = lazy(() => import("../pages/GoogleMeet"));
const AdminMessages = lazy(() => import("../pages/Messages/AdminMessages"));
const StudentChat = lazy(() => import("../pages/StudentLMS/StudentChat"));
const TeacherInfoList = lazy(() => import("../pages/TeacherInfo/List"));
const OHSCourseManage = lazy(() => import("../pages/OHSCourses/Manage"));
const PostJob = lazy(() => import("../pages/postJob/PostJob"));
const AllJobs = lazy(() => import("../pages/postJob/AllJobs"));
const JobsBoard = lazy(() => import("../pages/postJob/JobsBoard"));
const AdminCertificates = lazy(() => import("../pages/Certificates/AdminCertificates"));
const StudentCertificates = lazy(() => import("../pages/Certificates/StudentCertificates"));
const AdminForgotPassword = lazy(() => import("../pages/forgetADmin/AdminForgotPassword"));
const StudentRegistration = lazy(() => import("../pages/StudentLMS/StudentRegistration"));
const AdminStudentRegistrations = lazy(() => import("../pages/AdminStudentRegistrations"));
const AdminOHSDocument = lazy(() => import("../pages/AdminOHSDocument"));
const StudentOHSDocument = lazy(() => import("../pages/StudentOHSDocument"));

const AppRoutes = () => {
  return (
    <Suspense fallback={<div> <RouteProgress /></div>}>
      <Routes>
        <Route
          path="register-ohs-2006"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />
        <Route
          path="rooman-heacker-ohs-2006-forgot-password"
          element={
            <PublicRoute>
              <AdminForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="reset-password-ohs-2006/:id/:token"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />
        <Route
          path="login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password-ohs-2006"
          element={
            <PublicRoute>
              <ForgetPassword />
            </PublicRoute>
          }
/>
        {/* Directly apply PrivateRoute here */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route
            path="dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="dashboard/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />

          <Route
            path="dashboard/studentRegister"
            element={
              <TeacherRoute>
                <StudentRegister />
              </TeacherRoute>
            }
          />
                
          <Route
            path="dashboard/manage-videos"
            element={
              <TeacherRoute>
                <CourseVideoList />
              </TeacherRoute>
            }
          />
          <Route
            path="dashboard/my-videos"
            element={
              <PrivateRoute>
                <MyVideos />
              </PrivateRoute>
            }
          />
          <Route
            path="dashboard/certificates"
            element={
              <TeacherRoute>
                <AdminCertificates />
              </TeacherRoute>
            }
          />
          <Route
            path="dashboard/my-certificates"
            element={
              <StudentRoute>
                <StudentCertificates />
              </StudentRoute>
            }
          />
          <Route
            path="dashboard/students_enroll/create"
            element={
              <TeacherRoute>
                <CreateStudentEnroll />
              </TeacherRoute>
            }
          />
            <Route
            path="dashboard/students_enroll/"
            element={
              <TeacherRoute>
                <EditStudentEnroll />
              </TeacherRoute>
            }
          />
                  
        
          <Route
            path="dashboard/teacher_enroll/create"
            element={
              <TeacherRoute>
                <CreateTeacherEnroll />
              </TeacherRoute>
            }
          />
          <Route
          path="dashboard/teacher_enroll/:id"
          element={
            <TeacherRoute>
              <EditTeacherEnroll />
            </TeacherRoute>
          }
        />
          {/* <Route
            path="dashboard/see_all_teacher_enroll"
            element={
              <TeacherRoute>
                <SeeAllTeachersEnroll />
              </TeacherRoute>
            }
          /> */}
         
          <Route
            path="dashboard/ohs_Course"
            element={
              <PrivateRoute>
                <OHSCourse/>
              </PrivateRoute>
            }
          />
          {
          <Route
            path="dashboard/ohs_course_manage"
            element={
              <TeacherRoute>
                <OHSCourseManage />
              </TeacherRoute>
            }
          />}                       
          <Route
            path="dashboard/google-meet"
            element={
              <PrivateRoute>
                <GoogleMeet />
              </PrivateRoute>
            }
          />
          <Route
            path="dashboard/admin_live_class"
            element={
              <TeacherRoute>
                <AdminLiveClass />
              </TeacherRoute>
            }
          />
          <Route
            path="dashboard/student_live_class"
            element={
              <PrivateRoute>
                <StudentLiveClass />
              </PrivateRoute>
            }
          />
          <Route
            path="dashboard/student-chat"
            element={
              <PrivateRoute>
                <StudentChat />
              </PrivateRoute>
            }
          />
         
          <Route
            path="dashboard/messages"
            element={
              <TeacherRoute>
                <AdminMessages />
              </TeacherRoute>
            }
          />
       
          <Route
            path="dashboard/demo-class"
            element={
              <PrivateRoute>
                <TeacherInfoList />
              </PrivateRoute>
            }
          />
          <Route
            path="dashboard/post-job/:id"
            element={
              <TeacherRoute>
                <PostJob />
              </TeacherRoute>
            }
          />
          <Route
            path="dashboard/post-job"
            element={
              <TeacherRoute>
                <PostJob />
              </TeacherRoute>
            }
          />
          <Route
            path="dashboard/all-jobs"
            element={
              <TeacherRoute>
                <AllJobs />
              </TeacherRoute>
            }
          />
          <Route
            path="dashboard/jobs-board"
            element={
              <PrivateRoute>
                <JobsBoard />
              </PrivateRoute>
            }
          />
          <Route
            path="dashboard/student-registration"
            element={
              <StudentRoute>
                <StudentRegistration />
              </StudentRoute>
            }
          />
          <Route
            path="dashboard/admin-student-registrations"
            element={
              <TeacherRoute>
                <AdminStudentRegistrations />
              </TeacherRoute>
            }
          />
          <Route
            path="dashboard/admin-ohs-documents"
            element={
              <TeacherRoute>
                <AdminOHSDocument />
              </TeacherRoute>
            }
          />
          <Route
            path="dashboard/ohs-documents"
            element={
              <StudentRoute>
                <StudentOHSDocument />
              </StudentRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
