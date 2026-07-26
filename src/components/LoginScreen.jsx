import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (isRegister) {
        await signUp(email, password);
        setSuccess('Đăng ký thành công! Kiểm tra email để xác nhận tài khoản.');
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-branding">
        <div className="login-icon">🪷</div>
        <h1 className="login-title">Shambhavi Mahamudra</h1>
        <p className="login-subtitle">Kriya Practice Timer</p>
      </div>
      
      <div className="glass-card login-card">
        <h2 className="card-title">{isRegister ? 'Đăng ký' : 'Đăng nhập'}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ít nhất 6 ký tự"
              required
              minLength={6}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </div>

          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}
          
          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? 'Đang xử lý...' : (isRegister ? 'Đăng ký' : 'Đăng nhập')}
          </button>
        </form>
        
        <div className="login-toggle">
          <span>{isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}</span>
          <button
            type="button"
            className="btn-link"
            onClick={() => { setIsRegister(!isRegister); setError(null); setSuccess(null); }}
          >
            {isRegister ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;
