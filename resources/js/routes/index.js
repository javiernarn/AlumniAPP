import { DashboardPage } from "../pages/admin/dashboard"
import PublicPages404 from "../pages/ErrorPages/PublicPages404"
import Pages402 from "../pages/ErrorPages/Pages402"
import Pages404 from "../pages/ErrorPages/Pages404"
import { LoginPage,PublicHomePage, AlumniRegistration, AnswerQuizPage, ImageQuizPage, PublicEventsPage, PublicAnnouncementsPage, PublicGalleryPage, PublicJobPostsPage, PublicOccServicesPage,InstallPwaPage, PublicContactPage, PublicCreditsPage,} from "../pages/auth"
import { MainPage } from "../pages/Main"
import AlumniList from "../pages/admin/alumni/AlumniList"
import AlumniEvents from "../pages/admin/events/AlumniEvents"
import AlumniQuestionsPage from "../pages/admin/questions/AlumniQuestionsPage"
import ProfilePage from "../pages/admin/ProfilePage"

import { DepartmentHeadsPage, DepartmentDashboardPage } from "../pages/admin/department-heads"
import AdminAlumniMessages from "../pages/admin/messages/AdminAlumniMessages"
import { AuditLogPage } from "../pages/admin/audit-log"

import AdminAlumniJobPostPage from "../pages/admin/JobPost/AdminAlumniJobPostPage"
import GalleryPage from "../pages/admin/Gallery/galleryPage"
import AboutPage from "../pages/admin/About/AboutPage"
import FaqPage from "../pages/admin/Faq/FaqPage"  
import FaqPublicPage from "../pages/admin/Faq/FaqPublicPage"

import AnnouncementsPage from "../pages/admin/Announcement/AnnouncementsPage"
import AboutPublicPage from "../pages/admin/About/AboutPublicPage"
import HomePage from "../pages/admin/Home/homePage"
import { AtmsFeedbackReportsPage } from "../pages/admin/Feedback"
// import AssistantPage from "../pages/admin/AiAssistant/AssistantPage"
// import PublicHomePage from "../pages/admin/Home/PublicHomePage"

const authRoutes = [
  { path: "/PublicHomePage", component: PublicHomePage },
  { path: "/login", component: LoginPage },
  { path: "/register", component: AlumniRegistration },
  { path: "/answer-question", component: AnswerQuizPage },
  { path: "/image-quiz", component: ImageQuizPage },
  { path: "/public-events", component: PublicEventsPage  },
  { path: "/public-announcements", component: PublicAnnouncementsPage  },
  { path: "/public-gallery", component: PublicGalleryPage  },
  { path: "/public-job-posts", component: PublicJobPostsPage  },
  { path: "/occ-services", component: PublicOccServicesPage  },
  { path: "/install-pwa", component: InstallPwaPage },
  { path: "/public-contact", component: PublicContactPage },
  { path: "/public-credits", component: PublicCreditsPage },
]

const adminRoutes = [
  { path: "/home", component: HomePage },
  { path: "/admin-dashboard", component: DashboardPage },
  { path: "/alumni", component: AlumniList },
  { path: "/events", component: AlumniEvents },
  { path: "/questions", component: AlumniQuestionsPage },
  { path: "/department-heads", component: DepartmentHeadsPage },
  { path: "/department-dashboard", component: DepartmentDashboardPage },
  { path: "/messages", component: AdminAlumniMessages },
  { path: "/job-posts", component: AdminAlumniJobPostPage },
  { path: "/audit-logs", component: AuditLogPage },
  { path: "/feedback-reports", component: AtmsFeedbackReportsPage },
  { path: "/gallery", component: GalleryPage },
  { path: "/about", component: AboutPage },
   { path: "/faq", component: FaqPage },
   {path: "/announcements", component: AnnouncementsPage}, 
    //  { path: "/assistance", component: AssistantPage },
    
]

const alumniRoutes = [
   { path: "/home", component: HomePage },
  { path: "/alumni", component: AlumniList },
  { path: "/events", component: AlumniEvents },
  { path: "/profile", component: ProfilePage },
  { path: "/messages", component: AdminAlumniMessages },
  { path: "/job-posts", component: AdminAlumniJobPostPage },
  { path: "/gallery", component: GalleryPage },
    { path: "/about", component: AboutPage },
    { path: "/faq", component: FaqPage },
       {path: "/announcements", component: AnnouncementsPage}, 
    //  { path: "/assistance", component: AssistantPage },
]

const noLayoutRoutes = [
  { path: "/404", component: Pages404 },
  { path: "/402", component: Pages402 },
  { path: "/", component: MainPage },
  { path: "/public-faq", component: FaqPublicPage },
  { path: "/public-about", component: AboutPublicPage },
  { path: "/public-404", component: PublicPages404 },
  { path: "*", component: PublicPages404 },
]



export { noLayoutRoutes, authRoutes, adminRoutes, alumniRoutes }