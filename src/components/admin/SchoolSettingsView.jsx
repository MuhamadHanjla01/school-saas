import { SettingsPage } from '../shared/AdminWorkspace';
import { useAuth } from '../../context/AuthContext';
import '../shared/AdminWorkspace.css';
export default function SchoolSettingsView(){const {reloadUser}=useAuth();return <SettingsPage endpoint="/api/school-admin/settings" onSaved={reloadUser} />;}
