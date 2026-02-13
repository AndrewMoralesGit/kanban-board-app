import { useState } from 'react'
import { createPortal } from 'react-dom'
import './NoteCard.css'
import editIcon from '../assets/pencil.svg'
import deleteIcon from '../assets/trash.svg'
import checkIcon from '../assets/check.svg'
import xIcon from '../assets/x.svg'
import ConfirmModal from './ConfirmModal'


function NoteCard({ note, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(note.title)
  const [description, setDescription] = useState(note.description)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showError, setShowError] = useState(false)

  function handleSave(e) {
    if (e) e.preventDefault()
    
    if (!title.trim()) {
      setShowError(true)
      // Reset error animation after it plays
      setTimeout(() => setShowError(false), 500)
      return
    }

    onUpdate(note.id, {
      title: title.trim(),
      description: description.trim()
    })
    setIsEditing(false)
  }

  function handleCancel() {
    setTitle(note.title)
    setDescription(note.description || '')
    setIsEditing(false)
    setShowError(false)
  }

  function handleDelete(e) {
    e.stopPropagation()
    setShowDeleteConfirm(true)
  }

  function confirmDelete() {
    onDelete(note.id)
    setShowDeleteConfirm(false)
  }

  function handleCardClick() {
    if (!showDeleteConfirm && !isEditing) {
      setIsEditing(true)
    }
  }

  return (
    <div className="note-card-wrapper">
      <div className="note-card" onClick={handleCardClick}>
        <div className="note-card-header">
          <h3 className="note-title">{note.title}</h3>
          <div className="note-card-actions">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsEditing(true)
              }}
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
        
        <div className="note-card-content">
          <p className="note-description">
            {note.description || 'Sin contenido'}
          </p>
        </div>
        
        <div className="note-footer">
          <span className="note-date">
            {new Date(note.created_at).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short'
            })}
          </span>
        </div>
      </div>

      {/* Edit Modal - Full Screen Mobile */}
      {isEditing && createPortal(
        <div className="modal-backdrop note-edit-backdrop" onClick={handleCancel}>
          <div className="modal-content note-edit-modal" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSave} className="note-edit-form-full">
              <div className="note-edit-header">
                <button type="button" onClick={handleCancel} className="btn-icon-action btn-cancel-action" title="Cancelar">
                  <img src={xIcon} alt="Cancelar" width="24" height="24" />
                </button>
                <h3 className="modal-title-center">Editar Apunte</h3>
                <button type="submit" className="btn-icon-action btn-save-action" title="Guardar">
                  <img src={checkIcon} alt="Guardar" width="24" height="24" />
                </button>
              </div>
              
              <div className="note-edit-body">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    if (showError) setShowError(false)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') handleCancel()
                  }}
                  className={`note-input-full ${showError ? 'input-error shake' : ''}`}
                  autoFocus
                  placeholder="Título (Requerido)"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') handleCancel()
                  }}
                  className="note-textarea-full"
                  placeholder="Escribe aquí tu nota..."
                  style={{ fontFamily: "'Kalam', 'Architects Daughter', cursive, sans-serif" }}
                />
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Eliminar nota"
        message="¿Estás seguro de que quieres eliminar esta nota?"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDanger={true}
      />
    </div>
  )
}

export default NoteCard
