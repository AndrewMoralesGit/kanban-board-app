import { useState, useEffect } from 'react'
import './CategoryModal.css'

function CategoryModal({ isOpen, onClose, onSave, initialName = '' }) {
  const [categoryName, setCategoryName] = useState(initialName)

  useEffect(() => {
    setCategoryName(initialName)
  }, [initialName])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  function handleSubmit(e) {
    e.preventDefault()
    if (categoryName.trim()) {
      onSave(categoryName.trim())
      setCategoryName('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="category-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="category-modal-title">Nueva Categoría</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Nombre de la categoría"
            className="category-modal-input"
            autoFocus
          />
          <div className="category-modal-actions">
            <button type="submit" className="btn btn-primary">
              Guardar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CategoryModal
