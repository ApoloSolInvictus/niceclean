export type JobStatus = "available" | "scheduled" | "in_progress" | "finished";
export type RequestStatus = "new" | "quoted" | "confirmed" | "closed";

export type ServiceItem = {
  id: string;
  title: string;
  short: string;
  detail: string;
  image: string;
  priceHint: string;
};

export type ServiceRequest = {
  id: string;
  serviceType: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  propertyType: string;
  preferredDate: string;
  preferredTime: string;
  address: string;
  wazeUrl: string;
  apartment: string;
  entryInstructions: string;
  cleaningInstructions: string;
  notes: string;
  status: RequestStatus;
  createdAt?: unknown;
  assignedJobId?: string;
};

export type CleanerProfile = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  nationalId: string;
  districts: string;
  experience: string;
  availability: string;
  hourlyRate: string;
  cvUrl?: string;
  cvName?: string;
  createdAt?: unknown;
  status: "pending" | "approved" | "inactive";
};

export type CleaningJob = {
  id: string;
  serviceType: string;
  customerName: string;
  customerPhone: string;
  wazeUrl: string;
  address: string;
  apartment: string;
  entryInstructions: string;
  cleaningInstructions: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  estimatedHours: number;
  payRate: number;
  notes: string;
  status: JobStatus;
  acceptedBy?: string;
  acceptedByName?: string;
  acceptedByPhone?: string;
  acceptedAt?: unknown;
  startedAt?: unknown;
  finishedAt?: unknown;
  requestId?: string;
  createdAt?: unknown;
};
