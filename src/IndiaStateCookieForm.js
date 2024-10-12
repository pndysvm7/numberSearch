import React, { useState } from 'react';
import { AlertCircle, Check, Loader2 } from 'lucide-react';

const BE_URL = "http://my-number-adarsh.eba-mhg6sxjw.us-east-1.elasticbeanstalk.com"
// const BE_URL = "http://localhost:8000"

const indianStates = [
  { name: 'Andhra Pradesh (520002)', value: 'Vijayawada' },
  { name: 'Assam (781001)', value: 'Guwahati' },
  { name: 'Bihar (800001)', value: 'Patna' },
  { name: 'Gujarat (360001)', value: 'Rajkot' },
  { name: 'Haryana (123401)', value: 'Rewari' },
  { name: 'Himachal Pradesh (171001)', value: 'Shimla' },
  { name: 'Jharkhand (835210)', value: 'Khunti' },
  { name: 'Karnataka (560068)', value: 'Bangalore South' },
  { name: 'Kerala 695001', value: 'Trivandrum North' },
  { name: 'Madhya Pradesh (462001)', value: 'Huzur' },
  { name: 'Maharashtra (413102)', value: 'Pune Moffusil' },
  { name: 'Mumbai(400001)', value: 'Mumbai' },
  { name: 'Odisha (751001)', value: 'Bhubaneswar' },
  { name: 'Punjab (141002)', value: 'Ludhiana' },
  { name: 'Rajasthan(302001)', value: 'Jaipur City' },
  { name: 'Tamil Nadu (600001)', value: 'Chennai' },
  { name: 'Jammu (180001)', value: 'Jammu' },
  { name: 'UP East(211001)', value: 'Allahabad' },
  { name: 'UP West(243005)', value: 'Bareilly' },
  { name: 'Delhi East (201003) ', value: 'Ghaziabad' },
  { name: 'Uttarakhand (248001)', value: 'Dehradun' },
  { name: 'West Bengal (734001)', value: 'Darjeeling' },
  { name: 'Kolkata (700001)', value: 'Calcutta' },
  { name: 'J&K (180001)', value: 'Jammu' }
];

const IndiaStateCookieForm = () => {
  const [activeTab, setActiveTab] = useState('process');
  const [selectedState, setSelectedState] = useState('');
  const [cookie, setCookie] = useState('');
  const [digits, setDigits] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [processingStats, setProcessingStats] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [rawResponse, setRawResponse] = useState('');
  const [erroredResponses, setErroredResponses] = useState([]);

  const handleProcess = async () => {
    setIsProcessing(true);
    setError(null);
    setResponse(null);
    setProcessingStats(null);
    setIsCompleted(false);
    setSheetUrl('');
    setRawResponse('');
    setErroredResponses([]);

    try {
      const res = await fetch(`/api/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cityname: selectedState, 
          cookie 
        }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        setRawResponse(prev => prev + chunk);
        
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.success) {
                setProcessingStats(data);
                if (data.sheetUrl) {
                  setSheetUrl(data.sheetUrl);
                }
                if (data.message === 'Processing completed') {
                  setIsCompleted(true);
                  setResponse(data);
                  break;
                }
              } else {
                throw new Error(data.errorMessage);
              }
            } catch (jsonError) {
              console.error('JSON parsing error:', jsonError);
              setErroredResponses(prev => [...prev, line]);
            }
          }
        }
      }
    } catch (err) {
      setError(err.message);
      setErroredResponses(prev => [...prev, err.message]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTestCookie = async () => {
    setIsProcessing(true);
    setError(null);
    setResponse(null);
    setErroredResponses([]);

    try {
      const res = await fetch(`/api/test-cookie`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cityname: selectedState,
          cookie, 
          digits 
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResponse(data);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
      setErroredResponses(prev => [...prev, err.message]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setIsProcessing(false);
    // Note: In a real application, you would need to implement
    // a way to cancel the ongoing fetch request here
  };

  const renderStateSelect = () => (
    <select
      className="w-full p-2 border border-gray-300 rounded-md"
      onChange={(e) => setSelectedState(e.target.value)}
      value={selectedState}
    >
      <option value="">Select a state</option>
      {indianStates.map((state) => (
        <option key={state.value} value={state.value}>
          {state.name}
        </option>
      ))}
    </select>
  );

  const renderProcessingTable = () => (
    <table className="w-full mt-4 border-collapse border border-gray-300">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-gray-300 p-2">Total Batches</th>
          <th className="border border-gray-300 p-2">Batches Processed</th>
          <th className="border border-gray-300 p-2">Numbers Found in Batch</th>
          <th className="border border-gray-300 p-2">Total Numbers Found</th>
          <th className="border border-gray-300 p-2">Sheet URL</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border border-gray-300 p-2">{processingStats?.totalBatches || 0}</td>
          <td className="border border-gray-300 p-2">{processingStats?.batchProcessed || 0}</td>
          <td className="border border-gray-300 p-2">{processingStats?.numbersFoundInBatch || 0}</td>
          <td className="border border-gray-300 p-2">{processingStats?.totalNumbersFound || 0}</td>
          <td className="border border-gray-300 p-2">
            {sheetUrl ? (
              <a href={sheetUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                View Sheet
              </a>
            ) : (
              'N/A'
            )}
          </td>
        </tr>
      </tbody>
    </table>
  );

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <div className="flex border-b">
        <button
          className={`px-4 py-2 ${activeTab === 'process' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('process')}
        >
          Process
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'testCookie' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('testCookie')}
        >
          Test Cookie
        </button>
      </div>

      {isCompleted && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <Check className="inline-block mr-2 h-4 w-4" />
          <strong className="font-bold">Processing Completed:</strong>
          <span className="block sm:inline"> Total numbers found: {response?.totalNumbersFound}</span>
          {sheetUrl && (
            <div className="mt-2">
              <a href={sheetUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                View Sheet
              </a>
            </div>
          )}
        </div>
      )}

      {activeTab === 'process' && (
        <>
          {renderStateSelect()}

          <input
            type="text"
            placeholder="Enter cookie"
            value={cookie}
            onChange={(e) => setCookie(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />

          <button
            onClick={handleProcess}
            disabled={isProcessing || !selectedState || !cookie}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-md disabled:bg-gray-300"
          >
            {isProcessing ? (
              <>
                <Loader2 className="inline-block mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              'Process'
            )}
          </button>

          {isProcessing && renderProcessingTable()}
        </>
      )}

      {activeTab === 'testCookie' && (
        <>
          {renderStateSelect()}

          <input
            type="text"
            placeholder="Enter cookie"
            value={cookie}
            onChange={(e) => setCookie(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />

          <input
            type="text"
            placeholder="Enter digits"
            value={digits}
            onChange={(e) => setDigits(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />

          <button
            onClick={handleTestCookie}
            disabled={isProcessing || !selectedState || !cookie || !digits}
            className="w-full bg-green-500 text-white px-4 py-2 rounded-md disabled:bg-gray-300"
          >
            {isProcessing ? (
              <>
                <Loader2 className="inline-block mr-2 h-4 w-4 animate-spin" />
                Testing Cookie
              </>
            ) : (
              'Test Cookie'
            )}
          </button>
        </>
      )}

      {isProcessing && (
        <button
          onClick={handleCancel}
          className="w-full bg-red-500 text-white px-4 py-2 rounded-md"
        >
          Cancel
        </button>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <AlertCircle className="inline-block mr-2 h-4 w-4" />
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {response && response.success && activeTab === 'testCookie' && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <Check className="inline-block mr-2 h-4 w-4" />
          <strong className="font-bold">Success:</strong>
          <span className="block sm:inline"> 
            {response.list && response.list.length > 0 ? (
              <ul>
                {response.list.map((item, index) => (
                  <li key={index}>Number: {item.number}, Amount: {item.amount}</li>
                ))}
              </ul>
            ) : (
              "No items in the list."
            )}
          </span>
        </div>
      )}

      {erroredResponses.length > 0 && (
        <div className="mt-4">
          <h3 className="font-bold mb-2">Errored Responses:</h3>
          <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
            {erroredResponses.join('\n')}
          </pre>
        </div>
      )}
    </div>
  );
};

export default IndiaStateCookieForm;