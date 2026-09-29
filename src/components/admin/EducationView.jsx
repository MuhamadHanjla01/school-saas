import { ResourcePage } from '../shared/AdminWorkspace';

export const EDUCATION_VIEWS = {
  'Campuses': 'campuses', 'Departments': 'departments', 'Programs': 'programs',
  'Academic Terms': 'terms', 'Program Courses': 'courses', 'Enrollment History': 'enrollments',
  'Hostel Rooms': 'rooms', 'Hostel Allocations': 'allocations',
  'Transport Stops': 'stops', 'Transport Assignments': 'transport',
  'Staff Leave': 'leave', 'Payroll': 'payroll',
  'Individual Invoices': 'invoices', 'Invoice Receipts': 'receipts',
};
export default function EducationView({ view }) {
  return <ResourcePage key={view} endpoint={`/api/education/${EDUCATION_VIEWS[view]}`} />;
}
