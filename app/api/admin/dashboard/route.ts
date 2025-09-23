import { NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/admin-auth'
import { getDashboardSnapshot } from '@/lib/admin/dashboard-service'
import type {
  AdminActivityItem,
  AdminActivityItemDto,
  AdminDashboardSnapshot,
  AdminDashboardSnapshotDto,
  AdminRecentUploadItem,
  AdminRecentUploadItemDto,
  AdminTaskGroup,
  AdminTaskGroupDto,
  AdminTaskItem,
  AdminTaskItemDto,
} from '@/types/admin'

export async function GET() {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const snapshot = await getDashboardSnapshot()

  return NextResponse.json(serializeSnapshot(snapshot))
}

function serializeSnapshot(snapshot: AdminDashboardSnapshot): AdminDashboardSnapshotDto {
  return {
    metrics: snapshot.metrics,
    taskCenter: {
      summary: snapshot.taskCenter.summary,
      groups: snapshot.taskCenter.groups.map(serializeTaskGroup),
    },
    activity: snapshot.activity.map(serializeActivityItem),
    recentUploads: snapshot.recentUploads.map(serializeRecentUpload),
  }
}

function serializeTaskGroup(group: AdminTaskGroup): AdminTaskGroupDto {
  return {
    ...group,
    tasks: group.tasks.map(serializeTask),
  }
}

function serializeTask(task: AdminTaskItem): AdminTaskItemDto {
  return {
    ...task,
    createdAt: task.createdAt.toISOString(),
  }
}

function serializeActivityItem(item: AdminActivityItem): AdminActivityItemDto {
  return {
    ...item,
    timestamp: item.timestamp.toISOString(),
  }
}

function serializeRecentUpload(item: AdminRecentUploadItem): AdminRecentUploadItemDto {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
  }
}
