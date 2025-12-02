'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Server action to update profile information
 */
export async function updateProfileAction(data: {
  displayName?: string
  firstName?: string
  middleInitial?: string
  lastName?: string
  phone?: string
  avatarUrl?: string
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: data.displayName,
        first_name: data.firstName,
        middle_initial: data.middleInitial,
        last_name: data.lastName,
        phone: data.phone,
        avatar_url: data.avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      console.error('[updateProfileAction] Error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/profile')
    revalidatePath('/profile/edit')
    revalidatePath('/settings')
    revalidatePath('/home')

    return { success: true }
  } catch (error: any) {
    console.error('[updateProfileAction] Unexpected error:', error)
    return { success: false, error: error.message || 'Unknown error' }
  }
}

/**
 * Server action to update player profile information
 */
export async function updatePlayerProfileAction(data: {
  bio?: string
  birthDate?: Date
  gender?: string
  skillLevel?: number
  playStyle?: string
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check if player record exists
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('id, skill_level, skill_level_updated_at')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!existingPlayer) {
      // Create new player record
      const { error: insertError } = await supabase
        .from('players')
        .insert({
          user_id: user.id,
          bio: data.bio,
          birth_date: data.birthDate,
          gender: data.gender,
          skill_level: data.skillLevel,
          play_style: data.playStyle,
        })

      if (insertError) {
        console.error('[updatePlayerProfileAction] Insert error:', insertError)
        return { success: false, error: insertError.message }
      }
    } else {
      // Skill level change restrictions
      if (data.skillLevel !== undefined && data.skillLevel !== existingPlayer.skill_level) {
        const oldLevel = existingPlayer.skill_level || 5
        const newLevel = data.skillLevel
        const levelDiff = Math.abs(newLevel - oldLevel)

        // Restriction 1: Can't change more than ±2 levels at once
        if (levelDiff > 2) {
          return {
            success: false,
            error: `Skill level can only be adjusted by ±2 levels at a time. Current: ${oldLevel}, Requested: ${newLevel}`
          }
        }

        // Restriction 2: 30-day cooldown between changes
        const lastChanged = existingPlayer.skill_level_updated_at
        if (lastChanged) {
          const daysSinceLastChange = Math.floor(
            (Date.now() - new Date(lastChanged).getTime()) / (1000 * 60 * 60 * 24)
          )
          const cooldownDays = 30

          if (daysSinceLastChange < cooldownDays) {
            const daysRemaining = cooldownDays - daysSinceLastChange
            return {
              success: false,
              error: `Skill level can only be changed once every ${cooldownDays} days. You can change it again in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.`
            }
          }
        }
      }

      // Update existing player record
      const updateData: any = {
        bio: data.bio,
        birth_date: data.birthDate,
        gender: data.gender,
        play_style: data.playStyle,
        updated_at: new Date().toISOString(),
      }

      // Only update skill_level and timestamp if it's actually changing
      if (data.skillLevel !== undefined && data.skillLevel !== existingPlayer.skill_level) {
        updateData.skill_level = data.skillLevel
        updateData.skill_level_updated_at = new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('players')
        .update(updateData)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('[updatePlayerProfileAction] Update error:', updateError)
        return { success: false, error: updateError.message }
      }
    }

    revalidatePath('/profile')
    revalidatePath('/profile/edit')
    revalidatePath('/settings')
    revalidatePath('/home')

    return { success: true }
  } catch (error: any) {
    console.error('[updatePlayerProfileAction] Unexpected error:', error)
    return { success: false, error: error.message || 'Unknown error' }
  }
}

/**
 * Server action to update notification preferences
 */
export async function updateNotificationPreferencesAction(data: {
  email_enabled: boolean
  push_enabled: boolean
  sms_enabled: boolean
  reservation_reminders: boolean
  queue_notifications: boolean
  payment_notifications: boolean
  rating_requests: boolean
  promotional_emails: boolean
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check if notification preferences exist
    const { data: existing } = await supabase
      .from('notification_preferences')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!existing) {
      // Create new notification preferences
      const { error: insertError } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: user.id,
          ...data,
        })

      if (insertError) {
        console.error('[updateNotificationPreferencesAction] Insert error:', insertError)
        return { success: false, error: insertError.message }
      }
    } else {
      // Update existing notification preferences
      const { error: updateError } = await supabase
        .from('notification_preferences')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('[updateNotificationPreferencesAction] Update error:', updateError)
        return { success: false, error: updateError.message }
      }
    }

    revalidatePath('/settings')

    return { success: true }
  } catch (error: any) {
    console.error('[updateNotificationPreferencesAction] Unexpected error:', error)
    return { success: false, error: error.message || 'Unknown error' }
  }
}

/**
 * Server action to update user preferences (theme, language, search radius)
 */
export async function updatePreferencesAction(data: {
  theme: string
  language: string
  searchRadius: number
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get existing metadata
    const { data: profile } = await supabase
      .from('profiles')
      .select('metadata')
      .eq('id', user.id)
      .single()

    const existingMetadata = (profile?.metadata as any) || {}

    // Update profile with new preferences
    const { error } = await supabase
      .from('profiles')
      .update({
        preferred_locale: data.language,
        metadata: {
          ...existingMetadata,
          theme: data.theme,
          search_radius: data.searchRadius,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      console.error('[updatePreferencesAction] Error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/settings')
    revalidatePath('/profile')
    revalidatePath('/home')

    return { success: true }
  } catch (error: any) {
    console.error('[updatePreferencesAction] Unexpected error:', error)
    return { success: false, error: error.message || 'Unknown error' }
  }
}
