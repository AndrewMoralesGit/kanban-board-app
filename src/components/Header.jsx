import { useState } from 'react'
import ThemeToggle from './ThemeToggle'
import CategoryModal from './CategoryModal'
import './Header.css'

function Header({ onAddCategory }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  function handleSaveCategory(name) {
    onAddCategory(name)
    setIsModalOpen(false)
  }

  return (
    <header className="header">
      <h1 className="header-title">Kaiban</h1>
      <div className="header-actions">
        <ThemeToggle />
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
        >
          + Nueva Categoría
        </button>
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCategory}
      />
    </header>
  )
}

export default Header
