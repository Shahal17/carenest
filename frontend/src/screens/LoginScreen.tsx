import { FormEvent, useState } from 'react';

export const LoginScreen = () => {
  const [status, setStatus] = useState('');

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus('Signing in...');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: form.get('email'), password: form.get('password') })
      });

      if (!response.ok) {
        setStatus(response.status === 401 ? 'Invalid email or password' : 'Login failed');
        return;
      }

      const payload = await response.json();
      sessionStorage.setItem('carenest-demo-token', payload.token);
      setStatus(`Login successful — welcome ${payload.user.name}`);
    } catch {
      setStatus('Cannot reach CareNest API');
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <h2>Login</h2>
      <input name="email" placeholder="email" type="email" required defaultValue="admin@carenest.test" />
      <input name="password" placeholder="password" type="password" required minLength={6} defaultValue="password123" />
      <button type="submit">Sign In</button>
      <p aria-live="polite">{status}</p>
    </form>
  );
};
