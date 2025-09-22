"use client"

import { Dialog, Transition } from '@headlessui/react'
import { Fragment, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface CatalogFilterSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function CatalogFilterSheet({ open, onClose, title = '筛选', children }: CatalogFilterSheetProps) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[90]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-surface-outline/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex flex-col justify-end">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-250"
            enterFrom="translate-y-full"
            enterTo="translate-y-0"
            leave="ease-in duration-200"
            leaveFrom="translate-y-0"
            leaveTo="translate-y-full"
          >
            <Dialog.Panel className="px-3 pb-3 sm:px-6 sm:pb-6">
              <div className="mx-auto w-full max-w-xl overflow-hidden rounded-t-3xl border border-surface-outline/40 bg-surface-panel shadow-floating">
                <div className="flex items-center justify-between border-b border-surface-outline/40 px-5 py-3">
                  <Dialog.Title className="text-sm font-medium text-text-primary">
                    {title}
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full p-2 text-text-muted transition hover:bg-surface-outline/20 hover:text-text-primary"
                    aria-label="关闭筛选"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
                  {children}
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}
