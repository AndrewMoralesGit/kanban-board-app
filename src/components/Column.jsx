import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import TaskCard from './TaskCard'
import NoteCard from './NoteCard'
import plusIcon from '../assets/plus.svg'
import editIcon from '../assets/pencil.svg'
import deleteIcon from '../assets/trash.svg'
import checkIcon from '../assets/check.svg'
import xIcon from '../assets/x.svg'
import ConfirmModal from './ConfirmModal'
import './Column.css'

function Column({ category, tasks, onAddTask, onUpdateTask, onDeleteTask, onUpdateCategory, onDeleteCategory, onUpdateTaskStatus, historyTaskId, setHistoryTaskId, isFocused, onFocus, onExitFocus }) {
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [isAddingNote, setIsAddingNote] = useState(false)
  
  // Task Form State
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringDuration, setRecurringDuration] = useState(21)
  const [targetCount, setTargetCount] = useState(1)
  
  // Note Form State
  const [noteTitle, setNoteTitle] = useState('')
  const [noteDescription, setNoteDescription] = useState('')
  const [showNoteError, setShowNoteError] = useState(false)

  const [activeTab, setActiveTab] = useState('pendiente') // 'pendiente' | 'en_progreso' | 'completado' | 'notes'
  const [isEditingCategory, setIsEditingCategory] = useState(false)
  const [categoryName, setCategoryName] = useState(category.name)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const editFormRef = useRef(null)

  // Handle click outside to cancel edit
  useEffect(() => {
    function handleClickOutside(event) {
      if (isEditingCategory && editFormRef.current && !editFormRef.current.contains(event.target)) {
        handleCancelEdit()
      }
    }

    if (isEditingCategory) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isEditingCategory])

  // Filter tasks vs notes
  const notes = tasks.filter(t => t.type === 'note')
  const regularTasks = tasks.filter(t => t.type !== 'note') // 'task' or null

  // Filter tasks by status and sort by position (or creation date if no position)
  const filteredItems = activeTab === 'notes'
    ? notes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    : regularTasks
        .filter(task => task.status === activeTab)
        .sort((a, b) => (a.position || 0) - (b.position || 0))
  
  // Count tasks by status
  const pendingCount = regularTasks.filter(t => t.status === 'pendiente').length
  const inProgressCount = regularTasks.filter(t => t.status === 'en_progreso').length
  const completedCount = regularTasks.filter(t => t.status === 'completado').length
  const notesCount = notes.length

  function handleTaskSubmit(e) {
    e.preventDefault()
    if (taskTitle.trim()) {
      const dueDateISO = dueDate ? new Date(dueDate).toISOString() : null
      
      onAddTask(
        category.id, 
        taskTitle.trim(), 
        taskDescription.trim(), 
        dueDateISO,
        isRecurring ? { 
          duration: parseInt(recurringDuration) || 21,
          targetCount: parseInt(targetCount) || 1
        } : null,
        'task' // Type
      )
      
      setTaskTitle('')
      setTaskDescription('')
      setDueDate('')
      setIsRecurring(false)
      setRecurringDuration(21)
      setTargetCount(1)
      setIsAddingTask(false)
    }
  }

  function handleNoteSubmit(e) {
    e.preventDefault()
    
    if (!noteTitle.trim()) {
      setShowNoteError(true)
      setTimeout(() => setShowNoteError(false), 500)
      return
    }

    onAddTask(
      category.id,
      noteTitle.trim(),
      noteDescription.trim(),
      null, // No due date
      null, // No recurring
      'note' // Type
    )
    setNoteTitle('')
    setNoteDescription('')
    setIsAddingNote(false)
  }

  function handleUpdateCategory(e) {
    e.preventDefault()
    if (categoryName.trim() && categoryName.trim() !== category.name) {
      onUpdateCategory(category.id, categoryName.trim())
    }
    setIsEditingCategory(false)
  }

  function handleDeleteCategory() {
    setShowDeleteConfirm(true)
  }

  function confirmDeleteCategory() {
    onDeleteCategory(category.id)
    setShowDeleteConfirm(false)
  }

  function handleCancelEdit() {
    setCategoryName(category.name)
    setIsEditingCategory(false)
  }

  return (
    <div 
      className={`column ${isFocused ? 'focused' : ''}`}
      onClick={(e) => {
        if (!isFocused) {
          onFocus()
        }
      }}
    >
      <div className="column-header">
        {isEditingCategory ? (
          <form 
            ref={editFormRef}
            onSubmit={handleUpdateCategory} 
            className="category-edit-form"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="category-edit-input"
              autoFocus
            />
            <div className="category-edit-actions">
              <button type="submit" className="btn btn-small btn-primary">
                Guardar
              </button>
              <button type="button" onClick={handleCancelEdit} className="btn btn-small btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <>
            <h2 className="column-title" style={{ cursor: 'pointer' }}>
              {category.name}
            </h2>
            
            {/* In Progress Indicator (Mini View) */}
            {!isFocused && inProgressCount > 0 && (
              <div className="column-progress-indicator" title={`${inProgressCount} tareas en progreso`}>
                <span className="pulse-dot"></span>
                {inProgressCount} en progreso
              </div>
            )}

            <div className="column-header-actions">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditingCategory(true)
                }}
                className="btn-icon"
                title="Editar categoría"
              >
                <img src={editIcon} alt="Editar" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteCategory()
                }}
                className="btn-icon btn-delete"
                title="Eliminar categoría"
              >
                <img src={deleteIcon} alt="Eliminar" />
              </button>
              {isFocused && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onExitFocus()
                  }}
                  className="btn-icon btn-exit-focus"
                  title="Salir del modo focus (Esc)"
                >
                  ✕
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="column-tabs" onClick={(e) => e.stopPropagation()}>
        <button
          className={`tab ${activeTab === 'pendiente' ? 'active' : ''}`}
          onClick={() => setActiveTab('pendiente')}
          title="Pendiente"
        >
          Pend. ({pendingCount})
        </button>
        <button
          className={`tab ${activeTab === 'en_progreso' ? 'active' : ''}`}
          onClick={() => setActiveTab('en_progreso')}
          title="En Progreso"
        >
          Prog. ({inProgressCount})
        </button>
        <button
          className={`tab ${activeTab === 'completado' ? 'active' : ''}`}
          onClick={() => setActiveTab('completado')}
          title="Completado"
        >
          Comp. ({completedCount})
        </button>
        <button
          className={`tab ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
          title="Apuntes"
        >
          Notas ({notesCount})
        </button>
      </div>

      {/* Content list */}
      <div className="column-content">
        {activeTab === 'notes' ? (
          filteredItems.map((note) => (
            <div key={note.id} onClick={(e) => e.stopPropagation()}>
              <NoteCard
                note={note}
                onUpdate={onUpdateTask}
                onDelete={onDeleteTask}
              />
            </div>
          ))
        ) : (
            filteredItems.map((task) => (
              <div key={task.id} onClick={(e) => e.stopPropagation()}>
                <TaskCard
                  task={task}
                  onUpdate={onUpdateTask}
                  onDelete={onDeleteTask}
                  onUpdateTaskStatus={onUpdateTaskStatus}
                  showHistory={historyTaskId === task.id}
                  onToggleHistory={() => setHistoryTaskId(historyTaskId === task.id ? null : task.id)}
                />
              </div>
            ))
        )}
      </div>

      {/* Floating Action Button */}
      {!isAddingTask && !isAddingNote && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (activeTab === 'notes') {
              setIsAddingNote(true)
            } else {
              setIsAddingTask(true)
            }
          }}
          className={`fab-add-task ${activeTab === 'notes' ? 'fab-add-note' : ''}`}
          title={activeTab === 'notes' ? "Agregar nota" : "Agregar tarea"}
        >
          <img src={plusIcon} alt="Agregar" width="20" height="20" />
        </button>
      )}

      {/* Add Task Modal */}
      {isAddingTask && createPortal(
        <div className="modal-backdrop" onClick={() => {
          setIsAddingTask(false)
          setTaskTitle('')
          setTaskDescription('')
          setDueDate('')
          setIsRecurring(false)
          setTargetCount(1)
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Nueva Tarea</h3>
            <form onSubmit={handleTaskSubmit} className="task-form-modal">
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsAddingTask(false)
                    setTaskTitle('')
                    setTaskDescription('')
                  }
                }}
                placeholder="Título de la tarea"
                className="task-input-modal"
                autoFocus
              />
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Descripción (opcional)"
                className="task-textarea-modal"
                rows="4"
              />
              <div className="task-due-date-field">
                <label htmlFor="due-date" className="task-due-date-label">
                  Fecha de vencimiento (opcional)
                </label>
                <input
                  id="due-date"
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="task-due-date-input"
                />
              </div>

              {/* Recurring Task Option */}
              <div className="task-recurring-field">
                <div className="task-recurring-toggle">
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                  <span className="task-recurring-label">Es un hábito / tarea diaria</span>
                </div>
                
                {isRecurring && (
                  <>
                    <div className="task-recurring-options">
                      <label className="task-due-date-label">
                        Duración (días)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={recurringDuration}
                        onChange={(e) => setRecurringDuration(e.target.value)}
                        className="task-due-date-input"
                        placeholder="Ej: 21"
                      />
                    </div>
                    
                    <div className="task-recurring-options">
                      <label className="task-due-date-label">
                        Repeticiones por día (Contador)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={targetCount}
                        onChange={(e) => setTargetCount(e.target.value)}
                        className="task-due-date-input"
                        placeholder="Ej: 1 (Normal), 8 (Vasos de agua)"
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">
                  Agregar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingTask(false)
                    setTaskTitle('')
                    setTaskDescription('')
                  }}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Add Note Modal - Full Screen Mobile Logic */}
      {isAddingNote && createPortal(
        <div className="modal-backdrop note-edit-backdrop" onClick={() => {
          setIsAddingNote(false)
          setNoteTitle('')
          setNoteDescription('')
          setShowNoteError(false)
        }}>
          <div className="modal-content note-edit-modal" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleNoteSubmit} className="note-edit-form-full">
              <div className="note-edit-header">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsAddingNote(false)
                    setNoteTitle('')
                    setNoteDescription('')
                    setShowNoteError(false)
                  }}
                  className="btn-icon-action btn-cancel-action" 
                  title="Cancelar"
                >
                  <img src={xIcon} alt="Cancelar" width="24" height="24" />
                </button>
                <h3 className="modal-title-center">Nuevo Apunte</h3>
                <button type="submit" className="btn-icon-action btn-save-action" title="Guardar">
                  <img src={checkIcon} alt="Guardar" width="24" height="24" />
                </button>
              </div>

              <div className="note-edit-body">
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => {
                    setNoteTitle(e.target.value)
                    if (showNoteError) setShowNoteError(false)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsAddingNote(false)
                      setNoteTitle('')
                      setNoteDescription('')
                      setShowNoteError(false)
                    }
                  }}
                  placeholder="Título del apunte"
                  className={`note-input-full ${showNoteError ? 'input-error shake' : ''}`}
                  autoFocus
                />
                <textarea
                  value={noteDescription}
                  onChange={(e) => setNoteDescription(e.target.value)}
                  placeholder="Escribe tu nota aquí..."
                  className="note-textarea-full"
                  style={{ fontFamily: "'Kalam', 'Architects Daughter', cursive, sans-serif" }}
                />
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
      
      {/* Delete Category Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Eliminar categoría"
        message={`¿Estás seguro de que quieres eliminar la categoría "${category.name}"? Todas las tareas en esta categoría también se eliminarán.`}
        onConfirm={confirmDeleteCategory}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDanger={true}
      />
    </div>
  )
}

export default Column
