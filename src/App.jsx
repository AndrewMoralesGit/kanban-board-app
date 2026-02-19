import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { ThemeProvider } from './context/ThemeContext'
import BoardList from './components/BoardList'
import Board from './components/Board'
import Column from './components/Column'
import CategoryModal from './components/CategoryModal'
import arrowLeftIcon from './assets/arrow-left.svg'
import './App.css'

function AppContent() {
  // Routing state
  const [currentView, setCurrentView] = useState('list') // 'list' | 'board'
  const [selectedBoardId, setSelectedBoardId] = useState(null)
  
  // Data state
  const [boards, setBoards] = useState([])
  const [categories, setCategories] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [historyTaskId, setHistoryTaskId] = useState(null)
  const [newCategoryId, setNewCategoryId] = useState(null)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)

  // Header visibility state
  const [headerVisible, setHeaderVisible] = useState(true)

  // Load boards on mount
  useEffect(() => {
    loadBoards()
  }, [])

  useEffect(() => {
    loadBoards()
  }, [])

  // Toggle header visibility
  const toggleHeader = () => {
    setHeaderVisible(!headerVisible)
  }

  // Load categories and tasks when board is selected
  useEffect(() => {
    if (selectedBoardId) {
      loadCategoriesAndTasks(selectedBoardId)
      checkAndGenerateRecurringTasks(selectedBoardId)
    }
  }, [selectedBoardId])

  // ============================================
  // BOARD FUNCTIONS
  // ============================================

  async function loadBoards() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('boards')
        .select(`
          *,
          categories:categories(count),
          tasks:tasks(count)
        `)
        .order('created_at')

      if (error) throw error

      // Transform data to include counts
      const boardsWithCounts = (data || []).map(board => ({
        ...board,
        category_count: board.categories?.[0]?.count || 0,
        task_count: board.tasks?.[0]?.count || 0
      }))

      setBoards(boardsWithCounts)
    } catch (error) {
      console.error('Error loading boards:', error)
    } finally {
      setLoading(false)
    }
  }

  async function createBoard(name, description) {
    const { data, error } = await supabase
      .from('boards')
      .insert([{ name, description }])
      .select()

    if (!error && data) {
      setBoards([...boards, { ...data[0], category_count: 0, task_count: 0 }])
    } else if (error) {
      console.error('Error creating board:', error)
    }
  }

  async function updateBoard(boardId, updates) {
    const { error } = await supabase
      .from('boards')
      .update(updates)
      .eq('id', boardId)

    if (!error) {
      setBoards(boards.map(b => b.id === boardId ? { ...b, ...updates } : b))
    }
  }

  async function deleteBoard(boardId) {
    // Prevent deleting the last board
    if (boards.length <= 1) {
      alert('No puedes eliminar la última pizarra')
      return
    }

    const { error } = await supabase
      .from('boards')
      .delete()
      .eq('id', boardId)

    if (!error) {
      setBoards(boards.filter(b => b.id !== boardId))
      if (selectedBoardId === boardId) {
        setCurrentView('list')
        setSelectedBoardId(null)
      }
    }
  }

  function selectBoard(boardId) {
    setSelectedBoardId(boardId)
    setCurrentView('board')
  }

  function backToBoards() {
    setCurrentView('list')
    setSelectedBoardId(null)
    setCategories([])
    setTasks([])
    loadBoards() // Refresh counts
  }

  // ============================================
  // CATEGORY & TASK FUNCTIONS
  // ============================================

  async function loadCategoriesAndTasks(boardId) {
    setLoading(true)
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('board_id', boardId)
        .order('position')

      if (categoriesError) throw categoriesError

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('board_id', boardId)
        .order('position')

      if (tasksError) throw tasksError

      setCategories(categoriesData || [])
      setTasks(tasksData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }



  async function addTask(categoryId, title, description = '', dueDate = null, recurringConfig = null, type = 'task') {
    if (!selectedBoardId) return

    const now = new Date().toISOString()
    
    // If it's a recurring task (habit), create it in recurring_tasks table first
    if (recurringConfig) {
      const { data: recurringData, error: recurringError } = await supabase
        .from('recurring_tasks')
        .insert([{
          title,
          description,
          board_id: selectedBoardId,
          category_id: categoryId,
          frequency: 'daily',
          interval: 1,
          duration_days: recurringConfig.duration,
          target_count: recurringConfig.targetCount || 1, // Store target count
          start_date: new Date().toISOString().split('T')[0],
          last_generated_date: new Date().toISOString().split('T')[0], // Mark today as generated
          status: 'active'
        }])
        .select()
        
      if (recurringError) {
        console.error('Error al crear hábito:', recurringError)
        return
      }
      
      // Create the first instance immediately linked to the recurring task
      // Only set due_date if the user provided one, otherwise null
      const firstInstanceDueDate = dueDate ? new Date(dueDate).toISOString() : null

      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          title,
          description,
          due_date: firstInstanceDueDate, 
          category_id: categoryId,
          board_id: selectedBoardId,
          recurring_task_id: recurringData[0].id,
          target_count: recurringConfig.targetCount || 1, // Set target count for instance
          current_count: 0, // Initialize progress
          status: 'pendiente',
          type: 'task', // Recurring tasks are always tasks for now
          position: tasks.filter(t => t.category_id === categoryId).length,
          status_history: [{
            status: 'pendiente',
            timestamp: now,
            previous_status: null
          }]
        }])
        .select()

      if (!error && data) {
        setTasks([...tasks, data[0]])
      }
    } else {
      // Normal task/note creation
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          title,
          description,
          due_date: dueDate,
          category_id: categoryId,
          board_id: selectedBoardId,
          status: 'pendiente',
          type: type, // Use provided type
          position: tasks.filter(t => t.category_id === categoryId).length,
          status_history: [{
            status: 'pendiente',
            timestamp: now,
            previous_status: null
          }]
        }])
        .select()

      if (!error && data) {
        setTasks([...tasks, data[0]])
      } else if (error) {
        console.error('Error al agregar tarea:', error)
      }
    }
  }

  // Check and generate daily tasks from habits
  async function checkAndGenerateRecurringTasks(boardId) {
    const today = new Date().toISOString().split('T')[0]
    
    // 1. Get active recurring tasks
    const { data: recurringTasks, error } = await supabase
      .from('recurring_tasks')
      .select('*')
      .eq('board_id', boardId)
      .eq('status', 'active')
      
    if (error || !recurringTasks) return
    
    const tasksToCreate = []
    const recurringUpdates = []
    
    for (const habit of recurringTasks) {
      // Check if we need to generate for today
      // Simple logic: if last_generated_date < today
      if (!habit.last_generated_date || habit.last_generated_date < today) {
        const now = new Date().toISOString()
        
        // Calculate due date (end of today) ONLY if original habit implies a deadline
        // For now, based on user feedback, we will NOT force a deadline on generated tasks
        // unless we have a specific field for it in the recurring_tasks table (which we don't yet).
        // So generated tasks will have due_date = null.
        
        tasksToCreate.push({
          title: habit.title,
          description: habit.description,
          due_date: null, // User requested no forced due date
          category_id: habit.category_id,
          board_id: boardId,
          recurring_task_id: habit.id,
          target_count: habit.target_count || 1, // Copy target count from habit config
          current_count: 0,
          status: 'pendiente',
          position: 0, // Put at top
          status_history: [{
            status: 'pendiente',
            timestamp: now,
            previous_status: null
          }]
        })
        
        // Update last_generated_date
        recurringUpdates.push({
          id: habit.id,
          last_generated_date: today
        })
        
        // Check if duration expired (logic to complete habit could go here)
      }
    }
    
    if (tasksToCreate.length > 0) {
      // Insert new tasks
      const { data: createdTasks, error: createError } = await supabase
        .from('tasks')
        .insert(tasksToCreate)
        .select()
        
      if (!createError && createdTasks) {
        setTasks(prev => [...prev, ...createdTasks])
        
        // Update recurring tasks last_generated_date
        for (const update of recurringUpdates) {
          await supabase
            .from('recurring_tasks')
            .update({ last_generated_date: update.last_generated_date })
            .eq('id', update.id)
        }
      }
    }
  }

  async function updateTask(taskId, updates) {
    // Get current task to compare changes
    const currentTask = tasks.find(t => t.id === taskId)
    if (!currentTask) return

    const newHistoryEntries = []
    const timestamp = new Date().toISOString()

    // Track title changes
    if (updates.title !== undefined && updates.title !== currentTask.title) {
      newHistoryEntries.push({
        timestamp,
        change_type: 'title_edit',
        old_value: currentTask.title,
        new_value: updates.title
      })
    }

    // Track description changes
    if (updates.description !== undefined && updates.description !== currentTask.description) {
      newHistoryEntries.push({
        timestamp,
        change_type: 'description_edit',
        old_value: currentTask.description || '',
        new_value: updates.description || ''
      })
    }

    // Track due date changes
    if (updates.due_date !== undefined && updates.due_date !== currentTask.due_date) {
      newHistoryEntries.push({
        timestamp,
        change_type: 'due_date_edit',
        old_value: currentTask.due_date || null,
        new_value: updates.due_date || null
      })
    }

    // Prepare update payload
    const updatePayload = {
      ...updates,
      updated_at: timestamp
    }

    // Add new history entries if any
    if (newHistoryEntries.length > 0) {
      const updatedHistory = [...(currentTask.status_history || []), ...newHistoryEntries]
      updatePayload.status_history = updatedHistory
    }

    const { error } = await supabase
      .from('tasks')
      .update(updatePayload)
      .eq('id', taskId)

    if (!error) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, ...updatePayload } : t))
    }
  }

  async function deleteTask(taskId) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (!error) {
      setTasks(tasks.filter(t => t.id !== taskId))
    }
  }

  async function addCategory(name) {
    if (!selectedBoardId) return

    const { data, error } = await supabase
      .from('categories')
      .insert([{ name, board_id: selectedBoardId, position: categories.length }])
      .select()

    if (!error && data) {
      setCategories([...categories, data[0]])
      setNewCategoryId(data[0].id)
    }
  }

  async function updateCategory(categoryId, name) {
    const { error } = await supabase
      .from('categories')
      .update({ name })
      .eq('id', categoryId)

    if (!error) {
      setCategories(categories.map(c => c.id === categoryId ? { ...c, name } : c))
    }
  }

  async function deleteCategory(categoryId) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)

    if (!error) {
      setCategories(categories.filter(c => c.id !== categoryId))
      // Tasks will be deleted automatically by CASCADE
      setTasks(tasks.filter(t => t.category_id !== categoryId))
    }
  }

  async function updateTaskStatus(taskId, newStatus) {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    // Logic for counters: If moving to completed but target not reached
    if (newStatus === 'completado' && task.target_count > 1) {
      const current = task.current_count || 0
      const target = task.target_count
      
      // If still needs repetitions (current < target)
      // Note: If current is 7 and target is 8, incrementing makes it 8, so it SHOULD be allowed to complete.
      // But here we are intercepting the drag. 
      // Option A: If dragged to completed, we count it as ONE repetition.
      
      if (current < target) {
        // Increment count
        const newCount = current + 1
        
        // If THIS increment finishes the task
        if (newCount >= target) {
           // Allow move to completed and update count
           const now = new Date().toISOString()
           const updatedHistory = [...(task.status_history || []), {
              status: 'completado',
              timestamp: now,
              previous_status: task.status
           }]
           
           const updates = {
             status: 'completado',
             current_count: newCount,
             status_history: updatedHistory,
             updated_at: now
           }

           const { error } = await supabase.from('tasks').update(updates).eq('id', taskId)
           if (!error) {
             setTasks(tasks.map(t => t.id === taskId ? { ...t, ...updates } : t))
             // Optional: Play success sound here
           }
           return
        } else {
          // Bounce back! Do NOT move to completed. 
          // User request: always return to 'pendiente' so it's visible as "to do" again
          let bounceStatus = 'pendiente'
          
          const now = new Date().toISOString()
          const updatedHistory = [...(task.status_history || []), {
              status: bounceStatus,
              timestamp: now,
              previous_status: task.status
           }]

           const updates = {
             status: bounceStatus,
             current_count: newCount,
             status_history: updatedHistory,
             updated_at: now
           }
           
           const { error } = await supabase.from('tasks').update(updates).eq('id', taskId)
           if (!error) {
             setTasks(tasks.map(t => t.id === taskId ? { ...t, ...updates } : t))
           }
           return // Stop normal execution
        }
      }
    }

    // Normal behavior for other tasks or fully completed counters
    const now = new Date().toISOString()
    const newHistoryEntry = {
      status: newStatus,
      timestamp: now,
      previous_status: task.status
    }

    // Get current history and append new entry
    const currentHistory = task.status_history || []
    const updatedHistory = [...currentHistory, newHistoryEntry]

    const { error } = await supabase
      .from('tasks')
      .update({ 
        status: newStatus, 
        updated_at: now,
        status_history: updatedHistory
      })
      .eq('id', taskId)

    if (!error) {
      setTasks(tasks.map(t => 
        t.id === taskId 
          ? { ...t, status: newStatus, status_history: updatedHistory } 
          : t
      ))
    }
  }

  async function incrementTaskCount(taskId, increment) {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const newCount = (task.current_count || 0) + increment
    // Prevent negative count
    if (newCount < 0) return

    const target = task.target_count || 1
    
    // Check for auto-completion
    let newStatus = task.status
    let statusHistory = task.status_history || []
    
    if (newCount >= target && task.status !== 'completado') {
      newStatus = 'completado'
      const now = new Date().toISOString()
      statusHistory = [...statusHistory, {
        status: 'completado',
        timestamp: now,
        previous_status: task.status
      }]
    } else if (newCount < target && task.status === 'completado') {
      // If count drops below target, revert to in_progress (or pending if 0)
      newStatus = newCount === 0 ? 'pendiente' : 'en_progreso'
      const now = new Date().toISOString()
      statusHistory = [...statusHistory, {
        status: newStatus,
        timestamp: now,
        previous_status: task.status
      }]
    } else if (newCount > 0 && task.status === 'pendiente') {
       // If started progress, move to in_progress
       newStatus = 'en_progreso'
       const now = new Date().toISOString()
       statusHistory = [...statusHistory, {
        status: 'en_progreso',
        timestamp: now,
        previous_status: task.status
      }]
    }

    const updates = {
      current_count: newCount,
      status: newStatus,
      status_history: statusHistory
    }

    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)

    if (!error) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, ...updates } : t))
    }
  }



  const handleDragEnd = async (event) => {
    const { active, over } = event
    
    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    const activeTask = tasks.find(t => t.id === activeId)
    const overTask = tasks.find(t => t.id === overId)

    if (!activeTask || !overTask) return

    // STRICT REORDERING: Prevent moving tasks between columns (different status)
    if (activeTask.status !== overTask.status) return

    // Calculate new position
    // We need the items in the same column to calculate position
    const columnTasks = tasks
      .filter(t => t.category_id === activeTask.category_id && t.status === activeTask.status)
      .sort((a, b) => (a.position || 0) - (b.position || 0))

    const oldIndex = columnTasks.findIndex(t => t.id === activeId)
    const newIndex = columnTasks.findIndex(t => t.id === overId)

    let newPosition = 0
    
    if (newIndex === 0) {
      // Moved to top
      newPosition = (columnTasks[0].position || 0) - 1000
    } else if (newIndex === columnTasks.length - 1) {
      // Moved to bottom
      newPosition = (columnTasks[columnTasks.length - 1].position || 0) + 1000
    } else {
      // Moved roughly to middle
      // We need to verify direction to pick neighbors correctly from the SPLICED array
      // But creating a new array via arrayMove is easier to reason about the final state
      const reorderedColumnTasks = arrayMove(columnTasks, oldIndex, newIndex)
      
      const prevTask = reorderedColumnTasks[newIndex - 1]
      const nextTask = reorderedColumnTasks[newIndex + 1]
      
      if (prevTask && nextTask) {
        newPosition = (prevTask.position + nextTask.position) / 2
      } else if (prevTask) {
        newPosition = prevTask.position + 1000
      } else if (nextTask) {
        newPosition = nextTask.position - 1000
      }
    }

    // Optimistic Update
    setTasks(prevTasks => {
      const newTasks = prevTasks.map(t => 
        t.id === activeId 
          ? { ...t, position: newPosition } 
          : t
      )
      return newTasks
    })

    // Supabase Update
    try {
      await supabase
        .from('tasks')
        .update({ position: newPosition })
        .eq('id', activeId)
    } catch (error) {
      console.error('Error updating position:', error)
    }
  }

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Cargando...</div>
      </div>
    )
  }

  // Render board list view
  if (currentView === 'list') {
    return (
      <div className="app">
        <BoardList
          boards={boards}
          onSelectBoard={selectBoard}
          onCreateBoard={createBoard}
          onUpdateBoard={updateBoard}
          onDeleteBoard={deleteBoard}
        />
      </div>
    )
  }

  // Render board view
  const currentBoard = boards.find(b => b.id === selectedBoardId)

  return (
    <div className="app">
      <div className={`board-header ${headerVisible ? 'visible' : 'hidden'}`}>
        <button onClick={backToBoards} className="back-button" title="Volver a Pizarras">
          <img src={arrowLeftIcon} alt="Volver" />
        </button>
        <div className="board-title-section">
          <h1>{currentBoard?.name || 'Pizarra'}</h1>
          {currentBoard?.description && (
            <p className="board-description-header">{currentBoard.description}</p>
          )}
        </div>
        
        <button 
          onClick={() => setIsCategoryModalOpen(true)} 
          className="btn btn-primary"
        >
          + Nueva Categoría
        </button>
        
        {/* Toggle button - pull tab at bottom of header */}
        <button 
          onClick={toggleHeader} 
          className="header-toggle-btn"
          title={headerVisible ? 'Ocultar header' : 'Mostrar header'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d={headerVisible ? "M18 15L12 9L6 15" : "M6 9L12 15L18 9"} 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <Board
        categories={categories}
          tasks={tasks}
          onAddTask={addTask}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
          onUpdateCategory={updateCategory}
          onDeleteCategory={deleteCategory}
          onUpdateTaskStatus={updateTaskStatus}
          onIncrementTaskCount={incrementTaskCount}
          historyTaskId={historyTaskId}
          setHistoryTaskId={setHistoryTaskId}
          newCategoryId={newCategoryId}
          setNewCategoryId={setNewCategoryId}
        />


      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={(name) => {
          addCategory(name)
          setIsCategoryModalOpen(false)
        }}
      />
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App

