import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';

const CSVNumbers = () => {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [numbersNotNeeded, setNumbersNotNeeded] = useState('');
  const [singleDigitSum, setSingleDigitSum] = useState('');
  const [twoDigitSum, setTwoDigitSum] = useState('');
  const [pattern, setPattern] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [generatedNumbers, setGeneratedNumbers] = useState([]);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [noResults, setNoResults] = useState(false);

  const containsDigits = useCallback((numberStr, digitsPattern) => {
    const regex = new RegExp(`[${digitsPattern}]`);
    return regex.test(numberStr);
  }, []);

  const digitRoot = useCallback((numberStr) => {
    let sum = numberStr.split('').reduce((acc, digit) => acc + parseInt(digit), 0);
    while (sum >= 10) {
      sum = Math.floor(sum / 10) + (sum % 10);
    }
    return sum;
  }, []);

  const doubleDigitSumFunction = useCallback((numberStr) => {
    return numberStr.split('').reduce((acc, digit) => acc + parseInt(digit), 0);
  }, []);

  const matchesPattern = useCallback((numberStr, patternStr) => {
    if (!patternStr) return true;
    if (numberStr.length !== patternStr.length) return false;
    
    const patternParts = patternStr.match(/.{1,2}/g) || [];
    const numberParts = numberStr.match(/.{1,2}/g) || [];
    const patternMap = new Map();
    
    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const numberPart = numberParts[i];
      
      if (/^\d{2}$/.test(patternPart)) {
        if (patternPart !== numberPart) return false;
      } else {
        if (patternMap.has(patternPart)) {
          if (patternMap.get(patternPart) !== numberPart) return false;
        } else {
          patternMap.set(patternPart, numberPart);
        }
      }
    }
    
    return true;
  }, []);

  const downloadCSV = useCallback((csvContent) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `processed_numbers.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, []);

  const processCSV = useCallback((file, forDownload = false) => {
    setError('');
    setGeneratedNumbers([]);
    setNoResults(false);
    setIsProcessing(true);

    Papa.parse(file, {
      complete: (results) => {
        const validNumbers = [];
        let csvContent = forDownload ? 'Number,Single Digit Sum,Two Digit Sum\n' : '';

        results.data.forEach((row) => {
          if (!row[0]) return; // Skip empty rows

          // Use the original number from the CSV without padding
          const numberStr = row[0].toString().trim();
          
          if (numberStr.length > 10) return; // Skip numbers longer than 10 digits

          if (
            (!start || numberStr.startsWith(start)) &&
            (!end || numberStr.endsWith(end)) &&
            (!numbersNotNeeded || !containsDigits(numberStr, numbersNotNeeded)) &&
            (!singleDigitSum || digitRoot(numberStr) === parseInt(singleDigitSum)) &&
            (!twoDigitSum || doubleDigitSumFunction(numberStr) === parseInt(twoDigitSum)) &&
            matchesPattern(numberStr, pattern)
          ) {
            if (forDownload) {
              csvContent += `${numberStr},${digitRoot(numberStr)},${doubleDigitSumFunction(numberStr)}\n`;
            } else {
              validNumbers.push({
                number: numberStr,
                singleDigitSum: digitRoot(numberStr),
                twoDigitSum: doubleDigitSumFunction(numberStr)
              });
            }
          }
        });

        if (validNumbers.length === 0 && !forDownload) {
          setNoResults(true);
        } else if (forDownload && csvContent === 'Number,Single Digit Sum,Two Digit Sum\n') {
          setNoResults(true);
        } else if (forDownload) {
          downloadCSV(csvContent);
        } else {
          setGeneratedNumbers(validNumbers);
        }
        setIsProcessing(false);
      },
      error: (error) => {
        setError('Error processing CSV: ' + error.message);
        setIsProcessing(false);
      }
    });
  }, [start, end, numbersNotNeeded, singleDigitSum, twoDigitSum, pattern, containsDigits, digitRoot, doubleDigitSumFunction, downloadCSV, matchesPattern]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCsvFile(file);
    }
  };

  const handleProcessClick = (forDownload = false) => {
    if (csvFile) {
      processCSV(csvFile, forDownload);
    } else {
      setError('Please select a CSV file first.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl font-bold mb-4">Number Processor</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Start (optional)"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <input
            type="text"
            placeholder="End (optional)"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <input
            type="text"
            placeholder="Numbers Not Needed"
            value={numbersNotNeeded}
            onChange={(e) => setNumbersNotNeeded(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <input
            type="text"
            placeholder="Single Digit Sum"
            value={singleDigitSum}
            onChange={(e) => setSingleDigitSum(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <input
            type="text"
            placeholder="Two Digit Sum"
            value={twoDigitSum}
            onChange={(e) => setTwoDigitSum(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <input
            type="text"
            placeholder="Pattern (e.g., XXYY8128AB)"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mt-6">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="mb-4"
          />
        </div>
        <div className="mt-6 flex justify-center space-x-4">
          <button 
            onClick={() => handleProcessClick(false)}
            disabled={isProcessing || !csvFile}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Process CSV'}
          </button>
          <button 
            onClick={() => handleProcessClick(true)}
            disabled={isProcessing || !csvFile}
            className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Process and Download CSV'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {noResults && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">No results found. Please check your filters and try again.</span>
        </div>
      )}

      {(generatedNumbers.length > 0 || isProcessing) && (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <h3 className="text-xl font-bold mb-2">Processed Numbers</h3>
          {isProcessing ? (
            <p className="mb-2">Processing numbers...</p>
          ) : (
            <p className="mb-2">Total numbers processed: {generatedNumbers.length}</p>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 border-b text-left">No.</th>
                  <th className="py-2 px-4 border-b text-left">Number</th>
                  <th className="py-2 px-4 border-b text-left">Single Digit Sum</th>
                  <th className="py-2 px-4 border-b text-left">Two Digit Sum</th>
                </tr>
              </thead>
              <tbody>
                {generatedNumbers.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-2 px-4 border-b">{index + 1}</td>
                    <td className="py-2 px-4 border-b">{item.number}</td>
                    <td className="py-2 px-4 border-b">{item.singleDigitSum}</td>
                    <td className="py-2 px-4 border-b">{item.twoDigitSum}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CSVNumbers;