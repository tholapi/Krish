import React, { useState, useEffect, useRef } from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Input } from './components/ui/input';
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from './components/ui/select';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function TimeTrackerApp() {
  const [company, setCompany] = useState('');
  const [func, setFunc] = useState('');
  const [companies, setCompanies] = useState(() => JSON.parse(localStorage.getItem('companies') || '{}'));
  const [newCompany, setNewCompany] = useState('');
  const [newFunction, setNewFunction] = useState('');
  const [startTime, setStartTime] = useState(() => localStorage.getItem('ttStartTime') ? new Date(localStorage.getItem('ttStartTime')) : null);
  const [isTracking, setIsTracking] = useState(() => JSON.parse(localStorage.getItem('ttIsTracking') || 'false'));
  const [logs, setLogs] = useState(() => JSON.parse(localStorage.getItem('timeTrackerLogs') || '[]'));
  const [manualLog, setManualLog] = useState({ company: '', function: '', start: '', end: '' });
  const exportIntervalRef = useRef(null);

  // Management states
  const [editCompany, setEditCompany] = useState('');
  const [editFunction, setEditFunction] = useState('');
  const [functionEditName, setFunctionEditName] = useState('');
  const [showManagement, setShowManagement] = useState(false);

  // Persist state
  useEffect(() => { localStorage.setItem('timeTrackerLogs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('companies', JSON.stringify(companies)); }, [companies]);
  useEffect(() => { startTime ? localStorage.setItem('ttStartTime', startTime.toISOString()) : localStorage.removeItem('ttStartTime'); }, [startTime]);
  useEffect(() => { localStorage.setItem('ttIsTracking', JSON.stringify(isTracking)); }, [isTracking]);

  // Auto-export every 5 min
  useEffect(() => {
    exportIntervalRef.current = setInterval(() => { if (logs.length) handleExportExcel(); }, 300000);
    return () => clearInterval(exportIntervalRef.current);
  }, [logs]);

  // Company & Function management
  const addCompany = () => {
    const name = newCompany.trim();
    if (!name || Object.keys(companies).some(c => c.toLowerCase() === name.toLowerCase())) return;
    setCompanies({ ...companies, [name]: [] });
    setNewCompany('');
  };
  const renameCompany = (oldName, newName) => {
    if (!newName.trim() || companies[newName]) return;
    const updated = { ...companies, [newName]: companies[oldName] };
    delete updated[oldName];
    setCompanies(updated);
    setEditCompany('');
    setCompany('');
    setFunc('');
    setLogs(logs.map(l => l.company === oldName ? { ...l, company: newName } : l));
  };
  const deleteCompany = (name) => {
    const updated = { ...companies }; delete updated[name]; setCompanies(updated);
    setCompany(''); setFunc('');
    setLogs(logs.filter(l => l.company !== name));
  };

  const addFunctionToCompany = () => {
    if (!company || !newFunction) return;
    const funcsLower = (companies[company] || []).map(f => f.toLowerCase());
    if (!funcsLower.includes(newFunction.trim().toLowerCase())) {
      setCompanies({ ...companies, [company]: [...(companies[company] || []), newFunction.trim()] });
    }
    setNewFunction('');
  };
  const renameFunction = (companyName, oldFunc, newFunc) => {
    if (!newFunc.trim()) return;
    const updatedFuncs = companies[companyName].map(f => f === oldFunc ? newFunc : f);
    setCompanies({ ...companies, [companyName]: updatedFuncs });
    setEditFunction(''); setFunctionEditName(''); setFunc('');
    setLogs(logs.map(l => l.company === companyName && l.function === oldFunc ? { ...l, function: newFunc } : l));
  };
  const deleteFunction = (companyName, funcName) => {
    const updatedFuncs = companies[companyName].filter(f => f !== funcName);
    setCompanies({ ...companies, [companyName]: updatedFuncs });
    setFunc('');
    setLogs(logs.filter(l => !(l.company === companyName && l.function === funcName)));
  };

  // Timer
  const handleStartStop = () => {
    if (isTracking) {
      const end = new Date();
      const duration = (end - new Date(startTime)) / 1000;
      const units = Math.ceil(duration / (20 * 60));
      setLogs([...logs, { company, function: func, start: startTime.toISOString(), end: end.toISOString(), duration: duration.toFixed(2), units }]);
      setStartTime(null); setIsTracking(false);
    } else { setStartTime(new Date()); setIsTracking(true); }
  };

  // Manual log
  const addManualLog = () => {
    const { company: mCompany, function: mFunc, start, end } = manualLog;
    if (!mCompany || !mFunc || !start || !end) return;
    const startDate = new Date(start); const endDate = new Date(end);
    if (isNaN(startDate) || isNaN(endDate) || endDate <= startDate) return;
    const duration = (endDate - startDate) / 1000; const units = Math.ceil(duration / (20 * 60));
    setLogs([...logs, { company: mCompany, function: mFunc, start: startDate.toISOString(), end: endDate.toISOString(), duration: duration.toFixed(2), units }]);
    setManualLog({ company: '', function: '', start: '', end: '' });
  };

  // Export Excel
  const handleExportExcel = () => {
    if (!logs.length) return;
    const data = logs.map(l => ({ Company: l.company, Function: l.function, Start: new Date(l.start).toLocaleString(), End: new Date(l.end).toLocaleString(), Duration_s: l.duration, Units_20min: l.units }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, 'TimeLogs');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer], { type: 'application/octet-stream' }), 'timesheet.xlsx');
  };

  const filteredCompanies = Object.keys(companies).sort();

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6 font-sans">
      {/* MAIN TIMER */}
      <Card className="shadow-lg rounded-lg">
        <CardContent className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">Time Tracker</h2>
          <label>Company:
            <Select value={company} onValueChange={v => { setCompany(v); setFunc(''); }}>
              <SelectTrigger><SelectValue placeholder="Select Company" /></SelectTrigger>
              <SelectContent>{filteredCompanies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </label>
          <div className="flex gap-2 items-center">
            <Input placeholder="New Company" value={newCompany} onChange={e => setNewCompany(e.target.value)} />
            <Button onClick={addCompany}>Add</Button>
          </div>
          <label>Function:
            <Select value={func} onValueChange={setFunc} disabled={!company}>
              <SelectTrigger><SelectValue placeholder="Select Function" /></SelectTrigger>
              <SelectContent>{companies[company]?.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </label>
          <div className="flex gap-2 items-center">
            <Input placeholder="New Function" value={newFunction} onChange={e => setNewFunction(e.target.value)} />
            <Button onClick={addFunctionToCompany} disabled={!company}>Add</Button>
          </div>
          <Button
            onClick={handleStartStop}
            style={{
              backgroundColor: isTracking ? '#dc2626' : '#16a34a',
              color: 'white'
            }}
          >
            {isTracking ? 'Stop Timer' : 'Start Timer'}
          </Button>
        </CardContent>
      </Card>

      {/* MANUAL LOG */}
      <Card className="shadow-lg rounded-lg">
        <CardContent className="flex flex-col gap-2">
          <h3 className="font-bold">Add Manual Log</h3>
          <Select value={manualLog.company} onValueChange={v => setManualLog({ ...manualLog, company: v, function: '' })}>
            <SelectTrigger><SelectValue placeholder="Select Company" /></SelectTrigger>
            <SelectContent>{filteredCompanies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={manualLog.function} onValueChange={v => setManualLog({ ...manualLog, function: v })} disabled={!manualLog.company}>
            <SelectTrigger><SelectValue placeholder="Select Function" /></SelectTrigger>
            <SelectContent>{manualLog.company ? companies[manualLog.company]?.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>) : null}</SelectContent>
          </Select>
          <Input type="datetime-local" value={manualLog.start} onChange={e => setManualLog({ ...manualLog, start: e.target.value })} />
          <Input type="datetime-local" value={manualLog.end} onChange={e => setManualLog({ ...manualLog, end: e.target.value })} />
          <Button onClick={addManualLog}>Add Manual Log</Button>
        </CardContent>
      </Card>

      {/* LOGS */}
      <Card className="shadow-lg rounded-lg max-h-96 overflow-y-auto">
        <CardContent>
          <h2 className="text-lg font-bold mb-2">Logs</h2>
          <ul className="text-sm space-y-1">
            {logs.map((log, i) => <li key={i}>{log.company} - {log.function} | {new Date(log.start).toLocaleString()} - {new Date(log.end).toLocaleString()} ({log.duration}s, {log.units} unit{log.units>1?'s':''})</li>)}
          </ul>
          <Button onClick={handleExportExcel} className="mt-4">Export Excel</Button>
        </CardContent>
      </Card>

      {/* MANAGEMENT DROPDOWN */}
      <Card className="shadow-lg rounded-lg">
        <CardContent>
          <Button variant="outline" onClick={() => setShowManagement(!showManagement)}>
            {showManagement ? 'Hide Management' : 'Show Management'}
          </Button>
          {showManagement && (
            <div className="mt-4 space-y-4 max-h-96 overflow-y-auto">
              <div>
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
              <div>
                <h3 className="font-semibold">Functions</h3>
                {filteredCompanies.map(c => (
                  <div key={c}>
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
