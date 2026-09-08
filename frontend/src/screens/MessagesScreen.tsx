import { FormEvent, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const MessagesScreen = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const socket = io();
    const onMessage = (message: any) => setMessages((previous) => [message, ...previous]);

    socket.on('message:new', onMessage);
    return () => {
      socket.off('message:new', onMessage);
      socket.disconnect();
    };
  }, []);

  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const body = String(form.get('body') ?? '').trim();
    if (!body) return;

    setStatus('Sending...');
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ from: 'u_cg1', to: 'p_01', body })
      });

      if (!response.ok) {
        setStatus(`Message failed (${response.status})`);
        return;
      }

      formElement.reset();
      setStatus('Message sent');
    } catch {
      setStatus('Cannot reach CareNest API');
    }
  };

  return (
    <section>
      <h2>Care Messages (Demo)</h2>
      <p>Prototype messaging only; production encryption and authorization are not implemented yet.</p>
      <form onSubmit={send}>
        <input name="body" placeholder="message" required maxLength={2000} />
        <button type="submit">Send</button>
      </form>
      <p aria-live="polite">{status}</p>
      <ul>{messages.map((message) => <li key={message.id}>{message.body}</li>)}</ul>
    </section>
  );
};
