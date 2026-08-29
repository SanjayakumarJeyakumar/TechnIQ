import { supabase } from './supabaseClient'

/**
 * Fetches all notifications for the current authenticated user safely.
 */
export async function fetchNotifications(userId) {
  if (!userId) return []
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase notification fetch error:', error)
      throw error
    }
    return Array.isArray(data) ? data : []
  } catch (err) {
    console.error('fetchNotifications exception:', err)
    throw err
  }
}

/**
 * Fetches unread notification count for the navbar badge.
 */
export async function fetchUnreadNotificationCount(userId) {
  if (!userId) return 0
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      console.warn('Notification count fetch warning:', error)
      return 0
    }
    return typeof count === 'number' ? count : 0
  } catch (err) {
    console.warn('fetchUnreadNotificationCount exception:', err)
    return 0
  }
}

/**
 * Marks a single notification as read.
 */
export async function markNotificationRead(notificationId) {
  if (!notificationId) return
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    if (error) throw error
  } catch (err) {
    console.error('markNotificationRead failed:', err)
    throw err
  }
}

/**
 * Marks all notifications for a user as read.
 */
export async function markAllNotificationsRead(userId) {
  if (!userId) return
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) throw error
  } catch (err) {
    console.error('markAllNotificationsRead failed:', err)
    throw err
  }
}

/**
 * Subscribes to real-time notification changes safely with unique channel isolation.
 */
export function subscribeToNotifications(userId, onNotificationChange) {
  if (!userId || typeof onNotificationChange !== 'function') {
    return () => {}
  }

  const channelId = `user-notif-${userId}-${Math.random().toString(36).slice(2, 9)}`
  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        try {
          onNotificationChange(payload)
        } catch (e) {
          console.warn('Notification listener error:', e)
        }
      }
    )
    .subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR' || err) {
        console.warn('Notification channel warning (non-fatal):', err || status)
      }
    })

  return () => {
    try {
      supabase.removeChannel(channel)
    } catch (err) {
      console.warn('Channel cleanup warning:', err)
    }
  }
}
