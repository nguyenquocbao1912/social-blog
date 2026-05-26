"use client"

import { useState, useCallback, useRef, useEffect } from "react"

let globalActionLock = false

export function useActionCooldown(delayMs: number = 2000) {
  const [isWaiting, setIsWaiting] = useState(false)
  const unmounted = useRef(false)

  useEffect(() => {
    unmounted.current = false
    return () => {
      unmounted.current = true
    }
  }, [])

  const withCooldown = useCallback(
    <Args extends any[], Return>(action: (...args: Args) => Return | Promise<Return>) => {
      return async (...args: Args) => {
        if (globalActionLock) {
          return
        }

        globalActionLock = true
        setIsWaiting(true)

        try {
          await action(...args)
        } finally {
          setTimeout(() => {
            globalActionLock = false
            if (!unmounted.current) {
              setIsWaiting(false)
            }
          }, delayMs)
        }
      }
    },
    [delayMs]
  )

  return { withCooldown, isWaiting }
}
