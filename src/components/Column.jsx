import { useState } from 'react'
import TaskCard from './TaskCard'
import plusIcon from '../assets/plus.svg'
import ConfirmModal from './ConfirmModal'
import './Column.css'

function Column({ category, tasks, onAddTask, onUpdateTask, onDeleteTask, onUpdateCategory, onDeleteCategory, onUpdateTaskStatus, historyTaskId, setHistoryTaskId, isFocused, onFocus, onExitFocus }) {
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringDuration, setRecurringDuration] = useState(21)
  const [targetCount, setTargetCount] = useState(1)
  const [activeTab, setActiveTab] = useState('pendiente')
  const [isEditingCategory, setIsEditingCategory] = useState(false)
  const [categoryName, setCategoryName] = useState(category.name)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Filter tasks by status and sort by creation date (newest first)
  const filteredTasks = tasks
    .filter(task => task.status === activeTab)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  
  // Count tasks by status
  const pendingCount = tasks.filter(t => t.status === 'pendiente').length
  const inProgressCount = tasks.filter(t => t.status === 'en_progreso').length
  const completedCount = tasks.filter(t => t.status === 'completado').length

  function handleSubmit(e) {
    e.preventDefault()
    if (taskTitle.trim()) {
      // Convert datetime-local to ISO string if dueDate is set
      const dueDateISO = dueDate ? new Date(dueDate).toISOString() : null
      
      onAddTask(
        category.id, 
        taskTitle.trim(), 
        taskDescription.trim(), 
        dueDateISO,
        isRecurring ? { 
          duration: parseInt(recurringDuration) || 21,
          targetCount: parseInt(targetCount) || 1
        } : null
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
    <div className={`column ${isFocused ? 'focused' : ''}`}>
      <div className="column-header">
        {isEditingCategory ? (
          <form onSubmit={handleUpdateCategory} className="category-edit-form">
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
            <h2 className="column-title" onClick={onFocus} style={{ cursor: 'pointer' }}>
              {category.name}
            </h2>
            <div className="column-header-actions">
              <button
                onClick={() => setIsEditingCategory(true)}
                className="btn-icon"
                title="Editar categoría"
              >
                ✎
              </button>
              <button
                onClick={handleDeleteCategory}
                className="btn-icon btn-delete"
                title="Eliminar categoría"
              >
                🗑
              </button>
              {isFocused && (
                <button
                  onClick={onExitFocus}
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

      <div className="column-tabs">
        <button
          className={`tab ${activeTab === 'pendiente' ? 'active' : ''}`}
          onClick={() => setActiveTab('pendiente')}
        >
          Pendiente ({pendingCount})
        </button>
        <button
          className={`tab ${activeTab === 'en_progreso' ? 'active' : ''}`}
          onClick={() => setActiveTab('en_progreso')}
        >
          En Progreso ({inProgressCount})
        </button>
        <button
          className={`tab ${activeTab === 'completado' ? 'active' : ''}`}
          onClick={() => setActiveTab('completado')}
        >
          Completado ({completedCount})
        </button>
      </div>

      {/* Task list */}
      <div className="column-content">
        {filteredTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onUpdate={onUpdateTask}
            onDelete={onDeleteTask}
            onUpdateTaskStatus={onUpdateTaskStatus}
            showHistory={historyTaskId === task.id}
            onToggleHistory={() => setHistoryTaskId(historyTaskId === task.id ? null : task.id)}
          />
        ))}
      </div>

      {/* Floating Action Button */}
      {!isAddingTask && (
        <button
          onClick={() => setIsAddingTask(true)}
          className="fab-add-task"
          title="Agregar tarea"
        >
          <img src={plusIcon} alt="Agregar" width="20" height="20" />
        </button>
      )}

      {/* Add Task Modal */}
      {isAddingTask && (
        <div className="modal-backdrop" onClick={() => {
          setIsAddingTask(false)
          setTaskTitle('')
          setTaskDescription('')
          setDueDate('')
          setIsRecurring(false)
          setTargetCount(1)
        }}>  <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Nueva Tarea</h3>
            <form onSubmit={handleSubmit} className="task-form-modal">
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
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setTaskTitle('')
                    setTaskDescription('')
                    setDueDate('')
                    setIsRecurring(false)
                  }
                }}
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
        </div>
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
