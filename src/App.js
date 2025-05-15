import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:1338/api/todos';

function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(API_URL);
      console.log('API Response:', response.data);
      setTodos(response.data.data || []);
    } catch (error) {
      console.error('Error fetching todos:', error);
      setError('Failed to fetch todos. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const createTodo = async () => {
    if (!title.trim()) return;

    try {
      await axios.post(API_URL, {
        data: {
          title,
          description: description || null,
        },
      });
      resetForm();
      await fetchTodos();
    } catch (error) {
      console.error('Error creating todo:', error);
      setError('Failed to create todo. Please check console for details.');
    }
  };

  const updateTodo = async () => {
    if (!title.trim()) return;

    try {
      await axios.put(`${API_URL}/${editingId}`, {
        data: {
          title,
          description: description || null,
        },
      });
      resetForm();
      await fetchTodos();
    } catch (error) {
      console.error('Error updating todo:', error);
      setError('Failed to update todo. Please check console for details.');
    }
  };

  const deleteTodo = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this todo?')) return;

    try {
      setLoading(true);
      const response = await axios.delete(`${API_URL}/${documentId}`);

      // Accept any 2xx success response
      if (response.status >= 200 && response.status < 300) {
        await fetchTodos(); // Refresh the list
      } else {
        throw new Error('Delete failed with status: ' + response.status);
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError(`Delete failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (todo) => {
    setEditingId(todo.documentId);
    setTitle(todo.title || '');
    setDescription(todo.description ? formatDescriptionForEdit(todo.description) : '');
  };

  const cancelEditing = () => {
    resetForm();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    if (editingId) {
      updateTodo();
    } else {
      createTodo();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
  };

  const formatDescriptionForEdit = (desc) => {
    if (!desc) return '';
    if (Array.isArray(desc)) {
      return desc.map((item) => item.children?.[0]?.text || '').join('\n');
    }
    return desc;
  };

  const renderDescription = (desc) => {
    if (!desc) return null;
    try {
      if (Array.isArray(desc)) {
        return desc.map((item, index) => (
          <p key={index}>{item.children?.[0]?.text || ''}</p>
        ));
      }
      return <div dangerouslySetInnerHTML={{ __html: desc }} />;
    } catch (error) {
      console.error('Error rendering description:', error);
      return null;
    }
  };

  return (
    <div className="container">
      <h1>Todo App</h1>

      {error && (
        <div className="error">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="button-group">
          <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : editingId ? 'Update Todo' : 'Add Todo'}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEditing} disabled={loading}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading && !todos.length ? (
        <div>Loading todos...</div>
      ) : (
        <ul className="todo-list">
          {todos.length > 0 ? (
            todos.map((todo) => (
              <li key={todo.documentId} className="todo-item">
                <h3>{todo.title || 'No title'}</h3>
                {renderDescription(todo.description)}
                <div className="actions">
                  <button onClick={() => startEditing(todo)} disabled={loading}>
                    Edit
                  </button>
                  <button
                    onClick={() => deleteTodo(todo.documentId)}
                    disabled={loading}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))
          ) : (
            <p>No todos found. Add one to get started!</p>
          )}
        </ul>
      )}
    </div>
  );
}

export default App;
