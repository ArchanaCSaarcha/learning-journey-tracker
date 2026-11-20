import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useGoals } from '../context/GoalsContext';
import { useSubjects } from '../context/SubjectsContext';
import { useNotes } from '../context/NotesContext';
import Modal from '../components/Modal';

function Notes() {
  const { goals } = useGoals();
  const { subjects } = useSubjects();

  const { notes, loading, error: loadError, addNote, updateNote, deleteNote } = useNotes();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGoalId, setFilterGoalId] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    goalId: '',
    subjectId: '',
    content: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
      ...(name === 'goalId' ? { subjectId: '' } : {}),
    }));
  };

  const filteredSubjects = subjects.filter(
    (subject) => subject.goalId === formData.goalId
  );

  const filterAvailableSubjects = subjects.filter(
    (subject) => !filterGoalId || subject.goalId === filterGoalId
  );

  const handleOpenAdd = () => {
    setFormData({
      title: '',
      goalId: '',
      subjectId: '',
      content: '',
    });
    setEditingId(null);
    setAttachment(null);
    setActionError('');
    setIsModalOpen(true);
  };

  const handleEdit = (note) => {
    setFormData({
      title: note.title,
      goalId: note.goalId || '',
      subjectId: note.subjectId || '',
      content: note.content,
    });
    setEditingId(note.id);
    setAttachment(note.attachment || null);
    setActionError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setFormData({
      title: '',
      goalId: '',
      subjectId: '',
      content: '',
    });
    setEditingId(null);
    setAttachment(null);
    setActionError('');
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setActionError('Please enter a note title and content.');
      return;
    }
    setSaving(true);
    setActionError('');
    try {
      const noteData = { ...formData, attachment };
      if (editingId) {
        await updateNote(editingId, noteData);
      } else {
        await addNote(noteData);
      }
      handleCloseModal();
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || 'Failed to save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    setActionError('');
    try {
      await deleteNote(id);
      if (editingId === id) handleCloseModal();
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || 'Failed to delete note. Please try again.');
    }
  };

  // Filter notes by search, goal, and subject
  const visibleNotes = notes.filter((note) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      note.title.toLowerCase().includes(q) ||
      note.content.toLowerCase().includes(q) ||
      Boolean(note.attachment?.name && note.attachment.name.toLowerCase().includes(q));

    const matchesGoal = !filterGoalId || note.goalId === filterGoalId;
    const matchesSubject = !filterSubjectId || note.subjectId === filterSubjectId;

    return matchesSearch && matchesGoal && matchesSubject;
  });

  return (
    <div className="min-h-screen bg-[#F4F8EE] p-8">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/dashboard"
          className="mb-6 inline-block font-medium text-[#375534] hover:underline"
        >
          ← Back to Dashboard
        </Link>

        {/* Heading & Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#0F2A1D]">
              My Notes
            </h1>
            <p className="text-gray-600 mt-2">
              Save key insights, summaries, and PDF attachments from your learning.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="rounded-lg bg-[#375534] px-5 py-3 font-medium text-white shadow-sm hover:bg-[#294226] transition"
          >
            + Create New Note
          </button>
        </div>

        {(loadError || (actionError && !isModalOpen)) && (
          <p className="mb-6 rounded-lg bg-red-50 p-4 text-red-600">
            {loadError || actionError}
          </p>
        )}

        {/* Search & Filter Toolbar */}
        <div className="mb-8 rounded-xl bg-white p-5 shadow-sm border border-[#AEC3B0]/40 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search notes by title, content, or PDF name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#375534] focus:ring-1 focus:ring-[#375534]"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={filterGoalId}
              onChange={(e) => {
                setFilterGoalId(e.target.value);
                setFilterSubjectId('');
              }}
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#375534]"
            >
              <option value="">All Goals</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>

            <select
              value={filterSubjectId}
              onChange={(e) => setFilterSubjectId(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#375534]"
            >
              <option value="">All Subjects</option>
              {filterAvailableSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {(searchQuery || filterGoalId || filterSubjectId) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterGoalId('');
                  setFilterSubjectId('');
                }}
                className="rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Modal Submit Form */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingId ? 'Edit Note' : 'Create a New Note'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {actionError && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {actionError}
              </p>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter note title"
                required
                disabled={saving}
                className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-[#375534] focus:ring-1 focus:ring-[#375534]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Related Goal (Optional)
                </label>
                <select
                  name="goalId"
                  value={formData.goalId}
                  onChange={handleChange}
                  disabled={saving}
                  className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-[#375534] focus:ring-1 focus:ring-[#375534]"
                >
                  <option value="">Select a goal</option>
                  {goals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Related Subject (Optional)
                </label>
                <select
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={handleChange}
                  disabled={!formData.goalId || saving}
                  className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-[#375534] focus:ring-1 focus:ring-[#375534] disabled:bg-gray-100"
                >
                  <option value="">Select a subject</option>
                  {filteredSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PDF Attachment (Optional, up to 5 MB)
              </label>
              <input
                type="file"
                accept="application/pdf,.pdf"
                disabled={saving}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) {
                    setActionError('Please choose a PDF file.');
                    event.target.value = '';
                    return;
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    setActionError('PDF file must be smaller than 5 MB.');
                    event.target.value = '';
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    setAttachment({ name: file.name, data: reader.result });
                    setActionError('');
                  };
                  reader.onerror = () => setActionError('Could not read this PDF file.');
                  reader.readAsDataURL(file);
                }}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#E3EED4] file:text-[#0F2A1D] hover:file:bg-[#AEC3B0]/50"
              />

              {attachment && (
                <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs bg-[#E3EED4] border border-[#AEC3B0]/50 p-2.5 rounded-lg text-[#0F2A1D]">
                  <span className="font-medium truncate max-w-xs">{attachment.name}</span>
                  <a href={attachment.data} target="_blank" rel="noreferrer" className="text-[#375534] hover:text-[#0F2A1D] underline font-semibold">
                    Preview
                  </a>
                  <a href={attachment.data} download={attachment.name} className="text-[#375534] hover:text-[#0F2A1D] underline font-semibold">
                    Download
                  </a>
                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    className="text-red-600 underline font-semibold ml-auto"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note Content *
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Write your study notes, insights, and summaries here..."
                required
                disabled={saving}
                rows="5"
                className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-[#375534] focus:ring-1 focus:ring-[#375534]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#375534] px-6 py-2.5 font-medium text-white shadow-sm hover:bg-[#294226] disabled:opacity-50 transition"
              >
                {saving ? 'Saving...' : editingId ? 'Update Note' : 'Save Note'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Notes Grid */}
        <div>
          <h2 className="text-xl font-semibold text-[#0F2A1D] mb-4">
            Your Notes ({visibleNotes.length} of {notes.length})
          </h2>

          {loading ? (
            <div className="bg-white p-8 rounded-xl text-center shadow-sm border border-[#AEC3B0]/40">
              <p className="text-gray-500">
                Loading notes...
              </p>
            </div>
          ) : notes.length === 0 ? (
            <div className="bg-white p-12 rounded-xl text-center shadow-sm border border-[#AEC3B0]/40">
              <p className="text-lg text-gray-500">
                No notes created yet.
              </p>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="mt-4 rounded-lg bg-[#375534] px-5 py-2.5 font-medium text-white hover:bg-[#294226] transition shadow-sm"
              >
                Create your first note
              </button>
            </div>
          ) : visibleNotes.length === 0 ? (
            <div className="bg-white p-12 rounded-xl text-center shadow-sm border border-[#AEC3B0]/40">
              <p className="text-gray-500">
                No notes match your search or filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterGoalId('');
                  setFilterSubjectId('');
                }}
                className="mt-3 text-sm text-[#375534] font-medium underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleNotes.map((note) => {
                const noteGoal = goals.find((g) => g.id === note.goalId);
                const noteSubject = subjects.find((s) => s.id === note.subjectId);

                return (
                  <div
                    key={note.id}
                    className="bg-white rounded-xl shadow-sm border border-[#AEC3B0]/40 hover:border-[#375534] p-6 flex flex-col justify-between hover:shadow-md transition"
                  >
                    <div>
                      <h3 className="font-bold text-lg text-[#0F2A1D] mb-2">
                        {note.title}
                      </h3>

                      {(noteGoal || noteSubject) && (
                        <div className="flex flex-wrap gap-1.5 mb-3 text-xs">
                          {noteGoal && (
                            <span className="bg-[#E3EED4] text-[#0F2A1D] px-2.5 py-0.5 rounded-full font-medium">
                              {noteGoal.title}
                            </span>
                          )}
                          {noteSubject && (
                            <span className="bg-[#AEC3B0]/50 text-[#0F2A1D] px-2.5 py-0.5 rounded-full font-medium">
                              {noteSubject.name}
                            </span>
                          )}
                        </div>
                      )}

                      <p className="text-gray-600 text-sm whitespace-pre-line line-clamp-4 mb-4">
                        {note.content}
                      </p>

                      {note.attachment && (
                        <div className="bg-[#F4F8EE] border border-[#AEC3B0]/40 rounded-lg p-3 mb-4 text-xs">
                          <p className="font-semibold text-gray-700 truncate mb-1.5 flex items-center gap-1.5">
                            <span className="text-[#375534] font-bold">PDF:</span> {note.attachment.name}
                          </p>
                          <div className="flex gap-3">
                            <a
                              href={note.attachment.data}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#375534] hover:text-[#0F2A1D] underline font-medium"
                            >
                              Open
                            </a>
                            <a
                              href={note.attachment.data}
                              download={note.attachment.name}
                              className="text-[#375534] hover:text-[#0F2A1D] underline font-medium"
                            >
                              Download
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => handleEdit(note)}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 transition"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(note.id)}
                        className="rounded-lg border border-red-200 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Notes;
