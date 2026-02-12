import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import './TaskCard.css'
import editIcon from '../assets/pencil.svg'
import deleteIcon from '../assets/trash.svg'
import historyIcon from '../assets/calendar-time.svg'
import ConfirmModal from './ConfirmModal'

// Helper function to calculate urgency status
function getUrgencyStatus(dueDate) {
  if (!dueDate) return null
  
  const now = new Date()
  const due = new Date(dueDate)
  const diffHours = (due - now) / (1000 * 60 * 60)
  
  if (diffHours < 0) return 'overdue'      // Vencida (rojo)
  if (diffHours < 24) return 'urgent'      // Menos de 24h (naranja)
  if (diffHours < 72) return 'soon'        // Menos de 3 días (amarillo)
  return 'normal'                          // Normal (gris)
}

// Helper function to format due date
function formatDueDate(dueDate) {
  const due = new Date(dueDate)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  
  const timeStr = due.toLocaleTimeString('es-ES', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true
  })
  
  if (dueDay.getTime() === today.getTime()) {
    return `Hoy, ${timeStr}`
  } else if (dueDay.getTime() === tomorrow.getTime()) {
    return `Mañana, ${timeStr}`
  } else {
    const dateStr = due.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short'
    })
    return `${dateStr}, ${timeStr}`
  }
}

function TaskCard({ task, onUpdate, onDelete, onUpdateTaskStatus, onIncrementTaskCount, showHistory, onToggleHistory }) {
  const [isEditing, setIsEditing] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [dueDate, setDueDate] = useState(task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '')
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const dragStartX = useRef(0)
  const cardRef = useRef(null)

  function handleSave() {
    if (title.trim()) {
      const updates = { 
        title: title.trim(), 
        description: description.trim()
      }
      
      // Handle due date update
      if (dueDate) {
        updates.due_date = new Date(dueDate).toISOString()
      } else {
        updates.due_date = null
      }
      
      onUpdate(task.id, updates)
      setIsEditing(false)
    }
  }

  function handleCancel() {
    setTitle(task.title)
    setDescription(task.description || '')
    setDueDate(task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '')
    setIsEditing(false)
  }

  function handleDelete() {
    setShowDeleteConfirm(true)
  }

  function confirmDelete() {
    onDelete(task.id)
    setShowDeleteConfirm(false)
  }

  // Drag handlers
  function handleDragStart(e) {
    if (isEditing) return
    setIsDragging(true)
    dragStartX.current = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX
  }

  function handleDragMove(e) {
    if (!isDragging || isEditing) return
    
    const currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX
    const diff = currentX - dragStartX.current
    
    // Limit drag distance
    const maxDrag = 120
    const limitedDiff = Math.max(-maxDrag, Math.min(maxDrag, diff))
    setDragOffset(limitedDiff)
  }

  function handleDragEnd() {
    if (!isDragging || isEditing) return
    
    const threshold = 60
    
    if (Math.abs(dragOffset) > threshold) {
      // Determine new status based on drag direction and current status
      let newStatus = task.status
      
      if (dragOffset < 0) {
        // Swipe left - move backwards
        if (task.status === 'completado') newStatus = 'en_progreso'
        else if (task.status === 'en_progreso') newStatus = 'pendiente'
      } else {
        // Swipe right - move forwards
        if (task.status === 'pendiente') newStatus = 'en_progreso'
        else if (task.status === 'en_progreso') newStatus = 'completado'
      }
      
      if (newStatus !== task.status) {
        // Optimistic update for UI feel, but actual logic in App.jsx will handle bounce
        // However, for better UX, we might want to check here too to animate the bounce
        
        // If COUNTER task trying to complete but not finished
        if (newStatus === 'completado' && task.target_count > 1 && (task.current_count || 0) < task.target_count) {
          // Visual bounce effect could be added here
          // For now, we just triggering the update status which will handle the logic
          // But to prevent the card from visually "sticking" in the wrong column during async,
          // we rely on the parent's state update.
        }
        
        onUpdateTaskStatus(task.id, newStatus)
      }
    }
    
    setDragOffset(0)
    setIsDragging(false)
  }

  // Get next/previous status labels
  function getSwipeLabels() {
    const labels = {
      pendiente: { left: null, right: 'En Progreso' },
      en_progreso: { left: 'Pendiente', right: 'Completado' },
      completado: { left: 'En Progreso', right: null }
    }
    return labels[task.status] || labels.pendiente
  }

  const swipeLabels = getSwipeLabels()
  // Show LEFT label when dragging RIGHT (label appears in the space on the left)
  // Show RIGHT label when dragging LEFT (label appears in the space on the right)
  const showLeftLabel = dragOffset > 10 && swipeLabels.right
  const showRightLabel = dragOffset < -10 && swipeLabels.left

  const statusConfig = {
    pendiente: { color: '#a3a3a3', label: 'Pendiente' },
    en_progreso: { color: '#d4d4d4', label: 'En Progreso' },
    completado: { color: '#f5f5f5', label: 'Completado' }
  }

  const currentStatus = statusConfig[task.status] || statusConfig.pendiente

  // Add/remove class to body when modal is open to disable hover effects
  useEffect(() => {
    if (showHistory || showDetailModal) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }
    return () => document.body.classList.remove('modal-open')
  }, [showHistory, showDetailModal])

  if (isEditing) {
    return (
      <div className="task-card editing">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="task-edit-input"
          autoFocus
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="task-edit-textarea"
          rows="3"
          placeholder="Descripción"
        />
        <div className="task-edit-due-date">
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="task-edit-date-input"
          />
        </div>
        <div className="task-edit-actions">
          <button onClick={handleSave} className="btn btn-small btn-primary">
            Guardar
          </button>
          <button onClick={handleCancel} className="btn btn-small btn-secondary">
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`task-card-wrapper status-${task.status}`}>
      {/* Left label - shows when dragging RIGHT */}
      <div className={`swipe-label swipe-label-left ${showLeftLabel ? 'visible' : ''}`}>
        <span>{swipeLabels.right}</span>
      </div>
      
      {/* Right label - shows when dragging LEFT */}
      <div className={`swipe-label swipe-label-right ${showRightLabel ? 'visible' : ''}`}>
        <span>{swipeLabels.left}</span>
      </div>

      <div
        ref={cardRef}
        className={`task-card ${isDragging ? 'dragging' : ''} ${showHistory ? 'history-active' : ''}`}
        style={{
          transform: `translateX(${dragOffset}px)`,
          borderLeftColor: currentStatus.color
        }}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        <div className="task-card-header">
          <div className="task-card-actions">
            <button
              onClick={onToggleHistory}
              className="btn-icon"
              title="Ver historial"
            >
              <img src={historyIcon} alt="Historial" />
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="btn-icon"
              title="Editar"
            >
              <img src={editIcon} alt="Editar" />
            </button>
            <button
              onClick={handleDelete}
              className="btn-icon btn-delete"
              title="Eliminar"
            >
              <img src={deleteIcon} alt="Eliminar" />
            </button>
          </div>
        </div>
        
        <div 
          className="task-card-content"
          onClick={(e) => {
            if (!isEditing && !isDragging) {
              e.stopPropagation()
              setShowDetailModal(true)
            }
          }}
          style={{ cursor: isEditing ? 'default' : 'pointer' }}
        >
          {isEditing ? (
            <div className="task-edit-form">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="task-edit-input"
                placeholder="Título"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="task-edit-textarea"
                placeholder="Descripción"
                rows="2"
              />
              <div className="task-edit-actions">
                <button onClick={handleSave} className="btn btn-small btn-primary">
                  Guardar
                </button>
                <button onClick={handleCancel} className="btn btn-small btn-secondary">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="task-title">{task.title}</h3>
              {task.description && (
                <p className="task-description">
                  {task.description.length > 100 
                    ? `${task.description.substring(0, 100)}...` 
                    : task.description
                  }
                </p>
              )}
              
              <div className="task-badges">
                {/* Due Date Badge */}
                {task.due_date && (
                  <div className={`task-due-date ${getUrgencyStatus(task.due_date)}`}>
                    {getUrgencyStatus(task.due_date) === 'overdue' && 'Vencida: '}
                    {getUrgencyStatus(task.due_date) === 'urgent' && 'Vence: '}
                    {getUrgencyStatus(task.due_date) === 'soon' && 'Vence: '}
                    {getUrgencyStatus(task.due_date) === 'normal' && 'Vence: '}
                    {formatDueDate(task.due_date)}
                  </div>
                )}

                {/* Recurring Task Badge */}
                {task.recurring_task_id && (
                  <div className="task-recurring-badge">
                    Hábito diario
                  </div>
                )}

                {/* Counter Badge */}
                {task.target_count > 1 && (
                  <div className="task-counter-wrapper">
                    <div className="task-counter-badge">
                      {task.current_count || 0} / {task.target_count}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Task Detail Modal */}
      {showDetailModal && createPortal(
        <>
          <div className="modal-backdrop" onClick={() => setShowDetailModal(false)} />
          
          {/* Clone of the active task card */}
          <div
            className="task-card history-active-clone"
            style={{
              position: 'fixed',
              top: cardRef.current?.getBoundingClientRect().top + 'px',
              left: cardRef.current?.getBoundingClientRect().left + 'px',
              width: cardRef.current?.getBoundingClientRect().width + 'px',
              borderLeftColor: currentStatus.color,
              pointerEvents: 'none'
            }}
          >
            <div className="task-card-header">
              <div className="task-card-actions">
                <button className="btn-icon">
                  <img src={historyIcon} alt="Historial" />
                </button>
                <button className="btn-icon">
                  <img src={editIcon} alt="Editar" />
                </button>
                <button className="btn-icon">
                  <img src={deleteIcon} alt="Eliminar" />
                </button>
              </div>
            </div>
            <div className="task-card-content">
              <h3 className="task-title">{task.title}</h3>
              {task.description && (
                <p className="task-description">
                  {task.description.length > 100 
                    ? `${task.description.substring(0, 100)}...` 
                    : task.description
                  }
                </p>
              )}
            </div>
          </div>

          <div className="task-detail-modal">
            <div className="detail-header">
              <h3>{task.title}</h3>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="btn-close"
              >
                ✕
              </button>
            </div>
            <div className="detail-content">
              <div className="detail-section">
                <h4>Descripción</h4>
                <p>{task.description || 'Sin descripción'}</p>
              </div>
              <div className="detail-section">
                <h4>Estado</h4>
                <span className="status-badge" style={{ backgroundColor: currentStatus.color }}>
                  {currentStatus.label}
                </span>
              </div>
              <div className="detail-section">
                <h4>Fecha de creación</h4>
                <p>{new Date(task.created_at).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* History Modal - Rendered outside card structure using Portal */}
      {showHistory && createPortal(
        <>
          <div className="modal-backdrop" onClick={onToggleHistory} />
          
          {/* Clone of the active task card to appear above backdrop */}
          <div
            className="task-card history-active-clone"
            style={{
              position: 'fixed',
              top: cardRef.current?.getBoundingClientRect().top + 'px',
              left: cardRef.current?.getBoundingClientRect().left + 'px',
              width: cardRef.current?.getBoundingClientRect().width + 'px',
              borderLeftColor: currentStatus.color,
              pointerEvents: 'none'
            }}
          >
            <div className="task-card-header">
              <div className="task-card-actions">
                <button className="btn-icon" title="Ver historial">
                  <img src={historyIcon} alt="Historial" />
                </button>
                <button className="btn-icon" title="Editar">
                  <img src={editIcon} alt="Editar" />
                </button>
                <button className="btn-icon">
                  <img src={deleteIcon} alt="Eliminar" />
                </button>
              </div>
            </div>
            <div className="task-card-content">
              <h3 className="task-title">{task.title}</h3>
              {task.description && (
                <p className="task-description">
                  {task.description.length > 100 
                    ? `${task.description.substring(0, 100)}...` 
                    : task.description
                  }
                </p>
              )}
            </div>
          </div>

          <div className="task-history-modal">
            <div className="history-header">
              <div>
                <h4>Historial de la tarea</h4>
                <p className="history-task-title">{task.title}</p>
              </div>
              <button 
                onClick={onToggleHistory}
                className="btn-close"
              >
                ✕
              </button>
            </div>
            <div className="history-timeline">
              {task.status_history && task.status_history.length > 0 ? (
                task.status_history.map((entry, index) => {
                  const date = new Date(entry.timestamp)
                  const statusLabels = {
                    pendiente: 'Pendiente',
                    en_progreso: 'En Progreso',
                    completado: 'Completado'
                  }
                  
                  // Determine display text based on change type
                  let displayText = ''
                  const changeType = entry.change_type || 'status_change'
                  
                  switch (changeType) {
                    case 'created':
                      displayText = 'Tarea creada'
                      break
                    case 'status_change':
                      displayText = entry.previous_status === null 
                        ? 'Tarea creada' 
                        : `${statusLabels[entry.previous_status]} → ${statusLabels[entry.status]}`
                      break
                    case 'title_edit':
                      displayText = 'Título actualizado'
                      break
                    case 'description_edit':
                      displayText = 'Descripción actualizada'
                      break
                    default:
                      displayText = 'Cambio registrado'
                  }
                  
                  return (
                    <div key={index} className="history-entry">
                      <div className="history-dot"></div>
                      <div className="history-content">
                        <div className="history-status">
                          {displayText}
                        </div>
                        <div className="history-date">
                          {date.toLocaleDateString('es-ES', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="no-history">No hay historial disponible</p>
              )}
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Eliminar tarea"
        message="¿Estás seguro de que quieres eliminar esta tarea?"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDanger={true}
      />
    </div>
  )
}

export default TaskCard
