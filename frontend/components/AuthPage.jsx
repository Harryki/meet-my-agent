import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirm('');
    setError('');
    setMessage('');
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'signup' : 'login'));
    resetForm();
  };

  const validate = () => {
    if (!email.trim() || !password.trim()) {
      return '이메일과 비밀번호를 입력해주세요.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return '올바른 이메일 형식을 입력해주세요.';
    }
    if (password.length < 4) {
      return '비밀번호는 4자 이상이어야 합니다.';
    }
    if (mode === 'signup' && password !== confirm) {
      return '비밀번호가 일치하지 않습니다.';
    }
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (mode === 'login') {
      const result = login(email, password);
      if (!result.success) {
        setError(result.error);
      }
    } else {
      const result = signup(email, password);
      if (!result.success) {
        setError(result.error);
      } else {
        setMessage('회원가입이 완료되었습니다.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbfbfa] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center gap-2 mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Meet my agent</h1>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          {mode === 'login' ? '로그인' : '회원가입'}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {mode === 'login'
            ? ''
            : '새 계정을 만들어 시작하세요.'}
        </p>

        {error && (
          <div className="mb-4 px-4 py-2 text-sm text-red-700 bg-red-50 rounded-lg">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 px-4 py-2 text-sm text-green-700 bg-green-50 rounded-lg">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-colors"
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 확인
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-colors"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            {mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          {mode === 'login' ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}{' '}
          <button
            type="button"
            onClick={toggleMode}
            className="font-medium text-gray-900 underline underline-offset-2 hover:text-gray-700"
          >
            {mode === 'login' ? '회원가입' : '로그인'}
          </button>
        </div>
      </div>
    </div>
  );
}
