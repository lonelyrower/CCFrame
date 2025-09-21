'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'

export type CommandDescriptor = {
  id: string
  title: string
  subtitle?: string
  shortcut?: string[]
  group?: string
  keywords?: string[]
  disabled?: boolean
  perform: () => void | Promise<void>
}

interface CommandPaletteContextValue {
  isOpen: boolean
  commands: CommandDescriptor[]
  open: () => void
  close: () => void
  toggle: () => void
  execute: (id: string) => void
  registerCommand: (command: CommandDescriptor) => () => void
  registerCommands: (commandList: CommandDescriptor[]) => () => void
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | undefined>(undefined)

interface CommandPaletteProviderProps {
  children: React.ReactNode
}

export function CommandPaletteProvider({ children }: CommandPaletteProviderProps) {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()

  const [isOpen, setIsOpen] = useState(false)
  const commandsRef = useRef<Map<string, CommandDescriptor>>(new Map())
  const [, forceRender] = useState(0)

  const sync = useCallback(() => {
    forceRender((x) => x + 1)
  }, [])

  const registerCommand = useCallback((command: CommandDescriptor) => {
    commandsRef.current.set(command.id, command)
    sync()
    return () => {
      commandsRef.current.delete(command.id)
      sync()
    }
  }, [sync])

  const registerCommands = useCallback((commandList: CommandDescriptor[]) => {
    const disposers = commandList.map((command) => registerCommand(command))
    return () => disposers.forEach((dispose) => dispose())
  }, [registerCommand])

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  const execute = useCallback((id: string) => {
    const command = commandsRef.current.get(id)
    if (!command || command.disabled) return
    try {
      const result = command.perform()
      if (result instanceof Promise) {
        result.finally(() => close())
      } else {
        close()
      }
    } catch (error) {
      console.error(`Command ${id} execution failed`, error)
      close()
    }
  }, [close])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const isModifier = event.metaKey || event.ctrlKey
      if (isModifier && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        toggle()
      }
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggle])

  useEffect(() => {
    const defaultCommands: CommandDescriptor[] = [
      {
        id: 'nav-home',
        title: '返回首页',
        shortcut: ['G', 'H'],
        group: '导航',
        perform: () => router.push('/'),
      },
      {
        id: 'nav-library',
        title: '打开后台图库',
        shortcut: ['G', 'L'],
        group: '导航',
        perform: () => router.push('/admin/library'),
      },
      {
        id: 'nav-upload',
        title: '前往上传中心',
        shortcut: ['U'],
        group: '导航',
        perform: () => router.push('/admin/upload'),
      },
      {
        id: 'toggle-theme',
        title: '切换浅色 / 深色模式',
        shortcut: ['Cmd', 'Shift', 'T'],
        group: '偏好',
        perform: () => {
          const next = resolvedTheme === 'dark' ? 'light' : 'dark'
          setTheme(next)
        },
      },
      {
        id: 'open-settings',
        title: '打开后台设置',
        shortcut: ['G', 'S'],
        group: '导航',
        perform: () => router.push('/admin/settings'),
      },
    ]

    const dispose = registerCommands(defaultCommands)
    return dispose
  }, [registerCommands, router, resolvedTheme, setTheme])

  const value = useMemo<CommandPaletteContextValue>(() => ({
    isOpen,
    commands: Array.from(commandsRef.current.values()),
    open,
    close,
    toggle,
    execute,
    registerCommand,
    registerCommands,
  }), [isOpen, open, close, toggle, execute, registerCommand, registerCommands])

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
    </CommandPaletteContext.Provider>
  )
}

export function useCommandPalette(): CommandPaletteContextValue {
  const context = useContext(CommandPaletteContext)
  if (!context) {
    throw new Error('useCommandPalette must be used within a CommandPaletteProvider')
  }
  return context
}
