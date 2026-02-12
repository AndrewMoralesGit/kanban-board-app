import { useState, useEffect, useRef } from 'react'
import Column from './Column'
import './Board.css'

function Board({ categories, tasks, onAddTask, onUpdateTask, onDeleteTask, onUpdateCategory, onDeleteCategory, onUpdateTaskStatus, historyTaskId, setHistoryTaskId, newCategoryId, setNewCategoryId }) {
  const [focusedCategoryId, setFocusedCategoryId] = useState(null)
  const columnsContainerRef = useRef(null)
  const categoryRefs = useRef({})

  // Handle Escape key to exit focus mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && focusedCategoryId) {
        setFocusedCategoryId(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [focusedCategoryId])

  // Auto-scroll to new category
  useEffect(() => {
    if (newCategoryId && categoryRefs.current[newCategoryId]) {
      setTimeout(() => {
        categoryRefs.current[newCategoryId]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        })
        setNewCategoryId(null)
      }, 100)
    }
  }, [newCategoryId, setNewCategoryId])

  return (
    <div className="board">
      {/* Focus Mode Backdrop */}
      {focusedCategoryId && (
        <div 
          className="focus-backdrop" 
          onClick={() => setFocusedCategoryId(null)}
        />
      )}

      <div className="board-columns" ref={columnsContainerRef}>
        {categories.map((category) => (
          <div 
            key={category.id}
            ref={(el) => categoryRefs.current[category.id] = el}
          >
            <Column
              category={category}
              tasks={tasks.filter(task => task.category_id === category.id)}
              onAddTask={onAddTask}
              onUpdateTask={onUpdateTask}
              onDeleteTask={onDeleteTask}
              onUpdateCategory={onUpdateCategory}
              onDeleteCategory={onDeleteCategory}
              onUpdateTaskStatus={onUpdateTaskStatus}
              historyTaskId={historyTaskId}
              setHistoryTaskId={setHistoryTaskId}
              isFocused={focusedCategoryId === category.id}
              onFocus={() => setFocusedCategoryId(category.id)}
              onExitFocus={() => setFocusedCategoryId(null)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default Board
