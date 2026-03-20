import React, { useState } from 'react';
import UploadMedicalRecord from './UploadMedicalRecord';
import ViewMedicalRecords from './ViewMedicalRecords';

const MedicalRecordsApp = () => {
  const [activeTab, setActiveTab] = useState('upload');

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-900">
          Blockchain Medical Records Management
        </h1>
        
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow p-1 flex gap-2">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                activeTab === 'upload'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Upload Record
            </button>
            <button
              onClick={() => setActiveTab('view')}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                activeTab === 'view'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              View Records
            </button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          {activeTab === 'upload' ? <UploadMedicalRecord /> : <ViewMedicalRecords />}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">System Features:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Files stored on IPFS (decentralized storage)</li>
            <li>✓ IPFS hash stored on Ethereum blockchain (immutable)</li>
            <li>✓ Metadata stored in MongoDB (fast queries)</li>
            <li>✓ Blockchain verification for integrity</li>
            <li>✓ Secure and tamper-proof records</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MedicalRecordsApp;
