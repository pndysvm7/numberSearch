import React, { useState, useCallback } from 'react';

const NumberGenerator = () => {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [numbersNotNeeded, setNumbersNotNeeded] = useState('');
  const [singleDigitSum, setSingleDigitSum] = useState('');
  const [twoDigitSum, setTwoDigitSum] = useState('');
  const [generatedNumbers, setGeneratedNumbers] = useState([]);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

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

  const downloadCSV = useCallback((csvContent) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `st${start}-----end${end}--sds${singleDigitSum}--dds${twoDigitSum}--nnn${numbersNotNeeded}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [start, end, singleDigitSum, twoDigitSum, numbersNotNeeded]);

  const generateNumbers = useCallback((forDownload = false) => {
    setError('');
    if (!forDownload) {
      setGeneratedNumbers([]);
    }
    setIsGenerating(true);

    if (!start || !end) {
      setError('Start and End values are required.');
      setIsGenerating(false);
      return;
    }

    if (start.length + end.length > 10) {
      setError('Start and end combined should not exceed 10 digits');
      setIsGenerating(false);
      return;
    }

    const remainingDigits = 10 - (start.length + end.length);
    const allPossibleNumbers = Math.pow(10, remainingDigits) - 1;

    let i = 0;
    const batchSize = 10000; // Increased batch size for CSV generation
    let csvContent = forDownload ? `st${start}-----end${end}--sds${singleDigitSum}--dds${twoDigitSum}--nnn${numbersNotNeeded}\n` : '';

    function processBatch() {
      const batchEnd = Math.min(i + batchSize, allPossibleNumbers);
      const newValidNumbers = [];

      for (; i <= batchEnd; i++) {
        const middle = i.toString().padStart(remainingDigits, '0');
        const numberStr = start + middle + end;

        if (
          (!numbersNotNeeded || !containsDigits(numberStr, numbersNotNeeded)) &&
          (!singleDigitSum || digitRoot(numberStr) === parseInt(singleDigitSum)) &&
          (!twoDigitSum || doubleDigitSumFunction(numberStr) === parseInt(twoDigitSum))
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
  }, [start, end, numbersNotNeeded, singleDigitSum, twoDigitSum, containsDigits, digitRoot, doubleDigitSumFunction, downloadCSV]);

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl font-bold mb-4">Number Generator</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Start"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <input
            type="text"
            placeholder="End"
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
        </div>
        <div className="mt-4 flex justify-center space-x-4">
          <button 
            onClick={() => generateNumbers(false)}
            disabled={isGenerating}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : 'Generate Numbers'}
          </button>
          <button 
            onClick={() => generateNumbers(true)}
            disabled={isGenerating}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            {isGenerating ? 'Generating CSV...' : 'Download CSV'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {(generatedNumbers.length > 0 || isGenerating) && (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <h3 className="text-xl font-bold mb-2">Generated Numbers</h3>
          {isGenerating ? (
            <p className="mb-2">Generating numbers... {generatedNumbers.length} found so far.</p>
          ) : (
            <p className="mb-2">Total numbers generated: {generatedNumbers.length}</p>
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
        </div>
      )}
    </div>
  );
};

export default NumberGenerator;