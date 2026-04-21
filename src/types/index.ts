export interface Counselor {
  id: string
  name: string
  place?: string
  mobile: string
}

export interface Student {
  id: string
  registrationId: string
  name: string
  phone: string
  email?: string
  type: 'student' | 'madrasa_student'
  details?: StudentDetails
  aptitudeTest?: AptitudeTest
  notes: CounselorNote[]
}

export interface StudentDetails {
  [key: string]: any
}

export interface AptitudeTest {
  id: string
  studentRegistrationId: string
  responses: Record<string, any>
  result?: string
  createdAt: string
}

export interface CounselorNote {
  id: string
  note: string
  createdAt: string
  counselorName?: string
}

export interface LoginRequest {
  mobile: string
}

export interface LoginResponse {
  id: string
  name: string
}

export interface NoteRequest {
  counselorId: string
  studentRegistrationId: string
  note: string
}
