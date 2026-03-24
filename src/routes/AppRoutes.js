import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import PrivateRoute from "../components/PrivateRoute";
import Layout from "../components/Layout";
import ListTracker from "../pages/tracker/List";
import AddTracker from "../pages/tracker/Create";
import ForgetPassword from "../pages/ForgetPassword";
import ResetPassword from "../pages/ResetPassword";
import RouteProgress from "../RouteProgress";
import PublicRoute from "./PublicRoute";
import Edit from "../pages/tracker/Edit";
import OHSCourse from "../pages/OHSCourses/List";
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

const AppRoutes = () => {
  return (
    <Suspense fallback={<div> <RouteProgress /></div>}>
      <Routes>
        <Route
          path="register"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />
        <Route
          path="reset-password/:id/:token"
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
          path="/forgot-password"
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
            path="dashboard/tracker"
            element={
              <PrivateRoute>
                <ListTracker />
              </PrivateRoute>
            }
          />
          <Route
            path="dashboard/tracker/create"
            element={
              <PrivateRoute>
                <AddTracker />
              </PrivateRoute>
            }
          />
          <Route
           path="/dashboard/tracker/edit/:id" 
            element={
              <PrivateRoute>
                <Edit />
              </PrivateRoute>
            }
          />
         
         
          <Route
            path="dashboard/course-videos"
            element={
              <PrivateRoute>
                <CourseVideoList />
              </PrivateRoute>
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
            path="dashboard/students_enroll/create"
            element={
              <PrivateRoute>
                <CreateStudentEnroll />
              </PrivateRoute>
            }
          />
            <Route
            path="dashboard/students_enroll/"
            element={
              <PrivateRoute>
                <EditStudentEnroll />
              </PrivateRoute>
            }
          />
           
          {
            /**   <Route
            path="dashboard/contact_us/"
            element={
              <PrivateRoute>
                <ContactUs />
              </PrivateRoute>
            }
          />  */
          }
           
            <Route
            path="dashboard/contact_us/"
            element={
              <PrivateRoute>
                <ContactUs />
              </PrivateRoute>
            }
          />
          <Route
            path="dashboard/teacher_enroll"
            element={
              <PrivateRoute>
                <ListTeacherEnroll />
              </PrivateRoute>
            }
          />
          <Route
            path="dashboard/teacher_enroll/create"
            element={
              <PrivateRoute>
                <CreateTeacherEnroll />
              </PrivateRoute>
            }
          />
          <Route
            path="dashboard/see_all_teacher_enroll"
            element={
              <PrivateRoute>
                <SeeAllTeachersEnroll />
              </PrivateRoute>
            }
          />
          <Route
            path="dashboard/assignment"
            element={
              <PrivateRoute>
                <ListAssignment/>
              </PrivateRoute>
            }
          />
          <Route
            path="dashboard/ohs_Course"
            element={
              <PrivateRoute>
                <OHSCourse/>
              </PrivateRoute>
            }
          />
          {/** 
          <Route
            path="dashboard/ohs_course_manage"
            element={
              <PrivateRoute>
                <OHSCourseManage />
              </PrivateRoute>
            }
          />*/}
          <Route
            path="dashboard/assignment/create"
            element={
              <PrivateRoute>
                <CreateAssignment/>
              </PrivateRoute>
            }
          />
          <Route
            path="dashboard/assignment/:id"
            element={
              <PrivateRoute>
                <EditAssignment/>
              </PrivateRoute>
            }
          />                
          <Route
            path="dashboard/teacher_enroll/:id"
            element={
              <PrivateRoute>
                <EditTeacherEnroll />
              </PrivateRoute>
            }
          />
           <Route
            path="dashboard/check_assignment/:id"
            element={
              <PrivateRoute>
                <CheckAssignment/>
              </PrivateRoute>
            }
          />
          <Route
            path="dashboard/google-meet"
            element={
              <PrivateRoute>
                <GoogleMeet />
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
          {/** 
          <Route
            path="dashboard/messages"
            element={
              <PrivateRoute>
                <AdminMessages />
              </PrivateRoute>
            }
          />
          */}
          <Route
            path="dashboard/teacher-info"
            element={
              <PrivateRoute>
                <TeacherInfoList />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
