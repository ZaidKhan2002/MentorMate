import { useState } from 'react';
import AuthForm from '../components/features/Authform';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
            <AuthForm isLogin={isLogin} />
        </div>
    </div>
    )
}

export default AuthPage;