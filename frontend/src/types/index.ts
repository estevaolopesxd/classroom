// Auth
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: "Admin" | "Student";
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface TokenResponse {
  accessToken: string;
  expiresIn: number;
  user: User;
}

// Courses
export interface Course {
  id: string;
  title: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  status: "Draft" | "Published" | "Archived";
  isForSale: boolean;
  price?: number;
  currency: string;
  level?: string;
  durationMinutes?: number;
  totalModules: number;
  totalLessons: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseDetail extends Course {
  modules: Module[];
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  isIntro: boolean;
  totalLessons: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  type: "Video" | "Text" | "LiveStream";
  order: number;
  durationSeconds?: number;
  isFreePreview: boolean;
  videoId?: string;
  videoHlsKey?: string;
  videoStatus?: {
    status: string;
    hlsKey?: string;
    thumbnailKey?: string;
    durationSeconds?: number;
  };
  textContent?: string;
}

// Video
export interface Video {
  id: string;
  title?: string;
  hlsUrl?: string;
  thumbnailUrl?: string;
  status: "Pending" | "Processing" | "Ready" | "Failed";
  durationSeconds?: number;
  sizeBytes?: number;
  createdAt: string;
}

export interface UploadInitResponse {
  videoId: string;
  uploadId: string;
  parts: Array<{ partNumber: number; url: string }>;
  chunkSize: number;
}

// Progress
export interface LessonProgress {
  lessonId: string;
  title: string;
  isCompleted: boolean;
  watchedSeconds: number;
  durationSeconds?: number;
  lastWatchedAt?: string;
}

export interface CourseProgress {
  courseId: string;
  courseTitle: string;
  totalLessons: number;
  completedLessons: number;
  percentComplete: number;
  modules: ModuleProgress[];
}

export interface ModuleProgress {
  moduleId: string;
  title: string;
  totalLessons: number;
  completedLessons: number;
  lessons: LessonProgress[];
}

export interface ContinueWatching {
  courseId: string;
  courseTitle: string;
  courseThumbnailUrl?: string;
  moduleId: string;
  moduleTitle: string;
  lessonId: string;
  lessonTitle: string;
  watchedSeconds: number;
  durationSeconds?: number;
  lastWatchedAt: string;
}

// Payments
export interface Purchase {
  id: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  currency: string;
  status: string;
  purchasedAt?: string;
  createdAt: string;
}

// Stream
export interface LiveStream {
  id: string;
  title: string;
  streamKey: string;
  hlsUrl?: string;
  status: "Scheduled" | "Live" | "Ended";
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
}

// Theme
export interface Theme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  fontFamily: string;
  logoUrl?: string;
  faviconUrl?: string;
  platformName: string;
}

// Admin
export interface AdminDashboard {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  recentCourses: Course[];
  recentUsers: User[];
}

// Pagination
export interface PagedResponse<T> {
  data: T[];
  total: number;
}
