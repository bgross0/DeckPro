import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Debounce function to limit function calls
export function debounce(func, wait) {
  let timeout
  let lastCallTime = 0
  
  const debounced = function(...args) {
    const now = Date.now()
    const timeSinceLastCall = now - lastCallTime
    
    clearTimeout(timeout)
    
    timeout = setTimeout(() => {
      lastCallTime = Date.now()
      func.apply(this, args)
    }, wait)
  }
  
  debounced.cancel = function() {
    clearTimeout(timeout)
  }
  
  return debounced
}

// Throttle function to limit function calls
export function throttle(func, limit) {
  let inThrottle
  let lastResult
  
  return function(...args) {
    if (!inThrottle) {
      lastResult = func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
    return lastResult
  }
}