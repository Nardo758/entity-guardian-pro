import React from 'react';

const TestPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Test Page - Working!
        </h1>
        <p className="text-gray-600 mb-4">
          If you can see this, React is working properly.
        </p>
        <div className="space-y-2">
          <p className="text-sm text-gray-500">✅ React Components</p>
          <p className="text-sm text-gray-500">✅ Tailwind CSS</p>
          <p className="text-sm text-gray-500">✅ Basic Styling</p>
        </div>
        <button 
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={() => window.location.href = '/paid-register'}
        >
          Go to Paid Register
        </button>
      </div>
    </div>
  );
};

export default TestPage;
