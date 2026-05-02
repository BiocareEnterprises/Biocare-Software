import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false); // Button animation ke liye
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true); // Button par "Checking..." likha aajayega
        
        try {
            await setPersistence(auth, browserSessionPersistence); 
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/'); // Login success, go to dashboard
        } catch (err) {
            setError('❌ Incorrect email or password ');
            setLoading(false); // Wapis normal button hojayega
        }
    };

    return (
        <>
            {/* Jawabaat wali exact Custom CSS */}
            <style>
                {`
                .biocare-login-wrapper {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    background: linear-gradient(135deg, #1a252f 0%, #2c3e50 100%);
                    z-index: 9999;
                }
                .biocare-login-card {
                    background: white;
                    padding: 40px 30px;
                    border-radius: 12px;
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
                    width: 90%;
                    max-width: 400px;
                    text-align: center;
                    animation: popIn 0.5s ease-out;
                }
                .biocare-login-card h2 {
                    color: #1a252f;
                    margin-top: 0;
                    margin-bottom: 30px;
                    font-size: 28px;
                    font-weight: bold;
                }
                .biocare-login-input {
                    width: 100%;
                    padding: 15px;
                    margin-bottom: 20px;
                    border: 2px solid #bdc3c7;
                    border-radius: 8px;
                    font-size: 16px;
                    box-sizing: border-box;
                    outline: none;
                    transition: 0.3s;
                    background: #fafafa;
                }
                .biocare-login-input:focus {
                    border-color: #1a252f;
                    background: white;
                }
                .biocare-btn-primary {
                    background: #1a252f;
                    color: white;
                    padding: 15px;
                    border: none;
                    border-radius: 8px;
                    width: 100%;
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: 0.3s;
                }
                .biocare-btn-primary:hover {
                    background: #34495e;
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                }
                .biocare-error-msg {
                    color: #e74c3c;
                    font-size: 15px;
                    margin-bottom: 15px;
                    font-weight: bold;
                }
                @keyframes popIn {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                `}
            </style>

            <div className="biocare-login-wrapper">
                <div className="biocare-login-card">
                    <h2>🔒 Biocare Login</h2>
                    
                    {error && <p className="biocare-error-msg">{error}</p>}
                    
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column' }}>
                        <input 
                            type="email" 
                            className="biocare-login-input" 
                            placeholder="Admin Email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                        />
                        <input 
                            type="password" 
                            className="biocare-login-input" 
                            placeholder="Password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />
                        <button type="submit" className="biocare-btn-primary" disabled={loading}>
                            {loading ? 'Checking...' : 'Log in'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}

export default Login;