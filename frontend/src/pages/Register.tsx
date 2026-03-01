import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

interface SignupResponse {
  token?: string;
  user?: {
    id: string;
    username: string;
  };
  error?: string;
}

const Register = () => {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleRegister = async () => {
    const username = usernameRef.current?.value.trim();
    const password = passwordRef.current?.value.trim();
    const confirmPassword = confirmPasswordRef.current?.value.trim();

    if (!username || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data: SignupResponse = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed');
        setLoading(false);
        return;
      }

      // Store token in localStorage
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('username', data.user?.username || '');
        // Dispatch custom event to notify SocketProvider about token change
        window.dispatchEvent(new Event('authTokenUpdated'));
        navigate('/');
      }
    } catch (err) {
      setError('An error occurred during registration');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRegister();
    }
  };

  return (
    <div className="max-w-[860px] mx-auto py-10 flex flex-col items-center min-h-screen justify-center">
      <h1 className="text-white text-3xl font-bold text-center mb-10">Pokemon Memory Game</h1>
      <div className="bg-gray-800 rounded-lg p-8 w-full max-w-sm">
        <h2 className="text-white text-2xl font-bold text-center mb-6">Sign Up</h2>

        <div className="mb-4">
          <label className="text-white text-sm mb-2 block">Username</label>
          <input
            ref={usernameRef}
            type="text"
            placeholder="Username"
            onKeyPress={handleKeyPress}
            className="w-full border-2 border-slate-300 p-3 text-lg text-black bg-white rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="text-white text-sm mb-2 block">Password</label>
          <input
            ref={passwordRef}
            type="password"
            placeholder="Password"
            onKeyPress={handleKeyPress}
            className="w-full border-2 border-slate-300 p-3 text-lg text-black bg-white rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="text-white text-sm mb-2 block">Confirm Password</label>
          <input
            ref={confirmPasswordRef}
            type="password"
            placeholder="Confirm Password"
            onKeyPress={handleKeyPress}
            className="w-full border-2 border-slate-300 p-3 text-lg text-black bg-white rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full text-xl text-white bg-black px-3 py-2 rounded-md font-bold hover:bg-gray-700 disabled:opacity-50 mb-4"
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>

        <p className="text-white text-center">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-blue-400 hover:underline font-bold"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;
