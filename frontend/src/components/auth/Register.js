import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { registerUser } from "../../services/api";

const Register = () => {
  const navigate = useNavigate();
  const recaptchaRef = useRef();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    age: "",
    education_level: "high_school",
    math_goals: "",
    agree_terms: false,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    

    const recaptchaToken = recaptchaRef.current.getValue();
    if (!recaptchaToken) {
      setError("Please complete the reCAPTCHA");
      setLoading(false);
      return;
    }

    try {
      // Split full_name into first_name and last_name for backend
      const nameParts = formData.full_name.split(' ');
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';

      await registerUser({ 
        ...formData, 
        first_name, 
        last_name, 
        goal: formData.math_goals, // Map math_goals to goal for backend
        recaptchaToken 
      });
      alert("Account created successfully! Please log in.");
      navigate("/");
    } catch (err) {
      setError("Registration failed. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-[#111714] dark group/design-root overflow-x-hidden">
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#29382f] px-10 py-3">
        <div className="flex items-center gap-4 text-white">
          <div className="size-6 text-[var(--primary-color)]">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path clipRule="evenodd" d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z" fill="currentColor" fillRule="evenodd"></path>
            </svg>
          </div>
          <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">Math AI</h2>
        </div>
        <div className="flex flex-1 justify-end gap-2">
          <div className="flex items-center gap-2">
            <a className="text-white/80 hover:text-white hover:bg-white/10 rounded-full px-4 py-2 text-sm font-medium leading-normal transition-colors" href="/">Home</a>
            <a className="text-white/80 hover:text-white hover:bg-white/10 rounded-full px-4 py-2 text-sm font-medium leading-normal transition-colors" href="/#features">Features</a>
            <a className="text-white/80 hover:text-white hover:bg-white/10 rounded-full px-4 py-2 text-sm font-medium leading-normal transition-colors" href="/#pricing">Pricing</a>
            <a className="text-white/80 hover:text-white hover:bg-white/10 rounded-full px-4 py-2 text-sm font-medium leading-normal transition-colors" href="/#support">Support</a>
          </div>
          <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-6 bg-white/10 text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-white/20 transition-colors">
            <span className="truncate">Log In</span>
          </button>
        </div>
      </header>
      <main className="flex flex-1 justify-center py-5">
        <div className="layout-content-container flex flex-col w-[512px] max-w-[512px] py-10 px-8">
          
          <h1 className="text-white tracking-tighter text-4xl font-bold leading-tight text-center pb-8">Create your account</h1>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2">
              <p className="text-white text-base font-medium leading-normal">Full Name</p>
              <input className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-[#29382f] text-white" placeholder="Enter your full name" name="full_name" value={formData.full_name} onChange={handleChange} required />
            </label>
            <label className="flex flex-col gap-2">
              <p className="text-white text-base font-medium leading-normal">Email</p>
              <input className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-[#29382f] text-white" placeholder="Enter your email" type="email" name="email" value={formData.email} onChange={handleChange} required />
            </label>
            <label className="flex flex-col gap-2">
              <p className="text-white text-base font-medium leading-normal">Password</p>
              <input className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-[#29382f] text-white" placeholder="Create a password" type="password" name="password" value={formData.password} onChange={handleChange} required />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-2">
                <p className="text-white text-base font-medium leading-normal">Age</p>
                <input className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-[#29382f] text-white" placeholder="Enter your age" type="number" name="age" value={formData.age} onChange={handleChange} required />
              </label>
              <label className="flex flex-col gap-2">
                <p className="text-white text-base font-medium leading-normal">Education Level</p>
                <select className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-[#29382f] text-white appearance-none bg-[image:--select-button-svg] bg-no-repeat bg-[center_right_1rem]" name="education_level" value={formData.education_level} onChange={handleChange}>
                  <option value="high_school">High School</option>
                  <option value="university">University</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>
            <label className="flex flex-col gap-2">
              <p className="text-white text-base font-medium leading-normal">Math Goals</p>
              <textarea className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-[#29382f] text-white min-h-28" placeholder="e.g. Ace my calculus exam, understand linear algebra" name="math_goals" value={formData.math_goals} onChange={handleChange}></textarea>
            </label>
            
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey="6LdsZcErAAAAACDfU6SVWkAJ6HNK73kKIyhocd-m" // Replace with your site key
            />
            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-5 mt-4 bg-[var(--primary-color)] text-[#111714] text-base font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity" type="submit" disabled={loading}>
              <span className="truncate">{loading ? "Creating Account..." : "Create Account"}</span>
            </button>
            {error && <p style={{ color: "red", textAlign: "center", marginTop: "10px" }}>{error}</p>}
            <p className="text-[#9eb7a8] text-xs font-normal leading-normal pt-2 px-4 text-center">
              This site is protected by reCAPTCHA and the Google <a className="underline hover:text-white" href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> and <a className="underline hover:text-white" href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> apply.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Register;
