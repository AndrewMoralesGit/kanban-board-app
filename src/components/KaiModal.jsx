import { useState, useEffect } from 'react'
import './KaiModal.css'

function KaiModal({ isOpen, onClose, onSave, initialName = '', initialDescription = '' }) {
  const [kaiName, setKaiName] = useState(initialName)
  const [kaiDescription, setKaiDescription] = useState(initialDescription)

  useEffect(() => {
    setKaiName(initialName)
    setKaiDescription(initialDescription)
  }, [initialName, initialDescription])

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
    if (kaiName.trim()) {
      onSave(kaiName.trim(), kaiDescription.trim())
      setKaiName('')
      setKaiDescription('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="kai-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="kai-modal-title">Nueva Kai</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={kaiName}
            onChange={(e) => setKaiName(e.target.value)}
            placeholder="Nombre de la Kai"
            className="kai-modal-input"
            autoFocus
          />
          <textarea
            value={kaiDescription}
            onChange={(e) => setKaiDescription(e.target.value)}
            placeholder="Descripción (opcional)"
            className="kai-modal-textarea"
            rows="3"
          />
          <div className="kai-modal-actions">
            <button type="submit" className="btn btn-primary">
              Crear
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

export default KaiModal
