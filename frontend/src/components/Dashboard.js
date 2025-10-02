import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';
import { getActivities, getAssessments } from '../services/api';
import Chatbot from './Chatbot'; // Import Chatbot component

const Dashboard = () => {
  const navigate = useNavigate();
  const { logout, user, featureFlags } = useAuth();
  const [activities, setActivities] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showChatbot, setShowChatbot] = useState(false); // State for chatbot modal

  useEffect(() => {
    const fetchData = async () => {
      try {
        const activitiesResponse = await getActivities();
        setActivities(activitiesResponse.data);

        const assessmentsResponse = await getAssessments();
        setAssessments(assessmentsResponse.data);
      } catch (err) {
        setError('Failed to fetch data');
        console.error(err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          logout();
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [logout, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const chatbotEnabled = Boolean(featureFlags?.chatbot);
  const adaptativeEnabled = Boolean(featureFlags?.adaptativo);
  const getLatestByType = (type) => {
    const filtered = assessments.filter((assessment) => assessment.assessment_type === type);
    if (filtered.length === 0) return null;
    return filtered.reduce((latest, current) => {
      return new Date(current.created_at) > new Date(latest.created_at) ? current : latest;
    }, filtered[0]);
  };

  const latestPre = getLatestByType('pretest');
  const latestPost = getLatestByType('posttest');
  const deltaScore = latestPre && latestPost && latestPre.total_score !== null && latestPost.total_score !== null
    ? latestPost.total_score - latestPre.total_score
    : null;

  return (
    <>
    <div className="relative flex size-full min-h-screen flex-col dark group/design-root" style={{fontFamily: '"Spline Sans", "Noto Sans", sans-serif'}}>
<div className="layout-container flex h-full grow flex-col">
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#29382f] px-10 py-4">
        <div className="flex items-center gap-3 text-white">
          <svg className="h-8 w-8 text-[var(--primary-color)]" fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z"></path>
          </svg>
          <h2 className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">MathMaster</h2>
        </div>
        <div className="flex items-center gap-8 text-sm font-medium text-gray-300">
          <Link className="hover:text-white transition-colors" to="/">Home</Link>
          <Link className="hover:text-white transition-colors" to="/modules">Modules</Link>
          <Link className="hover:text-white transition-colors" to="/exercises">Practice</Link>
          <Link className="hover:text-white transition-colors" to="/community">Community</Link>
          {user && user.role === 'admin' && (
            <Link className="hover:text-white transition-colors" to="/admin">Admin</Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center justify-center rounded-full h-10 w-10 bg-[#29382f] text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button onClick={handleLogout} className="flex items-center justify-center rounded-full h-10 px-4 bg-white/10 text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-white/20 transition-colors">Logout</button>
          <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCCrCzZp6v4WzNHUaXVOBNaRpmaMqS-r2-ktORQFQEBWaFSPWdMu9mAMpjkLvz-NH0QmF4u3tE4cTGKQK1GJ_YsT4Q009XeMQlg1fX2o5OcoId7U7miwfoKqRw7hza0zM8xtzdAVGUnpfx-LF8d148RCx0EM8Yq4JBhDMwycuykOLI6y6JAPwRAnUNFxkYk36R1ZoCqA82tWYFdJupwyUvfq2uJv4qqXnGYeD6OpdgLcb_VzqDxdR_Cv6dPy5DJd85MmuE-71ZHp4")'}}></div>
        </div>
      </header>
      
      <main className="flex-1 px-10 py-12 relative">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12">
            <p className="text-sm font-medium text-[#9eb7a8]">{featureFlags?.assigned_group ? `Group ${featureFlags.assigned_group}` : 'Pending assignment'}</p>
            <h1 className="text-4xl font-bold text-white mt-1">Daily Learning</h1>
            <p className="text-lg text-gray-400 mt-2">
              {adaptativeEnabled
                ? 'Your practice set is tailored from the latest telemetry.'
                : 'Complete your daily goals to unlock adaptive recommendations.'}
            </p>
          </div>
          <div className="mb-12">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">Daily Progress</h3>
              <p className="text-lg font-bold text-[var(--primary-color)]">{activities.length > 0 ? `${Math.round((activities.filter(act => act.correct_answers > 0).length / activities.length) * 100)}%` : '0%'}</p>
            </div>
            <div className="w-full bg-[#29382f] rounded-full h-2.5">
              <div className="bg-[var(--primary-color)] h-2.5 rounded-full" style={{ width: activities.length > 0 ? `${Math.round((activities.filter(act => act.correct_answers > 0).length / activities.length) * 100)}%` : '0%' }}></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <div className="rounded-2xl border border-[#29382f] bg-[#1a221d] p-5">
              <p className="text-sm text-[#9eb7a8]">Pretest score</p>
              <p className="text-3xl font-bold text-white mt-2">{latestPre?.total_score ?? '—'}</p>
              <p className="text-xs text-[#9eb7a8] mt-3">Taken {latestPre ? new Date(latestPre.created_at).toLocaleDateString() : 'pending'}</p>
            </div>
            <div className="rounded-2xl border border-[#29382f] bg-[#1a221d] p-5">
              <p className="text-sm text-[#9eb7a8]">Post test score</p>
              <p className="text-3xl font-bold text-white mt-2">{latestPost?.total_score ?? '—'}</p>
              <p className="text-xs text-[#9eb7a8] mt-3">{latestPost ? new Date(latestPost.created_at).toLocaleDateString() : 'Complete exit test to unlock'}</p>
            </div>
            <div className="rounded-2xl border border-[#29382f] bg-[#1a221d] p-5">
              <p className="text-sm text-[#9eb7a8]">Score delta</p>
              <p className={`text-3xl font-bold mt-2 ${deltaScore !== null ? (deltaScore >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-white'}`}>
                {deltaScore !== null ? `${deltaScore >= 0 ? '+' : ''}${deltaScore}` : '—'}
              </p>
              <p className="text-xs text-[#9eb7a8] mt-3">Difference between latest pre/post results</p>
            </div>
          </div>
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-white border-b border-[#29382f] pb-3">Today's Module</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              <div className="bg-[#1a221d] rounded-2xl p-6 flex flex-col justify-between hover:shadow-lg hover:shadow-[var(--primary-color)]/10 transition-shadow duration-300">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Theory: Calculus Basics</h3>
                  <p className="text-[#9eb7a8] text-sm leading-relaxed">Understand the fundamental concepts of calculus, including limits, derivatives, and integrals.</p>
                </div>
                <button
                  className="mt-6 w-full md:w-auto flex items-center justify-center gap-2 rounded-full h-12 px-6 bg-[var(--primary-color)] text-black text-base font-bold hover:opacity-90 transition-opacity"
                  type="button"
                  onClick={() => navigate('/study/pretest')}
                >
                  <span>Start Learning</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
              <div className="w-full bg-center bg-no-repeat aspect-square md:aspect-auto bg-cover rounded-2xl" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBEkOTrKpYD6mjHGt8vkXE8o7dzWQBfuUCvhgJGYM_4EJzdfiJ7gq6L6BwRpZSyOfppEuYmjF7jeBl7tgAsZ_DrlPYBXQj90nyVwzrLikcKZiY65-tmHkUzOj4A6GvJ41OkJu4_v9PipH8-P4j-cgbZX_mx0EWRbwIF_p8_p7Jp242sOyJhQpw1XIoe41AyQGjqRRpxpQIl8Gs9xD9WRS97eSW3URkGjK0-xelG09E23am80qHn2vzKUKu3UAXDlhyVlz244boNoCo")'}}></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              <div className="w-full bg-center bg-no-repeat aspect-square md:aspect-auto bg-cover rounded-2xl order-last md:order-first" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB_4c3kfvN3ifviUlT1OwjnJ_ktQy7JU5goG6hTNihBthVIiTLk8mtACAqDcbYGKkuJQvdXqP4N2hXnBrQ8OEPn2yL_C7qv2CrveR9GA95woAzX4xy0wiAUETfYywOkQVOatsBrkNyOF0qHTKedyYcyulzEZXK6bHiTKX0MRhjX3_wzHcZMqFiJ-bq2V-JDnUx6NRYSOtuJvnYtA0XyEDQZeFqSZTQrIUIR47jzmkTGNJuRgI7yNZe7A4dHmYcUU2U2DOvkj0Vsvak")'}}></div>
              <div className="bg-[#1a221d] rounded-2xl p-6 flex flex-col justify-between hover:shadow-lg hover:shadow-[var(--primary-color)]/10 transition-shadow duration-300">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Practice: Calculus Problems</h3>
                  <p className="text-[#9eb7a8] text-sm leading-relaxed">Apply your knowledge by solving a variety of calculus problems. Focus on accuracy and speed.</p>
                </div>
                <button
                  className="mt-6 w-full md:w-auto flex items-center justify-center gap-2 rounded-full h-12 px-6 bg-[var(--primary-color)] text-black text-base font-bold hover:opacity-90 transition-opacity"
                  type="button"
                  onClick={() => navigate('/exercises')}
                >
                  <span>{adaptativeEnabled ? 'Adaptive Practice' : 'Standard Practice'}</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
          <div className="text-center mt-16">
            <p className="text-lg text-gray-400">"The only way to learn mathematics is to do mathematics." - Paul Halmos</p>
            <p className="text-sm text-gray-500 mt-2">Keep up the great work! Consistency is key.</p>
          </div>
        </div>
        {chatbotEnabled && (
          <button
            type="button"
            onClick={() => setShowChatbot(true)}
            className="fixed bottom-10 right-12 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary-color)] text-[#111714] shadow-lg transition-transform hover:scale-105"
          >
            <span className="material-symbols-outlined text-3xl">chat</span>
          </button>
        )}
      </main>
    </div>
    </div>
    {chatbotEnabled && showChatbot && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-button" onClick={() => setShowChatbot(false)}>&times;</button>
            <Chatbot />
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
