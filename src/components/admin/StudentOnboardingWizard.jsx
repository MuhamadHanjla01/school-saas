import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Toast } from './AdminPage';
import { useAuth } from '../../context/AuthContext';

export default function StudentOnboardingWizard({ dark, onClose, classes, onComplete }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    // Step 1
    name: '',
    middleName: '',
    lastName: '',
    dob: '',
    gender: '',
    bloodGroup: '',
    nationality: '',
    studentEmail: '',
    phone: '', // Student Mobile
    guardianName: '', // Father/Guardian
    motherName: '',
    parentRelationship: 'Father',
    parentEmail: '',
    emergencyContact: '',
    country: '',
    state: '',
    city: '',
    municipality: '',
    ward: '',
    street: '',
    postalCode: '',

    // Step 2
    prevSchool: '',
    prevQualification: '',
    prevClass: '',
    prevRoll: '',
    prevGpa: '',
    tcNumber: '',
    admissionDate: new Date().toISOString().split('T')[0],
    academicYear: '2026-2027',
    campus: '',
    classId: '',
    section: '',
    rollNumber: '',
    house: '',
    medium: 'English',
    shift: 'Morning',
    transportRequired: false,
    hostelRequired: false,

    // Step 3
    password: '',
    confirmPassword: '',
    acceptPolicies: false
  });

  // Load Draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('studentOnboardingDraft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setForm(parsed);
      } catch (err) {
        console.error('Failed to parse saved draft', err);
      }
    }
  }, []);

  const saveDraft = () => {
    localStorage.setItem('studentOnboardingDraft', JSON.stringify(form));
    setToast({ message: 'Draft saved successfully!', type: 'success' });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setForm(prev => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };

      // Auto-set student email based on first name and current school name
      const domain = user?.schoolName ? `${user.schoolName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com` : 'school.com';
      
      if (name === 'name') {
        const prevGenerated = prev.name ? `${prev.name.toLowerCase().replace(/\s+/g, '')}@${domain}` : '';
        if (!prev.studentEmail || prev.studentEmail === prevGenerated) {
          updated.studentEmail = value ? `${value.toLowerCase().replace(/\s+/g, '')}@${domain}` : '';
        }
      }

      return updated;
    });
  };

  const nextStep = () => {
    // Basic validation per step
    if (step === 1) {
      if (!form.name || !form.guardianName) {
        setToast({ message: 'Please fill out required fields (First Name, Guardian Name)', type: 'error' });
        return;
      }
    }
    if (step === 2) {
      if (!form.classId) {
        setToast({ message: 'Please assign a class.', type: 'error' });
        return;
      }
    }
    setStep(s => Math.min(s + 1, 3));
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setToast({ message: 'Passwords do not match.', type: 'error' });
      return;
    }
    if (!form.acceptPolicies) {
      setToast({ message: 'You must accept the school policies.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('https://erpzo-backend.onrender.com/api/students', form);
      // Clear draft on success
      localStorage.removeItem('studentOnboardingDraft');
      setToast({ message: 'Student onboarded successfully!', type: 'success' });
      setTimeout(() => {
        onComplete(); // refresh list and close
      }, 1500);
    } catch (err) {
      console.error(err);
      setToast({ message: err.response?.data?.error || 'Failed to onboard student', type: 'error' });
      setSubmitting(false);
    }
  };

  const inputClass = `w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-primary transition-all text-sm ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-[#f9f9fc] border-outline-variant text-[#1a1c1e]'}`;
  const selectClass = `w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-primary transition-all text-sm ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-[#f9f9fc] border-outline-variant text-[#1a1c1e]'}`;
  const labelClass = "block text-[11px] font-semibold mb-1 opacity-80 uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className={`w-full max-w-5xl max-h-[90vh] flex flex-col rounded-[24px] shadow-2xl overflow-hidden ${dark ? 'bg-[#2f3133] text-white' : 'bg-white text-[#1a1c1e]'}`}>
        
        {/* Header */}
        <div className={`px-8 py-5 border-b flex justify-between items-center ${dark ? 'border-[#3c4a46]' : 'border-[#eeeef0]'}`}>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">person_add</span>
            Student Onboarding Wizard
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className={`px-8 py-4 bg-black/5 dark:bg-white/5 border-b flex items-center justify-between ${dark ? 'border-[#3c4a46]' : 'border-[#eeeef0]'}`}>
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step === s ? 'bg-primary text-white' : step > s ? 'bg-[#00c2a8] text-[#00493e]' : (dark ? 'bg-[#3c4a46] text-white/50' : 'bg-surface-container text-outline')}`}>
                {step > s ? <span className="material-symbols-outlined text-[18px]">check</span> : s}
              </div>
              <span className={`font-semibold text-sm ${step === s ? (dark ? 'text-white' : 'text-[#1a1c1e]') : 'opacity-50'}`}>
                {s === 1 ? 'Basic Information' : s === 2 ? 'Academic Details' : 'Verification'}
              </span>
              {s !== 3 && <div className={`w-12 h-px mx-4 ${dark ? 'bg-[#3c4a46]' : 'bg-outline-variant/50'}`}></div>}
            </div>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          {/* STEP 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-8 animate-fadeIn">
              {/* Student Info */}
              <section>
                <h3 className="text-lg font-bold mb-4 border-b pb-2 opacity-90">Student Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div><label className={labelClass}>First Name *</label><input required type="text" name="name" value={form.name} onChange={handleChange} className={inputClass} /></div>
                  <div><label className={labelClass}>Middle Name</label><input type="text" name="middleName" value={form.middleName} onChange={handleChange} className={inputClass} /></div>
                  <div><label className={labelClass}>Last Name</label><input type="text" name="lastName" value={form.lastName} onChange={handleChange} className={inputClass} /></div>
                  
                  <div><label className={labelClass}>Date of Birth</label><input type="date" name="dob" value={form.dob} onChange={handleChange} className={inputClass} /></div>
                  <div>
                    <label className={labelClass}>Gender</label>
                    <select name="gender" value={form.gender} onChange={handleChange} className={selectClass}>
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div><label className={labelClass}>Blood Group</label><input type="text" name="bloodGroup" value={form.bloodGroup} onChange={handleChange} placeholder="e.g. O+" className={inputClass} /></div>
                  
                  <div><label className={labelClass}>Nationality</label><input type="text" name="nationality" value={form.nationality} onChange={handleChange} className={inputClass} /></div>
                  <div><label className={labelClass}>Student Email</label><input type="email" name="studentEmail" value={form.studentEmail} onChange={handleChange} className={inputClass} /></div>
                  <div><label className={labelClass}>Student Mobile</label><input type="text" name="phone" value={form.phone} onChange={handleChange} className={inputClass} /></div>
                </div>
              </section>

              {/* Guardian Info */}
              <section>
                <h3 className="text-lg font-bold mb-4 border-b pb-2 opacity-90">Parent / Guardian Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className={labelClass}>Father/Guardian Name *</label><input required type="text" name="guardianName" value={form.guardianName} onChange={handleChange} className={inputClass} /></div>
                  <div><label className={labelClass}>Mother Name</label><input type="text" name="motherName" value={form.motherName} onChange={handleChange} className={inputClass} /></div>
                  
                  <div><label className={labelClass}>Relationship to Student</label><input type="text" name="parentRelationship" value={form.parentRelationship} onChange={handleChange} className={inputClass} /></div>
                  <div><label className={labelClass}>Emergency Contact</label><input type="text" name="emergencyContact" value={form.emergencyContact} onChange={handleChange} className={inputClass} /></div>
                  
                  <div className="md:col-span-2"><label className={labelClass}>Parent Email</label><input type="email" name="parentEmail" value={form.parentEmail} onChange={handleChange} className={inputClass} /></div>
                </div>
              </section>

              {/* Address Info */}
              <section>
                <h3 className="text-lg font-bold mb-4 border-b pb-2 opacity-90">Address Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div><label className={labelClass}>Country</label><input type="text" name="country" value={form.country} onChange={handleChange} className={inputClass} /></div>
                  <div><label className={labelClass}>State/Province</label><input type="text" name="state" value={form.state} onChange={handleChange} className={inputClass} /></div>
                  <div><label className={labelClass}>City/District</label><input type="text" name="city" value={form.city} onChange={handleChange} className={inputClass} /></div>
                  
                  <div><label className={labelClass}>Municipality</label><input type="text" name="municipality" value={form.municipality} onChange={handleChange} className={inputClass} /></div>
                  <div><label className={labelClass}>Ward Number</label><input type="text" name="ward" value={form.ward} onChange={handleChange} className={inputClass} /></div>
                  <div><label className={labelClass}>Postal Code</label><input type="text" name="postalCode" value={form.postalCode} onChange={handleChange} className={inputClass} /></div>
                  
                  <div className="md:col-span-3"><label className={labelClass}>Street Address</label><input type="text" name="street" value={form.street} onChange={handleChange} className={inputClass} /></div>
                </div>
              </section>
            </div>
          )}

          {/* STEP 2: Academic Details */}
          {step === 2 && (
            <div className="space-y-8 animate-fadeIn">
              {/* Previous Education */}
              <section>
                <h3 className="text-lg font-bold mb-4 border-b pb-2 opacity-90">Previous Education</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-2"><label className={labelClass}>Previous School Name</label><input type="text" name="prevSchool" value={form.prevSchool} onChange={handleChange} className={inputClass} /></div>
                  <div><label className={labelClass}>Qualification</label><input type="text" name="prevQualification" value={form.prevQualification} onChange={handleChange} className={inputClass} /></div>
                  
                  <div><label className={labelClass}>Previous Grade/Class</label><input type="text" name="prevClass" value={form.prevClass} onChange={handleChange} className={inputClass} /></div>
                  <div><label className={labelClass}>Previous Roll Number</label><input type="text" name="prevRoll" value={form.prevRoll} onChange={handleChange} className={inputClass} /></div>
                  <div><label className={labelClass}>GPA/Percentage</label><input type="text" name="prevGpa" value={form.prevGpa} onChange={handleChange} className={inputClass} /></div>
                  
                  <div className="md:col-span-3"><label className={labelClass}>Transfer Certificate Number</label><input type="text" name="tcNumber" value={form.tcNumber} onChange={handleChange} className={inputClass} /></div>
                </div>
              </section>

              {/* Admission Info */}
              <section>
                <h3 className="text-lg font-bold mb-4 border-b pb-2 opacity-90">Admission Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div><label className={labelClass}>Admission Date</label><input type="date" name="admissionDate" value={form.admissionDate} onChange={handleChange} className={inputClass} /></div>
                  <div><label className={labelClass}>Academic Year</label><input type="text" name="academicYear" value={form.academicYear} onChange={handleChange} className={inputClass} /></div>
                  <div><label className={labelClass}>Campus</label><input type="text" name="campus" value={form.campus} onChange={handleChange} className={inputClass} /></div>
                  
                  <div>
                    <label className={labelClass}>Class *</label>
                    <select name="classId" value={form.classId} onChange={handleChange} className={selectClass}>
                      <option value="">Select...</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div><label className={labelClass}>Section</label><input type="text" name="section" value={form.section} onChange={handleChange} className={inputClass} /></div>
                  <div><label className={labelClass}>Roll Number (Optional)</label><input type="text" name="rollNumber" value={form.rollNumber} onChange={handleChange} className={inputClass} /></div>
                  
                  <div><label className={labelClass}>House</label><input type="text" name="house" value={form.house} onChange={handleChange} className={inputClass} /></div>
                  <div>
                    <label className={labelClass}>Medium</label>
                    <select name="medium" value={form.medium} onChange={handleChange} className={selectClass}>
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="Local">Local</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Shift</label>
                    <select name="shift" value={form.shift} onChange={handleChange} className={selectClass}>
                      <option value="Morning">Morning</option>
                      <option value="Day">Day</option>
                      <option value="Evening">Evening</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="transport" name="transportRequired" checked={form.transportRequired} onChange={handleChange} className="w-5 h-5 rounded cursor-pointer" />
                    <label htmlFor="transport" className="text-sm font-semibold cursor-pointer">Transportation Required</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="hostel" name="hostelRequired" checked={form.hostelRequired} onChange={handleChange} className="w-5 h-5 rounded cursor-pointer" />
                    <label htmlFor="hostel" className="text-sm font-semibold cursor-pointer">Hostel Required</label>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* STEP 3: Verification */}
          {step === 3 && (
            <div className="space-y-8 animate-fadeIn max-w-2xl mx-auto py-8">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 text-primary mb-4">
                  <span className="material-symbols-outlined !text-[32px]">shield_person</span>
                </div>
                <h3 className="text-2xl font-bold">Verification & Account Setup</h3>
                <p className={`text-sm ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>Create the student's portal account and verify all provided information.</p>
              </div>

              <div className={`p-6 rounded-2xl border ${dark ? 'border-[#3c4a46] bg-[#1a1c1e]' : 'border-outline-variant bg-[#f9f9fc]'}`}>
                <h4 className="font-bold mb-4 flex items-center gap-2"><span className="material-symbols-outlined">key</span> Portal Credentials</h4>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Student Email (Auto-Generated)</label>
                    <input type="email" name="studentEmail" value={form.studentEmail} onChange={handleChange} className={inputClass} placeholder="student@school.com" />
                  </div>
                  <div>
                    <label className={labelClass}>Set Portal Password</label>
                    <input type="password" name="password" value={form.password} onChange={handleChange} className={inputClass} placeholder="Leave empty for 'student123'" />
                  </div>
                  <div>
                    <label className={labelClass}>Confirm Password</label>
                    <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} className={inputClass} placeholder="Re-enter password" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className={`p-4 rounded-xl border flex items-center justify-between ${dark ? 'border-[#3c4a46]' : 'border-outline-variant'}`}>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#006b5c]">sms</span>
                    <div>
                      <p className="font-semibold text-sm">Verify Parent Mobile (OTP)</p>
                      <p className="text-xs opacity-70">Sends verification code to SMS</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setToast({ message: 'OTP Sent successfully (Mock)', type: 'success' })} className="px-4 py-1.5 rounded-lg text-xs font-bold border hover:bg-black/5 dark:hover:bg-white/5 transition-colors">Send OTP</button>
                </div>
                
                <div className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${form.acceptPolicies ? 'border-primary bg-primary/10' : (dark ? 'border-[#3c4a46]' : 'border-outline-variant')}`} onClick={() => setForm({...form, acceptPolicies: !form.acceptPolicies})}>
                  <div className={`w-5 h-5 rounded flex items-center justify-center border ${form.acceptPolicies ? 'bg-primary border-primary text-white' : (dark ? 'border-[#bbcac4]' : 'border-outline')}`}>
                    {form.acceptPolicies && <span className="material-symbols-outlined !text-[16px]">check</span>}
                  </div>
                  <p className="text-sm font-semibold select-none">I verify that the provided information is accurate and accept school policies.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`px-8 py-5 border-t flex justify-between items-center ${dark ? 'border-[#3c4a46] bg-[#1a1c1e]' : 'border-[#eeeef0] bg-[#f9f9fc]'}`}>
          <div>
            <button 
              type="button" 
              onClick={saveDraft}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${dark ? 'text-[#bbcac4] hover:bg-[#3c4a46]' : 'text-outline hover:bg-black/5'}`}
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              Save as Draft
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={prevStep}
              disabled={step === 1}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-colors ${step === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
            >
              Previous
            </button>

            {step < 3 ? (
              <button 
                type="button" 
                onClick={nextStep}
                className="px-6 py-2 rounded-xl text-sm font-bold bg-[#006b5c] text-white hover:brightness-110 shadow-md"
              >
                Next Step
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !form.acceptPolicies}
                className={`px-6 py-2 rounded-xl text-sm font-bold shadow-md flex items-center gap-2 transition-all ${submitting || !form.acceptPolicies ? 'bg-outline/50 cursor-not-allowed text-white' : 'bg-primary text-on-primary hover:brightness-110'}`}
              >
                {submitting ? <span className="material-symbols-outlined animate-spin">sync</span> : null}
                Complete Onboarding
              </button>
            )}
          </div>
        </div>

      </div>
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
