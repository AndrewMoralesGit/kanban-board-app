import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import './TaskCard.css'
import editIcon from '../assets/pencil.svg'
import deleteIcon from '../assets/trash.svg'
import historyIcon from '../assets/calendar-time.svg'
import calendarIcon from '../assets/calendar-time.svg'
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
  const dragStartY = useRef(0)
  const isLocked = useRef(false) // If true, we determined the direction
  const isHorizontalSwipe = useRef(false) // If true, we are swiping horizontally
  
  const cardRef = useRef(null)

  const statusConfig = {
    pendiente: { color: '#a3a3a3', label: 'Pendiente' },
    en_progreso: { color: '#d4d4d4', label: 'En Progreso' },
    completado: { color: '#f5f5f5', label: 'Completado' }
  }

  const currentStatus = statusConfig[task.status] || statusConfig.pendiente

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

// Sortable hooks removed

  const combinedStyle = {
    transform: dragOffset ? `translateX(${dragOffset}px)` : undefined,
    transition: isDragging ? 'none' : 'transform 0.2s ease',
    borderLeftColor: currentStatus.color,
    touchAction: 'pan-y' // Allow vertical scrolling, handle horizontal manually
  }

  // Merge refs
  // Merge refs
  const setRefs = (node) => {
    cardRef.current = node
  }

  // Drag handlers
  function handleDragStart(e) {
    if (isEditing) return
    // Don't set isDragging true yet, wait for movement confirmation
    dragStartX.current = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX
    dragStartY.current = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY
    isLocked.current = false
    isHorizontalSwipe.current = false
  }

  function handleDragMove(e) {
    if (isEditing) return
    
    // Safety check just in case dragEnd didn't fire
    if (e.buttons === 0 && e.type.includes('mouse') && !isDragging) return 

    const currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX
    const currentY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY
    
    const diffX = currentX - dragStartX.current
    const diffY = currentY - dragStartY.current
    
    // 1. Direction Locking Phase
    if (!isLocked.current) {
      // Need a small threshold to determine direction
      const moveThreshold = 15 // Increased from 5 to prevent accidental swipes
      
      if (Math.abs(diffX) > moveThreshold || Math.abs(diffY) > moveThreshold) {
        isLocked.current = true
        
        // If vertical movement is dominant, IT IS A SCROLL OR DND-KIT DRAG. Ignore this swipe.
        // If Dnd-Kit activates (8px or delay), isSortableDragging will become true and component re-renders.
        
        if (Math.abs(diffY) > Math.abs(diffX)) {
          isHorizontalSwipe.current = false
          return
        } else {
          // Horizontal dominant -> Start dragging (Swipe)
          // But only if DndKit hasn't claimed it.
          isHorizontalSwipe.current = true
          setIsDragging(true)
        }
      }
    }

    // 2. Dragging Phase
    if (isLocked.current && isHorizontalSwipe.current) {
       // Prevent default only if we are sure it's a swipe to avoid scrolling page
       if (e.type.includes('touch') && e.cancelable) {
         // e.preventDefault() // React passive events might block this, but we rely on CSS touch-action
       }
       
       // Limit drag distance
       const maxDrag = 120
       
       // Add resistance/damping at edges
       let effectiveDiff = diffX
       if (Math.abs(diffX) > maxDrag) {
         // Logarithmic compression or simple clamping
         effectiveDiff = diffX > 0 
           ? maxDrag + (diffX - maxDrag) * 0.2
           : -maxDrag + (diffX + maxDrag) * 0.2
       }

       setDragOffset(effectiveDiff)
    }
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
        onUpdateTaskStatus(task.id, newStatus)
      }
    }
    
    setDragOffset(0)
    setIsDragging(false)
  }

  // ... render ...

  return (
    <div className={`task-card-wrapper status-${task.status}`}>
      {/* ... swipe labels ... */}

      <div
        ref={cardRef}
        className={`task-card ${isDragging ? 'dragging' : ''} ${showHistory ? 'history-active' : ''}`}
        style={combinedStyle}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M12 7v5l4 2" />
              </svg>
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
                    <img src={calendarIcon} alt="" style={{ width: '14px', height: '14px', marginRight: '6px', opacity: 0.8 }} />
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
