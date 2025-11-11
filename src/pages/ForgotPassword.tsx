import React from 'react';
import { useNavigate } from 'react-router-dom';
import PasswordResetForm from '@/components/PasswordResetForm';

const ForgotPassword = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <PasswordResetForm onBack={handleBack} />
      </div>
    </div>
  );
};

export default ForgotPassword;
