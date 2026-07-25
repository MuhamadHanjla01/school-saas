import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SLIDES = [
  {
    title: "Collaborative Projects",
    desc: "Work together with your peers\non real-world assignments.",
    img: "/images/slide2.png"
  },
  {
    title: "Expert Instructors",
    desc: "Learn from top educators\nwith years of industry experience.",
    img: "/images/slide3.png"
  },
  {
    title: "Achieve Your Goals",
    desc: "Earn your diploma and take\nthe next step in your career.",
    img: "/images/slide4.png"
  }
];

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();
  const { login, forgotPassword } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      const user = await login(email, password);
      if (user.role === 'SuperAdmin') {
        navigate('/superadmin');
      } else if (user.role === 'SchoolAdmin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address to reset password.');
      setSuccessMsg('');
      return;
    }
    setError('');
    try {
      const res = await forgotPassword(email);
      setSuccessMsg(res.message || 'Password reset link sent.');
    } catch (err) {
      setError('Error sending reset link.');
      setSuccessMsg('');
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row bg-background">
      {/* Left Side: Branding & Image */}
      <div className="relative hidden md:flex w-1/2 flex-col justify-center items-center bg-primary-container/10 p-12">
        <Link to="/" className="absolute top-8 left-8 inline-flex items-center gap-2 font-label-lg text-outline hover:text-primary-container transition-colors group z-20">
          <span className="material-symbols-outlined !text-[20px] transition-transform group-hover:-translate-x-1">arrow_back</span>
          <span>Back to home</span>
        </Link>
        {/* Illustration */}
        <div className="w-full max-w-md mb-12 relative overflow-hidden rounded-2xl h-80 flex items-center justify-center">
          <img 
            key={currentSlide}
            src={SLIDES[currentSlide].img} 
            alt={SLIDES[currentSlide].title} 
            className="w-full h-full object-contain rounded-3xl drop-shadow-md animate-fadeIn" 
          />
        </div>
        {/* Text Content */}
        <div className="text-center max-w-sm relative z-10" key={`text-${currentSlide}`}>
          <h1 className="font-headline-lg text-[24px] leading-tight font-medium text-inverse-surface mb-3 animate-fadeIn">
            {SLIDES[currentSlide].title}
          </h1>
          <p className="font-body-md text-outline mb-10 whitespace-pre-line animate-fadeIn">
            {SLIDES[currentSlide].desc}
          </p>
          {/* Pagination Dots */}
          <div className="flex items-center justify-center gap-2">
            {SLIDES.map((_, index) => (
              <button 
                key={index} 
                onClick={() => setCurrentSlide(index)}
                className={`rounded-full transition-all duration-300 ${index === currentSlide ? 'w-2.5 h-2.5 bg-primary-container/60' : 'w-2 h-2 bg-primary-container/20 hover:bg-primary-container/40'}`} 
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 md:p-12 bg-surface-container-lowest relative antialiased">
        <div className="w-full max-w-md flex flex-col p-8">
          {/* Logo */}
          <div className="flex justify-center mb-16">
          </div>
          <div className="mb-10 text-center">
            <h2 className="font-headline-md text-[32px] font-medium text-outline">Welcome to ERPZO</h2>
          </div>
          <form className="space-y-4" onSubmit={handleLogin}>
              {error && (
                <div className="bg-error/10 text-error p-3 rounded-xl text-sm mb-4 animate-fadeIn">
                  {error}
                </div>
              )}
              {successMsg && (
                <div className="bg-primary-container/20 text-on-primary-container p-3 rounded-xl text-sm mb-4 animate-fadeIn">
                  {successMsg}
                </div>
              )}
              {/* Email Input */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline/50 text-[20px]">
                  mail
                </span>
                <input 
                  type="email" 
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border border-outline/20 rounded-xl font-body-lg text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline/50 text-[20px]">
                  lock
                </span>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-surface-container-low border border-outline/20 rounded-xl font-body-lg text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary-container transition-colors focus:outline-none">
                  <span className="material-symbols-outlined !text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>

            {/* Forgot Password */}
            <div className="flex items-center justify-between my-8">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="remember-me" name="remember-me" className="w-4 h-4 rounded border-surface-dim text-primary-container focus:ring-primary-container transition-colors cursor-pointer" />
                <label htmlFor="remember-me" className="font-label-sm text-xs text-outline cursor-pointer">Remember me</label>
              </div>
              <button type="button" onClick={handleForgotPassword} className="font-label-sm text-xs text-primary-container hover:text-primary transition-colors focus:outline-none">Forgot Password?</button>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button className="w-full flex justify-center items-center py-3.5 px-4 rounded-full font-label-lg text-on-primary bg-primary-container hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-container transition-all active:scale-[0.98]" type="submit">
                Sign In
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center my-8">
            <div className="flex-grow border-t border-surface-container"></div>
            <div className="flex-grow border-t border-surface-container"></div>
          </div>

          <div className="mt-12 text-center">
          </div>
        </div>
      </div>
    </div>
  );
}
