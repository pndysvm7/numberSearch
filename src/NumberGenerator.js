import React, { useState, useCallback, useRef, useEffect } from 'react';

const NumberGenerator = () => {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [numbersNotNeeded, setNumbersNotNeeded] = useState('');
  const [singleDigitSum, setSingleDigitSum] = useState('');
  const [twoDigitSum, setTwoDigitSum] = useState('');
  const [tenDigitPattern, setTenDigitPattern] = useState('');
  const [generatedNumbers, setGeneratedNumbers] = useState([]);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isFormValid, setIsFormValid] = useState(true);
  const cancelRef = useRef(false);

  useEffect(() => {
    validateForm();
  }, [tenDigitPattern]);

  const validateForm = () => {
    if (tenDigitPattern && tenDigitPattern.length !== 10) {
      setError('10 Digit Pattern must be exactly 10 characters long or empty.');
      setIsFormValid(false);
    } else {
      setError('');
      setIsFormValid(true);
    }
  };

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
      link.setAttribute('download', `st${start}-----end${end}--sds${singleDigitSum}--dds${twoDigitSum}--nnn${numbersNotNeeded}--tdp${tenDigitPattern}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [start, end, singleDigitSum, twoDigitSum, numbersNotNeeded, tenDigitPattern]);

  const generateNumbers = useCallback((forDownload = false) => {
    setError('');
    setGeneratedNumbers([]);
    setIsGenerating(true);
    setProgress(0);
    cancelRef.current = false;

    const startValue = start || '';
    const endValue = end || '';

    const remainingDigits = 10 - (startValue.length + endValue.length);
    const allPossibleNumbers = Math.pow(10, remainingDigits) - 1;

    let i = 0;
    const batchSize = 10000;
    let csvContent = forDownload ? `st${startValue}-----end${endValue}--sds${singleDigitSum}--dds${twoDigitSum}--nnn${numbersNotNeeded}--tdp${tenDigitPattern}\n` : '';

    function processBatch() {
      if (cancelRef.current) {
        setIsGenerating(false);
        return;
      }

      const batchEnd = Math.min(i + batchSize, allPossibleNumbers);
      const newValidNumbers = [];

      for (; i <= batchEnd; i++) {
        const middle = i.toString().padStart(remainingDigits, '0');
        const numberStr = startValue + middle + endValue;

        if (
          (!numbersNotNeeded || !containsDigits(numberStr, numbersNotNeeded)) &&
          (!singleDigitSum || digitRoot(numberStr) === parseInt(singleDigitSum)) &&
          (!twoDigitSum || doubleDigitSumFunction(numberStr) === parseInt(twoDigitSum)) &&
          (!tenDigitPattern || matches(numberStr, tenDigitPattern))
        ) {
          if (forDownload) {
            csvContent += `${numberStr}\n`;
          } else {
            newValidNumbers.push(numberStr);
          }
        }
      }

      if (!forDownload) {
        setGeneratedNumbers(prev => [...prev, ...newValidNumbers]);
      }

      const progress = Math.min(100, Math.round((i / allPossibleNumbers) * 100));
      setProgress(progress);

      if (i <= allPossibleNumbers) {
        setTimeout(processBatch, 0);
      } else {
        setIsGenerating(false);
        if (forDownload) {
          downloadCSV(csvContent);
        }
      }
    }

    processBatch();
  }, [start, end, numbersNotNeeded, singleDigitSum, twoDigitSum, tenDigitPattern, containsDigits, digitRoot, doubleDigitSumFunction, matches, downloadCSV]);

  const cancelGeneration = () => {
    cancelRef.current = true;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl font-bold mb-4">Number Generator</h2>
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
            placeholder="10 Digit Pattern"
            value={tenDigitPattern}
            onChange={(e) => {
              setTenDigitPattern(e.target.value);
              validateForm();
            }}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mt-4 flex justify-center space-x-4">
          <button 
            onClick={() => generateNumbers(false)}
            disabled={isGenerating || !isFormValid}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : 'Generate Numbers'}
          </button>
          <button 
            onClick={() => generateNumbers(true)}
            disabled={isGenerating || !isFormValid}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            {isGenerating ? 'Generating CSV...' : 'Download CSV'}
          </button>
          {isGenerating && (
            <button 
              onClick={cancelGeneration}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {isGenerating && (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <h3 className="text-xl font-bold mb-2">Generating Numbers...</h3>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{width: `${progress}%`}}></div>
          </div>
          <p className="mt-2">Progress: {progress}%</p>
          <p className="mb-2">Numbers found so far: {generatedNumbers.length}</p>
        </div>
      )}

      {!isGenerating && (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <h3 className="text-xl font-bold mb-2">Generated Numbers</h3>
          {generatedNumbers.length === 0 ? (
            <p className="mb-2">No results found.</p>
          ) : (
            <>
              <p className="mb-2">Total numbers generated: {generatedNumbers.length}</p>
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
                    {generatedNumbers.map((number, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="py-2 px-4 border-b">{index + 1}</td>
                        <td className="py-2 px-4 border-b">{number}</td>
                        <td className="py-2 px-4 border-b">{digitRoot(number)}</td>
                        <td className="py-2 px-4 border-b">{doubleDigitSumFunction(number)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default NumberGenerator;