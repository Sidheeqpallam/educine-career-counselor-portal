import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import {
  Search, LogOut, User, Brain, MessageSquare, Loader2,
  GraduationCap, BookOpen, Phone, Mail, Clock, ChevronRight, ScanLine, ChevronDown,
} from 'lucide-react';
import { Student, NoteRequest } from '../types';
import http from '../utils/http';
import QRScanner from './QRScanner';

const studentTypeBadge = (type?: string) => {
  if (!type) return null;
  const label = type === 'madrasa_student' ? 'Madrasa' : 'Student';
  const cls = type === 'madrasa_student' ? 'badge badge-amber' : 'badge badge-green';
  return <span className={cls}>{label}</span>;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatKey = (key: string) =>
  key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();

const parseArrayVal = (val: any): string[] | null => {
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'string') {
    const t = val.trim();
    if (t.startsWith('[')) {
      try {
        const p = JSON.parse(t);
        if (Array.isArray(p)) return p.map(String);
      } catch { }
    }
  }
  return null;
};

const isDateString = (val: string): boolean =>
  /^\d{4}-\d{2}-\d{2}(T|\s|$)/.test(val.trim()) && !isNaN(new Date(val).getTime());

const formatDetailValue = (val: any): React.ReactNode => {
  if (val === null || val === undefined) return '\u2014';

  const list = parseArrayVal(val);
  if (list !== null) {
    if (list.length === 0) return '\u2014';
    return (
      <ul style={{ margin: '0.2rem 0 0', paddingLeft: '1.2rem' }}>
        {list.map((item, i) => (
          <li key={i} style={{ fontSize: '0.875rem', color: '#1e293b', lineHeight: 1.55 }}>{item}</li>
        ))}
      </ul>
    );
  }

  if (typeof val === 'object') {
    return Object.entries(val).map(([k, v]) => `${formatKey(k)}: ${v}`).join(', ');
  }

  if (typeof val === 'string') {
    if (isDateString(val)) {
      const d = new Date(val);
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }
    return val || '\u2014';
  }

  return String(val) || '\u2014';
};

const Dashboard: React.FC = () => {
  const { counselor, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [candidates, setCandidates] = useState<Student[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchDebounce = useRef<number | null>(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [qaOpen, setQaOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const searchStudent = async (queryOverride?: string) => {
    const q = (queryOverride ?? searchQuery).trim();
    if (!q) {
      setError('Please enter a name or mobile number');
      return;
    }

    setIsLoading(true);
    setError('');
    setStudent(null);
    setCandidates([]);

    try {
      const response = await http.post('/counselors/search', {
        query: q,
        includeMadrasa: true,
        counselorId: counselor?.id,
      });

      const data = response.data?.data;
      if (Array.isArray(data)) {
        if (data.length === 1) {
          setStudent(data[0]);
        } else if (data.length > 1) {
          setCandidates(data);
        } else {
          setError('No students found matching your search');
        }
      } else if (data) {
        setStudent(data);
      } else {
        setError('No students found matching your search');
      }
    } catch (err: any) {
      setError('Failed to search students. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQRScan = async (value: string) => {
    setShowScanner(false);
    // QR value is the student registration ID
    const id = value.trim();
    if (!id) return;
    setSearchQuery('');
    setCandidates([]);
    await fetchStudentById(id);
  };

  const fetchStudentById = async (id: string) => {
    setIsLoading(true);
    setError('');
    try {
      const resp = await http.get(`/counselors/student?id=${id}`);
      if (resp.data?.data) setStudent(resp.data.data);
    } catch (err) {
      setError('Failed to load student details');
    } finally {
      setIsLoading(false);
    }
  };

  const saveNote = async () => {
    if (!note.trim() || !student) return;

    setIsSavingNote(true);
    try {
      await http.post('/counselors/notes', {
        counselorId: counselor?.id,
        studentRegistrationId: student.id,
        note: note.trim(),
      } as NoteRequest);

      try {
        const resp = await http.get(`/counselors/student?id=${student.id}`);
        if (resp.data?.data) setStudent(resp.data.data);
      } catch (e) {
        try {
          const resp2 = await http.post('/counselors/search', {
            query: student.registrationId,
            counselorId: counselor?.id,
          });
          const d = resp2.data?.data;
          if (Array.isArray(d) && d.length) setStudent(d[0]);
        } catch (_e) {
          // ignore refresh errors
        }
      }

      setNote('');
    } catch (err) {
      setError('Failed to save note. Please try again.');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchDebounce.current) window.clearTimeout(searchDebounce.current);
      searchStudent();
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setError('');
    if (searchDebounce.current) window.clearTimeout(searchDebounce.current);
    if (value.trim()) {
      searchDebounce.current = window.setTimeout(() => {
        searchStudent(value);
      }, 450);
    } else {
      setCandidates([]);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #f0fdf4 0%, #f9fafb 100%)' }}>
      {/* Header */}
      <header
        style={{
          background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
          boxShadow: '0 2px 8px rgba(21,128,61,0.25)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
          <div className="flex justify-between items-center" style={{ height: '3.75rem' }}>
            {/* Brand */}
            <div className="flex items-center" style={{ gap: '0.75rem' }}>
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: '2.25rem', height: '2.25rem',
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                <GraduationCap className="w-5 h-5" style={{ color: 'white' }} />
              </div>
              <div>
                <div className="font-bold" style={{ color: 'white', fontSize: '0.95rem', lineHeight: 1.2 }}>
                  Career Counselor Portal
                </div>
              </div>
            </div>

            {/* User menu */}
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="User menu"
                style={{
                  width: '2.25rem', height: '2.25rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: menuOpen ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '9999px', cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { if (!menuOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
                onMouseLeave={(e) => { if (!menuOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
              >
                <User className="w-4 h-4" style={{ color: 'white' }} />
              </button>

              {menuOpen && (
                <div className="user-menu-popup">
                  {/* User info */}
                  <div style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid #e8f5e9',
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                  }}>
                    <div style={{
                      width: '2.25rem', height: '2.25rem', borderRadius: '9999px',
                      background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <User className="w-4 h-4" style={{ color: '#16a34a' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#14532d', lineHeight: 1.2 }}>
                        {counselor?.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '0.15rem' }}>
                        {counselor?.mobile}
                      </div>
                    </div>
                  </div>
                  {/* Actions */}
                  <div style={{ padding: '0.375rem' }}>
                    <button
                      onClick={() => { setMenuOpen(false); logout(); }}
                      className="user-menu-item"
                    >
                      <LogOut className="w-4 h-4" style={{ color: '#dc2626' }} />
                      <span style={{ color: '#dc2626' }}>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main
        className="max-w-7xl mx-auto"
        style={{ padding: '1.5rem', maxWidth: '80rem', boxSizing: 'border-box', width: '100%' }}
      >
        {/* Welcome bar */}
        <div
          className="flex items-center"
          style={{
            background: 'white', border: '1px solid #bbf7d0', borderRadius: '0.75rem',
            padding: '0.875rem 1.25rem', marginBottom: '1.25rem',
            boxShadow: '0 1px 4px rgba(22,163,74,0.08)',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              width: '2.25rem', height: '2.25rem', borderRadius: '9999px',
              background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <User className="w-4 h-4" style={{ color: '#16a34a' }} />
          </div>
          <div>
            <div className="font-bold" style={{ color: '#14532d', fontSize: '0.9rem' }}>
              Welcome, {counselor?.name}
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
              {counselor?.mobile} · Counselor Dashboard
            </div>
          </div>
        </div>

        {/* Search Section */}
        <Card className="mb-6" style={{ boxShadow: '0 2px 8px rgba(22,163,74,0.08)' }}>
          <CardHeader>
            <CardTitle>
              <Search className="w-4 h-4" style={{ color: '#16a34a' }} />
              Find Student
            </CardTitle>
            <CardDescription>
              Search by name or mobile number — includes both regular and madrasa students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex" style={{ gap: '0.625rem' }}>
              <button
                onClick={() => setShowScanner(true)}
                title="Scan QR Code"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '0.4rem',
                  padding: '0 0.875rem',
                  background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <ScanLine className="w-4 h-4" />
                <span className="hidden sm:inline">Scan QR</span>
              </button>
              <div style={{ position: 'relative', flex: 1 }}>
                {isLoading ? (
                  <Loader2
                    className="w-4 h-4 animate-spin"
                    style={{
                      position: 'absolute', left: '0.75rem', top: '50%',
                      transform: 'translateY(-50%)', color: '#16a34a', pointerEvents: 'none',
                    }}
                  />
                ) : (
                  <Search
                    className="w-4 h-4"
                    style={{
                      position: 'absolute', left: '0.75rem', top: '50%',
                      transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none',
                    }}
                  />
                )}
                <Input
                  placeholder="Search by name or mobile number…"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            {error && (
              <div
                className="text-sm"
                style={{
                  marginTop: '0.75rem', background: '#fef2f2',
                  border: '1px solid #fecaca', color: '#dc2626',
                  borderRadius: '0.5rem', padding: '0.65rem 0.875rem',
                }}
              >
                {error}
              </div>
            )}

            {/* Candidate list */}
            {candidates.length > 0 && (
              <div style={{ marginTop: '0.875rem' }}>
                <p className="text-xs" style={{ color: '#6b7280', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {candidates.length} result{candidates.length !== 1 ? 's' : ''} found — select a student
                </p>
                <div style={{ display: 'grid', gap: '0.5rem', maxHeight: '16rem', overflowY: 'auto' }}>
                  {candidates.map((c) => (
                    <button
                      key={c.id}
                      onClick={async () => {
                        setCandidates([]);
                        setSearchQuery('');
                        await fetchStudentById(c.id);
                      }}
                      className="candidate-item"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: '2rem', height: '2rem', borderRadius: '9999px',
                            background: '#dcfce7', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', flexShrink: 0,
                          }}
                        >
                          <User className="w-4 h-4" style={{ color: '#16a34a' }} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                          <div className="font-medium truncate" style={{ color: '#1e293b' }}>
                            {c.name}
                          </div>
                          <div className="text-xs truncate" style={{ color: '#6b7280' }}>{c.phone}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        {studentTypeBadge(c.type)}
                        <ChevronRight className="w-4 h-4" style={{ color: '#9ca3af' }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content area */}
        {student ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
            {/* Student info card */}
            <Card style={{ boxShadow: '0 2px 8px rgba(22,163,74,0.08)' }}>
              <CardHeader>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <CardTitle>
                    <User className="w-4 h-4" style={{ color: '#16a34a' }} />
                    Student Profile
                  </CardTitle>
                  {studentTypeBadge(student.type)}
                </div>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))', gap: '1rem' }}>
                  <div className="detail-row" style={{ gridColumn: '1 / -1' }}>
                    <span className="detail-label">Full Name</span>
                    <span className="detail-value" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#14532d' }}>
                      {student.name}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Phone className="w-3 h-3" /> Mobile
                      </span>
                    </span>
                    <span className="detail-value">{student.phone}</span>
                  </div>
                  {student.email && (
                    <div className="detail-row" style={{ gridColumn: '1 / -1' }}>
                      <span className="detail-label">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Mail className="w-3 h-3" /> Email
                        </span>
                      </span>
                      <span className="detail-value">{student.email}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Additional details */}
            {student.details && Object.keys(student.details).length > 0 && (
              <Card style={{ boxShadow: '0 2px 8px rgba(22,163,74,0.08)' }}>
                <CardHeader>
                  <CardTitle>
                    <BookOpen className="w-4 h-4" style={{ color: '#16a34a' }} />
                    Additional Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))', gap: '0.875rem' }}>
                    {Object.entries(student.details)
                      .filter(([key, val]) =>
                        val !== null &&
                        val !== undefined &&
                        val !== '' &&
                        key !== 'id' &&
                        key !== 'registrationId' &&
                        key !== 'stalls'
                      )
                      .map(([key, val]) => (
                        <div
                          key={key}
                          className="detail-row"
                          style={parseArrayVal(val) !== null ? { gridColumn: '1 / -1' } : undefined}
                        >
                          <span className="detail-label">{formatKey(key)}</span>
                          <div className="detail-value">{formatDetailValue(val)}</div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Aptitude Test */}
            {student.aptitudeTest && (() => {
              const qaItems: Array<{ question: string; answer: number; category: string }> = (() => {
                try {
                  const raw = student.aptitudeTest!.aptitudeTest;
                  return raw ? JSON.parse(raw) : [];
                } catch { return []; }
              })();
              const resultLines = student.aptitudeTest.result
                ? student.aptitudeTest.result.split('\n').filter(Boolean)
                : [];

              return (
                <Card style={{ boxShadow: '0 2px 8px rgba(22,163,74,0.08)' }}>
                  <CardHeader>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <CardTitle>
                        <Brain className="w-4 h-4" style={{ color: '#16a34a' }} />
                        Aptitude Test Results
                      </CardTitle>
                      <span className="detail-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock className="w-3 h-3" />
                        {formatDate(student.aptitudeTest.createdAt)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Result — main highlight */}
                    {resultLines.length > 0 && (
                      <div
                        style={{
                          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                          border: '1px solid #86efac',
                          borderRadius: '0.75rem',
                          padding: '1rem 1.25rem',
                          marginBottom: '1rem',
                        }}
                      >
                        <div className="detail-label" style={{ marginBottom: '0.5rem', color: '#15803d' }}>
                          Career Profile Rankings
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {resultLines.map((line, i) => (
                            <div
                              key={i}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                background: 'white', border: '1px solid #bbf7d0',
                                borderRadius: '0.5rem', padding: '0.5rem 0.875rem',
                              }}
                            >
                              <span
                                style={{
                                  width: '1.5rem', height: '1.5rem', borderRadius: '9999px',
                                  background: i === 0 ? '#15803d' : i === 1 ? '#16a34a' : '#22c55e',
                                  color: 'white', fontWeight: 700, fontSize: '0.75rem',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                {i + 1}
                              </span>
                              <span style={{ color: '#1e293b', fontWeight: 600, fontSize: '0.9rem', overflowWrap: 'anywhere' }}>
                                {line.replace(/^#\d+\s*/, '')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Q&A accordion */}
                    {qaItems.length > 0 && (
                      <div>
                        <button
                          onClick={() => setQaOpen((o) => !o)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: '#f8fffe', border: '1px solid #bbf7d0', borderRadius: '0.5rem',
                            padding: '0.6rem 0.875rem', cursor: 'pointer', fontWeight: 600,
                            fontSize: '0.82rem', color: '#15803d',
                          }}
                        >
                          <span>View Question &amp; Answer Details ({qaItems.length} questions)</span>
                          <ChevronDown
                            className="w-4 h-4"
                            style={{
                              transition: 'transform 0.2s',
                              transform: qaOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            }}
                          />
                        </button>

                        {qaOpen && (
                          <div
                            style={{
                              marginTop: '0.5rem',
                              border: '1px solid #bbf7d0',
                              borderRadius: '0.5rem',
                              overflow: 'hidden',
                            }}
                          >
                            <div style={{ maxHeight: '22rem', overflowY: 'auto' }}>
                              {qaItems.map((item, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr auto',
                                    gap: '0.75rem',
                                    padding: '0.625rem 0.875rem',
                                    borderBottom: idx < qaItems.length - 1 ? '1px solid #e8f5e9' : undefined,
                                    alignItems: 'center',
                                    background: idx % 2 === 0 ? 'white' : '#f8fffe',
                                  }}
                                >
                                  <div>
                                    <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600, marginBottom: '0.2rem' }}>
                                      {item.category}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#1e293b', lineHeight: 1.5, overflowWrap: 'anywhere' }}>
                                      {item.question}
                                    </div>
                                  </div>
                                  <div
                                    style={{
                                      width: '2rem', height: '2rem', borderRadius: '9999px',
                                      background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                                      border: '1px solid #86efac',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontWeight: 700, fontSize: '0.9rem', color: '#15803d',
                                      flexShrink: 0,
                                    }}
                                  >
                                    {item.answer}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })()}

            {/* Counseling Notes */}
            <Card style={{ boxShadow: '0 2px 8px rgba(22,163,74,0.08)' }}>
              <CardHeader>
                <CardTitle>
                  <MessageSquare className="w-4 h-4" style={{ color: '#16a34a' }} />
                  Counseling Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Add note */}
                <div
                  style={{
                    background: '#f8fffe', border: '1px solid #bbf7d0',
                    borderRadius: '0.625rem', padding: '1rem', marginBottom: '1.25rem',
                  }}
                >
                  <div className="detail-label" style={{ marginBottom: '0.5rem' }}>Add New Note</div>
                  <textarea
                    className="textarea"
                    rows={3}
                    placeholder="Enter your counseling notes here…"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <Button
                    onClick={saveNote}
                    disabled={!note.trim() || isSavingNote}
                    className="w-full"
                    style={{ marginTop: '0.625rem' }}
                  >
                    {isSavingNote ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      'Save Note'
                    )}
                  </Button>
                </div>

                {/* Previous notes */}
                <div>
                  <div className="detail-label" style={{ marginBottom: '0.625rem' }}>
                    Previous Notes
                    {student.notes?.length ? (
                      <span
                        style={{
                          marginLeft: '0.4rem', background: '#dcfce7', color: '#15803d',
                          borderRadius: '9999px', padding: '0.1rem 0.45rem',
                          fontSize: '0.7rem', fontWeight: 700,
                        }}
                      >
                        {student.notes.length}
                      </span>
                    ) : null}
                  </div>

                  {student.notes && student.notes.length > 0 ? (
                    <div style={{ maxHeight: '22rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                      {[...student.notes].reverse().map((noteItem) => (
                        <div key={noteItem.id} className="note-card">
                          <p style={{ color: '#1e293b', fontSize: '0.9rem', lineHeight: 1.55, margin: 0 }}>
                            {noteItem.note}
                          </p>
                          <div
                            style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              marginTop: '0.5rem', paddingTop: '0.4rem',
                              borderTop: '1px solid #e2f8ed',
                            }}
                          >
                            <span
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.3rem',
                                fontSize: '0.72rem', color: '#16a34a', fontWeight: 600,
                              }}
                            >
                              <User className="w-3 h-3" />
                              {noteItem.counselorName || 'Counselor'}
                            </span>
                            <span
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.3rem',
                                fontSize: '0.72rem', color: '#9ca3af',
                              }}
                            >
                              <Clock className="w-3 h-3" />
                              {formatDate(noteItem.createdAt)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state" style={{ padding: '1.5rem' }}>
                      <div className="empty-state-icon" style={{ width: '2.5rem', height: '2.5rem' }}>
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <p style={{ fontSize: '0.85rem' }}>No counseling notes yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Empty state */
          <Card style={{ boxShadow: '0 2px 8px rgba(22,163,74,0.08)' }}>
            <CardContent>
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Search className="w-6 h-6" />
                </div>
                <h3 style={{ color: '#1e293b', fontWeight: 700, marginBottom: '0.375rem', fontSize: '1rem' }}>
                  No Student Selected
                </h3>
                <p style={{ fontSize: '0.85rem', maxWidth: '22rem' }}>
                  Use the search bar above to find a student by name or mobile number, then select them to view their profile and add counseling notes.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* QR Scanner overlay */}
      {showScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
