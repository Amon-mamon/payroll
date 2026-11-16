import type { OrganizationSummary, Role } from "@/types";

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: Role;
  is_superuser: boolean;
  is_active: boolean;
  employee_id: string | null;
  organization: OrganizationSummary | null;
}

export interface AuthResponse {
  user: User;
  access_token: string;
}
