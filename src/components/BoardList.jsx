import { useState } from 'react'
import BoardCard from './BoardCard'
import ThemeToggle from './ThemeToggle'
import KaiModal from './KaiModal'
import './BoardList.css'

function BoardList({ boards, onSelectBoard, onCreateBoard, onUpdateBoard, onDeleteBoard }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  function handleCreateKai(name, description) {
    onCreateBoard(name, description)
    setIsModalOpen(false)
  }

  return (
    <div className="board-list-container">
      <div className="board-list-header">
        <h1>Kaiban</h1>
        <div className="board-list-actions">
          <ThemeToggle />
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            + Nueva Kai
          </button>
        </div>
      </div>

      <div className="board-list">
        {boards.length === 0 ? (
          <div className="empty-state">
            <p>No tienes Kais aún</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary"
            >
              + Crear tu primera Kai
            </button>
          </div>
        ) : (
          boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              onClick={() => onSelectBoard(board.id)}
              onUpdate={onUpdateBoard}
              onDelete={onDeleteBoard}
            />
          ))
        )}
      </div>

      <KaiModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateKai}
      />
    </div>
  )
}

export default BoardList
