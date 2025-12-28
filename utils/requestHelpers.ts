// utils/requestHelpers.ts

/**
 * Wrapper para requisições com timeout e tratamento de erros
 */
export async function fetchWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 10000
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Request timeout'))
    }, timeoutMs)
  })

  return Promise.race([promise, timeoutPromise])
}

/**
 * Retry logic para requisições que falharam
 */
export async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      console.error(`Attempt ${i + 1} failed:`, error)
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }

  throw lastError!
}

/**
 * Verifica se há conexão com a internet
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine
}

/**
 * Handler genérico de erros do Supabase
 */
export function handleSupabaseError(error: any): string {
  if (!error) return 'Erro desconhecido'
  
  // Erros de rede
  if (error.message?.includes('Failed to fetch')) {
    return 'Erro de conexão. Verifique sua internet.'
  }
  
  if (error.message?.includes('timeout')) {
    return 'A requisição demorou muito. Tente novamente.'
  }
  
  // Erros de autenticação
  if (error.message?.includes('JWT') || error.message?.includes('token')) {
    return 'Sessão expirada. Faça login novamente.'
  }
  
  // Erros de permissão
  if (error.message?.includes('permission') || error.message?.includes('policy')) {
    return 'Você não tem permissão para esta ação.'
  }
  
  // Erro genérico
  return error.message || 'Ocorreu um erro. Tente novamente.'
}