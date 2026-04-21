import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Search, LogOut, User, Brain, MessageSquare, Loader2 } from 'lucide-react';
import { Student, NoteRequest } from '../types';
import http from '../utils/http';

const Dashboard: React.FC = () => {
  const { counselor, logout } = useAuth();
  const [searchMobile, setSearchMobile] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const searchStudent = async () => {
    if (!searchMobile.trim()) {
      setError('Please enter a mobile number');
      return;
    }

    setIsLoading(true);
    setError('');
    setStudent(null);

    try {
      const response = await http.get(`/counselors/student?mobile=${searchMobile}`);
      setStudent(response.data.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Student not found with this mobile number');
      } else {
        setError('Failed to fetch student details');
      }
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
        studentRegistrationId: student.registrationId,
        note: note.trim(),
      } as NoteRequest);

      // Refresh student data to show new note
      const response = await http.get(`/counselors/student?mobile=${searchMobile}`);
      setStudent(response.data.data);
      setNote('');
    } catch (err) {
      setError('Failed to save note');
    } finally {
      setIsSavingNote(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Counselor Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome, {counselor?.name}</p>
              </div>
            </div>
            <Button variant="outline" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Find Student
            </CardTitle>
            <CardDescription>
              Search for a student using their mobile number to view details and add counseling
              notes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Enter student mobile number"
                value={searchMobile}
                onChange={(e) => setSearchMobile(e.target.value)}
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && searchStudent()}
              />
              <Button onClick={searchStudent} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
            {error && (
              <div className="mt-4 text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>
            )}
          </CardContent>
        </Card>

        {/* Student Details */}
        {student && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Basic Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Student Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="text-lg font-semibold">{student.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Mobile</label>
                      <p className="text-lg">{student.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-lg">{student.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Type</label>
                      <p className="text-lg capitalize">{student.type?.replace('_', ' ')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Aptitude Test */}
              {student.aptitudeTest && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Brain className="w-5 h-5 mr-2" />
                      Aptitude Test Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Test Date</label>
                        <p className="text-lg">{formatDate(student.aptitudeTest.createdAt)}</p>
                      </div>
                      {student.aptitudeTest.result && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Result</label>
                          <p className="text-lg font-semibold text-primary-600">
                            {student.aptitudeTest.result}
                          </p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-gray-500">Responses</label>
                        <div className="mt-2 p-4 bg-gray-50 rounded-md">
                          <pre className="text-sm whitespace-pre-wrap">
                            {JSON.stringify(student.aptitudeTest.responses, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Notes Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Counseling Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Add New Note</label>
                      <textarea
                        className="mt-1 w-full p-3 border border-gray-300 rounded-md resize-none"
                        rows={3}
                        placeholder="Enter your counseling notes..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                      <Button
                        onClick={saveNote}
                        disabled={!note.trim() || isSavingNote}
                        className="mt-2 w-full"
                      >
                        {isSavingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Note'}
                      </Button>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Previous Notes</label>
                      <div className="mt-2 space-y-3 max-h-96 overflow-y-auto">
                        {student.notes.length > 0 ? (
                          student.notes.map((note) => (
                            <div key={note.id} className="p-3 bg-gray-50 rounded-md">
                              <p className="text-sm text-gray-800">{note.note}</p>
                              <div className="mt-2 flex justify-between items-center">
                                <span className="text-xs text-gray-500">
                                  {note.counselorName || 'Counselor'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDate(note.createdAt)}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">
                            No counseling notes yet
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
