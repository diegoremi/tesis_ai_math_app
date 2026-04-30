import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { chat } from '../services/api.ts';

const Chatbot = () => {
  const navigate = useNavigate();
  const { logout, featureFlags } = useAuth();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatbotEnabled = Boolean(featureFlags?.chatbot);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await chat(userMessage);
      const data = res.data as { response?: string };
      setMessages((prev) => [...prev, { role: 'assistant', text: data.response ?? 'No tengo una respuesta en este momento.' }]);
    } catch {
      setError('El tutor IA no está disponible. Inténtalo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  if (!chatbotEnabled) {
    return (
      <div className="min-h-screen bg-[#0b1210] text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Tutor IA no disponible</h2>
          <p className="text-[#9eb7a8]">El tutor IA está desactivado para tu grupo de estudio.</p>
          <button onClick={() => navigate('/dashboard')} className="mt-4 text-emerald-400 hover:text-emerald-300">Volver al dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1210] text-white flex flex-col">
      <nav className="flex items-center justify-between border-b border-[#29382f] px-6 md:px-10 py-3">
        <span className="text-lg font-bold">Tutor IA</span>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-sm hover:text-emerald-400">Dashboard</button>
          <button onClick={logout} className="text-sm text-red-400 hover:text-red-300">Salir</button>
        </div>
      </nav>
      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-6 py-6">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.length === 0 && (
            <div className="text-center text-[#9eb7a8] mt-10">
              <p className="text-lg font-medium mb-2">Hola, soy tu tutor de matemáticas.</p>
              <p className="text-sm">Pregúntame lo que necesites sobre los ejercicios o conceptos.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-emerald-500 text-black'
                  : 'bg-[#101a17] border border-[#29382f]'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#101a17] border border-[#29382f] rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-[#9eb7a8] rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-[#9eb7a8] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-[#9eb7a8] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta..."
            className="flex-1 rounded-full border border-[#29382f] bg-[#101a17] px-4 py-3 text-white placeholder:text-[#6aa58e] outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-full h-12 px-6 bg-emerald-500 text-black font-bold hover:opacity-90 transition disabled:opacity-60"
          >
            Enviar
          </button>
        </form>
      </main>
    </div>
  );
};

export default Chatbot;
