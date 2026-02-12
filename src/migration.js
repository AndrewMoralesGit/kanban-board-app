import { supabase } from './supabaseClient'

export async function runMigration() {
  console.log('🔄 Ejecutando migración de base de datos...')
  
  try {
    // Check if status column exists
    const { data: testData, error: testError } = await supabase
      .from('tasks')
      .select('status')
      .limit(1)

    if (testError) {
      if (testError.message.includes('column') || testError.code === '42703') {
        console.error('⚠️  La columna "status" no existe en la tabla tasks.')
        console.error('No se puede continuar sin esta columna.')
        return false
      }
    } else {
      console.log('✅ La columna "status" existe')
    }

    // Check if status_history column exists
    const { data: historyTest, error: historyError } = await supabase
      .from('tasks')
      .select('status_history')
      .limit(1)

    if (historyError && (historyError.message.includes('column') || historyError.code === '42703')) {
      console.log('📝 La columna "status_history" no existe, intentando crearla...')
      
      // Try to add the column using RPC or direct SQL
      // Since we can't execute DDL directly, we'll handle this gracefully
      console.warn('⚠️  No se puede crear la columna automáticamente.')
      console.log('💡 La aplicación funcionará sin historial por ahora.')
      console.log('   Las nuevas tareas tendrán historial cuando se agregue la columna.')
      
      // Continue without history feature for now
    } else {
      console.log('✅ La columna "status_history" existe')
      
      // Initialize history for tasks that don't have it
      const { data: tasksWithoutHistory } = await supabase
        .from('tasks')
        .select('id, status, created_at, status_history')
        .or('status_history.is.null,status_history.eq.[]')

      if (tasksWithoutHistory && tasksWithoutHistory.length > 0) {
        console.log(`📝 Inicializando historial para ${tasksWithoutHistory.length} tareas...`)
        
        for (const task of tasksWithoutHistory) {
          const initialHistory = [{
            status: task.status || 'pendiente',
            timestamp: task.created_at || new Date().toISOString(),
            previous_status: null
          }]
          
          await supabase
            .from('tasks')
            .update({ status_history: initialHistory })
            .eq('id', task.id)
        }
        
        console.log('✅ Historial inicializado')
      }
    }

    // Update tasks without status
    const { data: tasksWithoutStatus } = await supabase
      .from('tasks')
      .select('id')
      .is('status', null)

    if (tasksWithoutStatus && tasksWithoutStatus.length > 0) {
      console.log(`📝 Actualizando ${tasksWithoutStatus.length} tareas sin estado...`)
      
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ status: 'pendiente' })
        .is('status', null)

      if (updateError) {
        console.error('Error al actualizar tareas:', updateError)
      } else {
        console.log('✅ Tareas actualizadas')
      }
    }

    console.log('✅ Migración completada')
    return true

  } catch (error) {
    console.error('❌ Error durante la migración:', error)
    return false
  }
}
