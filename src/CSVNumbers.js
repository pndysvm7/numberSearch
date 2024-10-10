import React, { useState, useCallback, useRef } from 'react';
import Papa from 'papaparse';

const CHUNK_SIZE = 1000; // Process 1000 rows at a time

const allEqual = async (arr) => arr.every(v => v === arr[0])

const isPatternValid = (strNumber, patternObj, patternLength) => {
  let subStr = "";
  const prr = []
  for (let digit of strNumber) {
      let flag = true;
      if (subStr.length === patternLength) {
          let newSubStr = subStr.slice(1);
          subStr = newSubStr;
      }
      subStr += digit;
      if (subStr.length < patternLength) {
          continue;
      }
      // dumb.push(subStr);
      for  (let key of Object.keys(patternObj)) {
          let temp = [];
          for  (let g of patternObj[key]) {
                temp.push(subStr[g]);
          }
          if (key === '0' || key === '1' || key === '2' || key === '3' || key === '4' || key === '5' || key === '6' || key === '7' || key === '8' || key === '9') {
                temp.push(key);
          }
          if (allEqual(temp) === false) {
              flag = false;
              break;
          } 
      }
      if (flag === true) {
            prr.push(strNumber);
      }
  }

  return prr.length > 0;
}

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
  const [progress, setProgress] = useState(0);

  const abortControllerRef = useRef(null);

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

  const matches = useCallback((numberStr, pattern) => {
    if (!pattern || !pattern?.length) return true;
    let patternObj = {};
    let temp_index = 0;

    for (let items of pattern) {
        if (!patternObj[items]) {
            patternObj[items] = [];
        }
        patternObj[items].push(temp_index);
        temp_index += 1;
    }

    let numObject = {};
    temp_index = 0;
    for (let items of numberStr) {
        if (!numObject[items]) {
          numObject[items] = [];
        }
        numObject[items].push(temp_index);
        temp_index += 1;
    }

    let pattern2DArray = Object.values(patternObj);
    pattern2DArray.sort();

    let nums2DArray = Object.values(numObject);
    nums2DArray.sort();

    return JSON.stringify(pattern2DArray) === JSON.stringify(nums2DArray);
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

  const processChunk = useCallback((chunk, validNumbers, csvContent, forDownload) => {
    chunk.forEach((row) => {
      // Check if row is an array (multiple columns) or a string (single column)
      const cellsToProcess = Array.isArray(row) ? row : [row];
      
      cellsToProcess.forEach((cell) => {
        const numberStr = cell.toString().trim();
        
        if (/^\d{10}$/.test(numberStr)) {
          if (
            (!start || numberStr.startsWith(start)) &&
            (!end || numberStr.endsWith(end)) &&
            (!numbersNotNeeded || !containsDigits(numberStr, numbersNotNeeded)) &&
            (!singleDigitSum || digitRoot(numberStr) === parseInt(singleDigitSum)) &&
            (!twoDigitSum || doubleDigitSumFunction(numberStr) === parseInt(twoDigitSum)) &&
            (!pattern || matches(numberStr, pattern))
          ) {
            if (forDownload) {
              csvContent.push(`${numberStr},${digitRoot(numberStr)},${doubleDigitSumFunction(numberStr)}`);
            } else {
              validNumbers.push({
                number: numberStr,
                singleDigitSum: digitRoot(numberStr),
                twoDigitSum: doubleDigitSumFunction(numberStr)
              });
            }
          }
        }
      });
    });
    return { validNumbers, csvContent };
  }, [start, end, numbersNotNeeded, singleDigitSum, twoDigitSum, pattern, containsDigits, digitRoot, doubleDigitSumFunction, matchesPattern]);

  const processCSV = useCallback((file, forDownload = false) => {
    setError('');
    setGeneratedNumbers([]);
    setNoResults(false);
    setIsProcessing(true);
    setProgress(0);

    const validNumbers = [];
    const csvContent = forDownload ? ['Number,Single Digit Sum,Two Digit Sum'] : [];

    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    Papa.parse(file, {
      worker: true, // Use a worker thread
      chunkSize: CHUNK_SIZE,
      step: (results, parser) => {
        if (signal.aborted) {
          parser.abort();
          return;
        }

        const { validNumbers: updatedValidNumbers, csvContent: updatedCsvContent } = processChunk(results.data, validNumbers, csvContent, forDownload);
        
        Object.assign(validNumbers, updatedValidNumbers);
        Object.assign(csvContent, updatedCsvContent);

        setProgress((prevProgress) => {
          const newProgress = prevProgress + (CHUNK_SIZE / file.size) * 100;
          return Math.min(newProgress, 99); // Cap at 99% to show completion only when fully done
        });
      },
      complete: () => {
        if (signal.aborted) return;

        if (validNumbers.length === 0 && !forDownload) {
          setNoResults(true);
        } else if (forDownload) {
          if (csvContent.length > 1) {
            downloadCSV(csvContent.join('\n'));
          } else {
            setNoResults(true);
          }
        } else {
          setGeneratedNumbers(validNumbers);
        }
        setIsProcessing(false);
        setProgress(100);
      },
      error: (error) => {
        if (signal.aborted) return;
        setError('Error processing CSV: ' + error.message);
        setIsProcessing(false);
      }
    });
  }, [start, end, numbersNotNeeded, singleDigitSum, twoDigitSum, pattern, processChunk, downloadCSV]);

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

  const handleCancelProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsProcessing(false);
      setError('Processing cancelled by user.');
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
          {isProcessing && (
            <button 
              onClick={handleCancelProcessing}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel Processing
            </button>
          )}
        </div>
      </div>

      {isProcessing && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{width: `${progress}%`}}></div>
          </div>
          <p className="text-center mt-2">{progress.toFixed(2)}% Processed</p>
        </div>
      )}

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