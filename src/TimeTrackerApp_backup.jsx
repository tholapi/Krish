import React, { useState, useEffect, useRef } from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Input } from './components/ui/input';
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from './components/ui/select';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

function csvEscape(val) {
  if (typeof val !== 'string') return val;
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export default function TimeTrackerApp() {
  const [company, setCompany] = useState('');
  const [func, setFunc] = useState('');
  const [companies, setCompanies] = useState(() => {
    const saved = localStorage.getItem('companies');
    return saved ? JSON.parse(saved) : {};
  });
  const [newCompany, setNewCompany] = useState('');
  const [newFunction, setNewFunction] = useState('');
  const [startTime, setStartTime] = useState(() => {
    const saved = localStorage.getItem('ttStartTime');
    return saved ? new Date(saved) : null;
  });
  const [isTracking, setIsTracking] = useState(() => {
    const saved = localStorage.getItem('ttIsTracking');
    return saved ? JSON.parse(saved) : false;
  });
  const [logs, setLogs] = useState(() => {
    const savedLogs = localStorage.getItem('timeTrackerLogs');
    return savedLogs ? JSON.parse(savedLogs) : [];
  });
  const [manualLog, setManualLog] = useState({ company: '', function: '', start: '', end: '' });
  const exportIntervalRef = useRef(null);

  // Management state
  const [editCompany, setEditCompany] = useState('');
  const [editFunction, setEditFunction] = useState('');
  const [functionEditName, setFunctionEditName] = useState('');

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem('timeTrackerLogs', JSON.stringify(logs));
  }, [logs]);
  useEffect(() => {
    localStorage.setItem('companies', JSON.stringify(companies));
  }, [companies]);
  useEffect(() => {
    if (startTime) localStorage.setItem('ttStartTime', startTime.toISOString());
    else localStorage.removeItem('ttStartTime');
  }, [startTime]);
  useEffect(() => {
    localStorage.setItem('ttIsTracking', JSON.stringify(isTracking));
  }, [isTracking]);

  // Auto-export every 5 minutes
  useEffect(() => {
    exportIntervalRef.current = setInterval(() => {
      if (logs.length > 0) handleExportExcel();
    }, 300000);
    return () => clearInterval(exportIntervalRef.current);
  }, [logs]);

  // Company add/edit/delete
  const addCompany = () => {
    const newName = newCompany.trim();
    if (newName && !Object.keys(companies).some(c => c.toLowerCase() === newName.toLowerCase())) {
      setCompanies({ ...companies, [newName]: [] });
      setNewCompany('');
    }
  };
  const renameCompany = (oldName, newName) => {
    if (!newName.trim() || companies[newName]) return;
    const updated = { ...companies };
    updated[newName] = updated[oldName];
    delete updated[oldName];
    setCompanies(updated);
    setEditCompany('');
    setCompany('');
    setFunc('');
    setLogs(logs.map(l => l.company === oldName ? { ...l, company: newName } : l));
  };
  const deleteCompany = (name) => {
    const updated = { ...companies };
    delete updated[name];
    setCompanies(updated);
    setCompany('');
    setFunc('');
    setLogs(logs.filter(l => l.company !== name));
  };

  // Function add/edit/delete
  const addFunctionToCompany = () => {
    if (company && newFunction) {
      const lowerFuncs = companies[company]?.map(f => f.toLowerCase()) || [];
      if (!lowerFuncs.includes(newFunction.trim().toLowerCase())) {
        const updatedFunctions = [...(companies[company] || []), newFunction.trim()];
        setCompanies({ ...companies, [company]: updatedFunctions });
      }
      setNewFunction('');
    }
  };
  const renameFunction = (companyName, oldFunc, newFunc) => {
    if (!newFunc.trim()) return;
    const updatedFunctions = companies[companyName].map(f => (f === oldFunc ? newFunc : f));
    setCompanies({ ...companies, [companyName]: updatedFunctions });
    setEditFunction('');
    setFunctionEditName('');
    setFunc('');
    setLogs(logs.map(l => l.company === companyName && l.function === oldFunc ? { ...l, function: newFunc } : l));
  };
  const deleteFunction = (companyName, funcName) => {
    const updatedFunctions = companies[companyName].filter(f => f !== funcName);
    setCompanies({ ...companies, [companyName]: updatedFunctions });
    setFunc('');
    setLogs(logs.filter(l => !(l.company === companyName && l.function === funcName)));
  };

  // Timer logic
  const handleStartStop = () => {
    if (isTracking) {
      const endTime = new Date();
      const durationSeconds = (endTime - new Date(startTime)) / 1000;
      const units = Math.ceil(durationSeconds / (20 * 60));
      const newLog = {
        company,
        function: func,
        start: new Date(startTime).toISOString(),
        end: endTime.toISOString(),
        duration: durationSeconds.toFixed(2),
        units,
      };
      setLogs([...logs, newLog]);
      setIsTracking(false);
      setStartTime(null);
    } else {
      setStartTime(new Date());
      setIsTracking(true);
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    if (logs.length === 0) return;
    const data = logs.map(log => ({
      Company: log.company,
      Function: log.function,
      Start: new Date(log.start).toLocaleString(),
      End: new Date(log.end).toLocaleString(),
      Duration_s: log.duration,
      Units_20min: log.units,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'TimeLogs');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'timesheet.xlsx');
  };

  // Manual log entry
  const addManualLog = () => {
    const { company: mCompany, function: mFunc, start, end } = manualLog;
    if (!mCompany || !mFunc || !start || !end) return;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate) || isNaN(endDate) || endDate <= startDate) return;
    const durationSeconds = (endDate - startDate) / 1000;
    const units = Math.ceil(durationSeconds / (20 * 60));
    setLogs([...logs, {
      company: mCompany,
      function: mFunc,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      duration: durationSeconds.toFixed(2),
      units
    }]);
    setManualLog({ company: '', function: '', start: '', end: '' });
  };

  const filteredCompanies = Object.keys(companies).sort();

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      {/* MAIN TIMER SECTION */}
      <Card>
        <CardContent className="flex flex-col gap-4">
          <h2 className="text-lg font-bold mb-2">Time Tracker</h2>
          {/* Company select */}
          <label>
            Company:
            <Select value={company} onValueChange={v => { setCompany(v); setFunc(''); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select Company" />
              </SelectTrigger>
              <SelectContent>
                {filteredCompanies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>
          {/* Quick add new company */}
          <div className="flex gap-2 items-center">
            <Input placeholder="New Company Name" value={newCompany} onChange={e => setNewCompany(e.target.value)} />
            <Button onClick={addCompany}>Add Company</Button>
          </div>
          {/* Function select */}
          <label>
            Function:
            <Select value={func} onValueChange={setFunc} disabled={!company}>
              <SelectTrigger>
                <SelectValue placeholder="Select Function" />
              </SelectTrigger>
              <SelectContent>
                {companies[company]?.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>
          {/* Quick add new function */}
          <div className="flex gap-2 items-center">
            <Input placeholder="New Function" value={newFunction} onChange={e => setNewFunction(e.target.value)} />
            <Button onClick={addFunctionToCompany} disabled={!company}>Add Function</Button>
          </div>
          {/* Timer button */}
          <Button onClick={handleStartStop} disabled={!company || !func}>
            {isTracking ? 'Stop Timer' : 'Start Timer'}
          </Button>
        </CardContent>
      </Card>

      {/* MANUAL LOG SECTION */}
      <Card>
        <CardContent>
          <h3 className="font-bold mb-2">Add Manual Log Entry</h3>
          <div className="flex flex-col gap-2">
            <Select value={manualLog.company} onValueChange={v => setManualLog({ ...manualLog, company: v, function: '' })}>
              <SelectTrigger><SelectValue placeholder="Select Company" /></SelectTrigger>
              <SelectContent>
                {Object.keys(companies).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={manualLog.function} onValueChange={v => setManualLog({ ...manualLog, function: v })} disabled={!manualLog.company}>
              <SelectTrigger><SelectValue placeholder="Select Function" /></SelectTrigger>
              <SelectContent>
                {companies[manualLog.company]?.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="datetime-local" value={manualLog.start} onChange={e => setManualLog({ ...manualLog, start: e.target.value })} />
            <Input type="datetime-local" value={manualLog.end} onChange={e => setManualLog({ ...manualLog, end: e.target.value })} />
            <Button onClick={addManualLog}>Add Manual Log</Button>
          </div>
        </CardContent>
      </Card>

      {/* LOGS AND EXPORT */}
      <Card>
        <CardContent>
          <h2 className="text-lg font-bold mb-2">Logs</h2>
          <ul className="text-sm space-y-1 max-h-64 overflow-y-auto">
            {logs.map((log, idx) => (
              <li key={idx}>
                {log.company} - {log.function} | {new Date(log.start).toLocaleString()} - {new Date(log.end).toLocaleString()} ({log.duration}s, {log.units} unit{log.units > 1 ? 's' : ''})
              </li>
            ))}
          </ul>
          <Button onClick={handleExportExcel} className="mt-4">Export Timesheet (Excel)</Button>
        </CardContent>
      </Card>

      {/* MANAGEMENT SECTION */}
      <Card>
        <CardContent>
          <h2 className="text-lg font-bold mb-2">Company & Function Management</h2>
          {/* Company List */}
          <div className="mb-4">
            <h3 className="font-semibold">Companies</h3>
            {filteredCompanies.map(c => (
              <div key={c} className="flex gap-2 items-center my-1">
                {editCompany === c ? (
                  <>
                    <Input value={editCompany} onChange={e => setEditCompany(e.target.value)} />
                    <Button size="sm" onClick={() => renameCompany(c, editCompany)}>Rename</Button>
                  </>
                ) : (
                  <>
                    <span>{c}</span>
                    <Button size="sm" variant="outline" onClick={() => setEditCompany(c)}>Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteCompany(c)}>Delete</Button>
                  </>
                )}
              </div>
            ))}
          </div>
          {/* Function List */}
          <div>
            <h3 className="font-semibold">Functions</h3>
            {filteredCompanies.map(c => (
              <div key={c} className="mb-2">
                <div className="font-medium">{c}</div>
                {companies[c]?.map(f => (
                  <div key={f} className="flex gap-2 items-center my-1">
                    {editFunction === f ? (
                      <>
                        <Input value={functionEditName} onChange={e => setFunctionEditName(e.target.value)} />
                        <Button size="sm" onClick={() => renameFunction(c, f, functionEditName)}>Rename</Button>
                      </>
                    ) : (
                      <>
                        <span>{f}</span>
                        <Button size="sm" variant="outline" onClick={() => { setEditFunction(f); setFunctionEditName(f); }}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteFunction(c, f)}>Delete</Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
