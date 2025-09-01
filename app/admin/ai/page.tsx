'use client'

import { useState, useEffect } from 'react'
import { Wand2, Zap, Scissors, Image as ImageIcon, Play, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JobType, JobStatus } from '@/types'
import { AITask, PhotoWithDetails } from '@/types'
import toast from 'react-hot-toast'

interface AIJob {
  id: string
  type: JobType
  status: JobStatus
  progress: number
  payloadJson: any
  resultJson?: any
  errorMsg?: string
  createdAt: string
  updatedAt: string
}

const AI_TASKS = [
  {
    type: 'AI_ENHANCEMENT' as JobType,
    name: 'Auto Enhance',
    description: 'Automatically improve brightness, contrast, and color balance',
    icon: Wand2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20'
  },
  {
    type: 'AI_UPSCALE' as JobType,
    name: 'AI Upscale',
    description: 'Increase image resolution using AI super-resolution',
    icon: Zap,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20'
  },
  {
    type: 'AI_REMOVE_BACKGROUND' as JobType,
    name: 'Remove Background',
    description: 'Automatically remove or replace the background',
    icon: Scissors,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/20'
  },
]

export default function AIStudioPage() {
  const [selectedPhoto, setSelectedPhoto] = useState<string>('')
  const [jobs, setJobs] = useState<AIJob[]>([])
  const [recentPhotos, setRecentPhotos] = useState<PhotoWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchJobs()
    fetchRecentPhotos()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/ai/jobs')
      if (response.ok) {
        const data = await response.json()
        setJobs(data.jobs)
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    }
  }

  const fetchRecentPhotos = async () => {
    try {
      const response = await fetch('/api/photos?limit=20')
      if (response.ok) {
        const data = await response.json()
        setRecentPhotos(data.photos)
      }
    } catch (error) {
      console.error('Failed to fetch photos:', error)
    }
  }

  const startAITask = async (taskType: JobType, params: any = {}) => {
    if (!selectedPhoto) {
      toast.error('Please select a photo first')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/ai/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          photoId: selectedPhoto,
          type: taskType,
          params
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('AI task started successfully')
        fetchJobs() // Refresh jobs list
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to start AI task')
      }
    } catch (error) {
      console.error('AI task error:', error)
      toast.error('Failed to start AI task')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/ai/jobs/${jobId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Job deleted')
        setJobs(jobs.filter(job => job.id !== jobId))
      } else {
        toast.error('Failed to delete job')
      }
    } catch (error) {
      console.error('Delete job error:', error)
      toast.error('Failed to delete job')
    }
  }

  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case 'PENDING':
      case 'RUNNING':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const formatJobType = (type: JobType) => {
    return AI_TASKS.find(task => task.type === type)?.name || type
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          AI Studio
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Enhance your photos with AI-powered tools
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Photo Selection */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Select Photo</h2>
            <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {recentPhotos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo.id)}
                  className={`
                    relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border-2 transition-all
                    ${selectedPhoto === photo.id 
                      ? 'border-primary shadow-md scale-105' 
                      : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <img
                    src={`/api/image/${photo.id}/thumb?format=webp`}
                    alt="Photo"
                    className="w-full h-full object-cover"
                  />
                  {selectedPhoto === photo.id && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* AI Tasks */}
          <div>
            <h2 className="text-xl font-semibold mb-4">AI Tools</h2>
            <div className="space-y-3">
              {AI_TASKS.map((task) => {
                const Icon = task.icon
                return (
                  <div key={task.type} className={`p-4 rounded-lg ${task.bgColor}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <Icon className={`h-6 w-6 ${task.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {task.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {task.description}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => startAITask(task.type)}
                        disabled={!selectedPhoto || isLoading}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Job History */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Job History</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchJobs}
            >
              Refresh
            </Button>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            {jobs.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No AI jobs yet</p>
                <p className="text-sm">Start processing photos with AI tools</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {jobs.map((job) => (
                  <div key={job.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {formatJobType(job.type)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(job.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {job.status === JobStatus.RUNNING && (
                          <div className="text-sm text-gray-500">
                            {job.progress}%
                          </div>
                        )}
                        
                        {job.status !== JobStatus.RUNNING && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteJob(job.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {job.status === JobStatus.RUNNING && (
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {job.status === JobStatus.FAILED && job.errorMsg && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-600 dark:text-red-400">
                        {job.errorMsg}
                      </div>
                    )}
                    
                    {job.status === JobStatus.COMPLETED && job.resultJson && (
                      <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm text-green-600 dark:text-green-400">
                        Processing completed successfully
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}