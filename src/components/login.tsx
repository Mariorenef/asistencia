import { useState } from 'react';
import { auth } from '../src/firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, } from 'firebase/auth';

export default function Login({ onLogin }: { onLogin: () => void }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [modo, setModo] = useState<'login' | 'registro'>('login');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (modo === 'login') {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            onLogin(); // Notificamos al padre que el usuario está logueado
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="login-container">
            <h2>{modo === 'login' ? 'Ingresar' : 'Crear cuenta'}</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Correo"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">{modo === 'login' ? 'Ingresar' : 'Registrarse'}</button>
            </form>

            <p style={{ marginTop: '10px', cursor: 'pointer', color: '#1976d2' }}
                onClick={() => setModo(modo === 'login' ? 'registro' : 'login')}>
                {modo === 'login' ? '¿No tenés cuenta? Crear una' : '¿Ya tenés cuenta? Iniciar sesión'}
            </p>

            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}
