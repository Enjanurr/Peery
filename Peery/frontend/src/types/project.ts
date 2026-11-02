export type EvaluationState = 'NOT_OPEN' | 'OPEN' | 'CLOSED';

export interface StudentSummary {
  id: number;
  fullName: string;
  email: string;
}

export interface Team {
  id: number;
  name: string;
  members: StudentSummary[];
}

export interface Project {
  id: number;
  title: string;
  description: string | null;
  evalStartDate: string;
  evalEndDate: string;
  teamCount: number;
  studentCount: number;
  createdAt: string;
}

export interface ProjectDetail extends Project {
  teams: Team[];
}

export interface ProjectPayload {
  title: string;
  description: string;
  evalStartDate: string;
  evalEndDate: string;
}

export interface StudentTeamInfo {
  id: number;
  name: string;
  teammates: StudentSummary[];
}

export interface StudentProject {
  id: number;
  title: string;
  description: string | null;
  evalStartDate: string;
  evalEndDate: string;
  team: StudentTeamInfo | null;
}