import React, { useState } from 'react';
import { Modal } from './AdminPage';
import axios from 'axios';

export default function EditStudentModal({ student, dark, onClose, onUpdate, setToast }) {
  const [activeTab, setActiveTab] = useState('Personal');
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    name: student.name || '',
    middleName: student.middleName || '',
    lastName: student.lastName || '',
    dob: student.dob ? new Date(student.dob).toISOString().split('T')[0] : '',
    gender: student.gender || '',
    bloodGroup: student.bloodGroup || '',
    nationality: student.nationality || '',
    studentEmail: student.studentEmail || '',
    phone: student.phone || '', // Mobile
    
    guardianName: student.guardianName || '',
    motherName: student.motherName || '',
    parentRelationship: student.parentRelationship || 'Father',
    parentEmail: student.parentEmail || '',
    emergencyContact: student.emergencyContact || '',
    
    country: student.country || '',
    state: student.state || '',
    city: student.city || '',
    municipality: student.municipality || '',
    ward: student.ward || '',
    street: student.street || '',
    postalCode: student.postalCode || '',
    
    prevSchool: student.prevSchool || '',
    prevQualification: student.prevQualification || '',
    prevClass: student.prevClass || '',
    prevRoll: student.prevRoll || '',
    prevGpa: student.prevGpa || '',
    tcNumber: student.tcNumber || '',
    
    admissionDate: student.admissionDate ? new Date(student.admissionDate).toISOString().split('T')[0] : '',
    academicYear: student.academicYear || '',
    campus: student.campus || '',
    classId: student.classId || '',
    section: student.section || '',
    rollNumber: student.rollNumber || '',
    house: student.house || '',
    medium: student.medium || '',
    
    status: student.status || 'Active',
    avatar: null
  });

  const tabs = ['Personal', 'Academic', 'Guardian', 'Address'];

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const dbId = student.id_db || student.id;
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (form[key] !== null && form[key] !== undefined && form[key] !== '') {
          formData.append(key, form[key]);
        }
      });

      const token = localStorage.getItem('school_token');
      await axios.put(`https://school-backend-70ny.onrender.com/api/students/${dbId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      setToast({ message: 'Student updated successfully', type: 'success' });
      onUpdate();
      onClose();
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to update student', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = `w-full p-2 rounded-lg focus:ring-2 focus:ring-primary transition-all text-sm ${dark ? 'bg-[#1a1c1e] border border-[#3c4a46] text-white' : 'bg-surface border border-outline-variant text-[#1a1c1e]'}`;
  const labelClass = "block text-[11px] font-semibold mb-1";

  return (
    <Modal title={`Edit Profile: ${student.name}`} onClose={onClose} className="!max-w-[800px] !w-[95%]">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-48 flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 shrink-0">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-left rounded-lg text-sm font-semibold transition-colors whitespace-nowrap
                ${activeTab === tab 
                  ? 'bg-primary/10 text-primary' 
                  : (dark ? 'text-gray-400 hover:bg-[#3c4a46]' : 'text-gray-500 hover:bg-gray-100')}`}
            >
              {tab} Details
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4">
          <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar space-y-4">
            
            {activeTab === 'Personal' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelClass}>First Name *</label><input required type="text" value={form.name} onChange={e => handleInputChange('name', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Middle Name</label><input type="text" value={form.middleName} onChange={e => handleInputChange('middleName', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Last Name</label><input type="text" value={form.lastName} onChange={e => handleInputChange('lastName', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Date of Birth</label><input type="date" value={form.dob} onChange={e => handleInputChange('dob', e.target.value)} className={inputClass} /></div>
                <div>
                  <label className={labelClass}>Gender</label>
                  <select value={form.gender} onChange={e => handleInputChange('gender', e.target.value)} className={inputClass}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div><label className={labelClass}>Blood Group</label><input type="text" value={form.bloodGroup} onChange={e => handleInputChange('bloodGroup', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Nationality</label><input type="text" value={form.nationality} onChange={e => handleInputChange('nationality', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Student Email</label><input type="email" value={form.studentEmail} onChange={e => handleInputChange('studentEmail', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Student Phone *</label><input required type="text" value={form.phone} onChange={e => handleInputChange('phone', e.target.value)} className={inputClass} /></div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select value={form.status} onChange={e => handleInputChange('status', e.target.value)} className={inputClass}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className={labelClass}>Profile Photo / Avatar</label>
                  <input type="file" accept="image/*" onChange={e => handleInputChange('avatar', e.target.files[0])} className={inputClass} />
                  <p className={`text-xs mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Leave blank to keep current photo.</p>
                </div>
              </div>
            )}

            {activeTab === 'Academic' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelClass}>Admission Date</label><input type="date" value={form.admissionDate} onChange={e => handleInputChange('admissionDate', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Academic Year</label><input type="text" value={form.academicYear} onChange={e => handleInputChange('academicYear', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Campus</label><input type="text" value={form.campus} onChange={e => handleInputChange('campus', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Section</label><input type="text" value={form.section} onChange={e => handleInputChange('section', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Roll Number</label><input type="text" value={form.rollNumber} onChange={e => handleInputChange('rollNumber', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>House</label><input type="text" value={form.house} onChange={e => handleInputChange('house', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Medium</label><input type="text" value={form.medium} onChange={e => handleInputChange('medium', e.target.value)} className={inputClass} /></div>
                
                <div className="col-span-1 md:col-span-2 mt-4"><h3 className="font-semibold text-sm">Previous Academic Info</h3></div>
                <div><label className={labelClass}>Previous School</label><input type="text" value={form.prevSchool} onChange={e => handleInputChange('prevSchool', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Previous Qualification</label><input type="text" value={form.prevQualification} onChange={e => handleInputChange('prevQualification', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Previous Class</label><input type="text" value={form.prevClass} onChange={e => handleInputChange('prevClass', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Previous Roll</label><input type="text" value={form.prevRoll} onChange={e => handleInputChange('prevRoll', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Previous GPA</label><input type="text" value={form.prevGpa} onChange={e => handleInputChange('prevGpa', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>TC Number</label><input type="text" value={form.tcNumber} onChange={e => handleInputChange('tcNumber', e.target.value)} className={inputClass} /></div>
              </div>
            )}

            {activeTab === 'Guardian' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelClass}>Guardian Name *</label><input required type="text" value={form.guardianName} onChange={e => handleInputChange('guardianName', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Mother Name</label><input type="text" value={form.motherName} onChange={e => handleInputChange('motherName', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Parent Relationship</label><input type="text" value={form.parentRelationship} onChange={e => handleInputChange('parentRelationship', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Parent Email</label><input type="email" value={form.parentEmail} onChange={e => handleInputChange('parentEmail', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Emergency Contact *</label><input type="text" value={form.emergencyContact} onChange={e => handleInputChange('emergencyContact', e.target.value)} className={inputClass} /></div>
              </div>
            )}

            {activeTab === 'Address' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelClass}>Country</label><input type="text" value={form.country} onChange={e => handleInputChange('country', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>State/Province</label><input type="text" value={form.state} onChange={e => handleInputChange('state', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>City</label><input type="text" value={form.city} onChange={e => handleInputChange('city', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Municipality</label><input type="text" value={form.municipality} onChange={e => handleInputChange('municipality', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Ward</label><input type="text" value={form.ward} onChange={e => handleInputChange('ward', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Street</label><input type="text" value={form.street} onChange={e => handleInputChange('street', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Postal Code</label><input type="text" value={form.postalCode} onChange={e => handleInputChange('postalCode', e.target.value)} className={inputClass} /></div>
              </div>
            )}
            
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-outline-variant/30">
            <button type="button" onClick={onClose} disabled={submitting} className="px-4 py-2 rounded-lg text-sm font-semibold hover:bg-surface-container-high transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-6 py-2 rounded-lg text-sm font-semibold bg-[#006b5c] text-white hover:brightness-110 transition-colors flex items-center gap-2">
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
