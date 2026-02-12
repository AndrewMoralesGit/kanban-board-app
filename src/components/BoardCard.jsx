import { useState } from 'react'
import ConfirmModal from './ConfirmModal'
import './BoardCard.css'
import editIcon from '../assets/pencil.svg'
import deleteIcon from '../assets/trash.svg'

function BoardCard({ board, onClick, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [boardName, setBoardName] = useState(board.name)
  const [description, setDescription] = useState(board.description || '')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  function handleSave() {
    if (boardName.trim()) {
      onUpdate(board.id, { name: boardName.trim(), description: description.trim() })
      setIsEditing(false)
    }
  }

  function handleCancel() {
    setBoardName(board.name)
    setDescription(board.description || '')
    setIsEditing(false)
  }

  function handleDelete(e) {
    e.stopPropagation()
    setShowDeleteConfirm(true)
  }

  function confirmDelete() {
    onDelete(board.id)
    setShowDeleteConfirm(false)
  }

  function handleEdit(e) {
    e.stopPropagation()
    setIsEditing(true)
  }

  // Calculate stats (you'll need to pass these from parent or fetch them)
  const categoryCount = board.category_count || 0
  const taskCount = board.task_count || 0

  if (isEditing) {
    return (
      <div className="board-card editing">
        <input
          type="text"
          value={boardName}
          onChange={(e) => setBoardName(e.target.value)}
          className="board-edit-input"
          placeholder="Nombre de la pizarra"
          autoFocus
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="board-edit-textarea"
          placeholder="Descripción"
          rows="2"
        />
        <div className="board-edit-actions">
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
    <>
      <div className="board-card" onClick={onClick}>
        <div className="board-card-content">
          <div className="board-info">
            <h3 className="board-name">{board.name}</h3>
            {board.description && (
              <p className="board-description">{board.description}</p>
            )}
          </div>
          <div className="board-meta">
            <div className="board-stats">
              <span className="stat">{categoryCount} categorías</span>
              <span className="stat-separator">•</span>
              <span className="stat">{taskCount} tareas</span>
            </div>
            <div className="board-actions">
              <button
                onClick={handleEdit}
                className="btn-icon"
                title="Editar pizarra"
              >
                <img src={editIcon} alt="Editar" />
              </button>
              <button
                onClick={handleDelete}
                className="btn-icon"
                title="Eliminar pizarra"
              >
                <img src={deleteIcon} alt="Eliminar" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Board Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Eliminar pizarra"
        message={`¿Estás seguro de que quieres eliminar "${board.name}"? Todas las categorías y tareas se eliminarán también.`}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDanger={true}
      />
    </>
  )
}

export default BoardCard
