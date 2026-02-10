package com.gogov.android.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.runBlocking

private val Context.pomodoroDataStore: DataStore<Preferences> by preferencesDataStore(name = "pomodoro_prefs")

class PomodoroStorage(private val context: Context) {

    companion object {
        private val SESSION_ID = stringPreferencesKey("session_id")
        private val SUBJECT = stringPreferencesKey("subject")
        private val PLANNED_MINUTES = intPreferencesKey("planned_minutes")
        private val START_TIME = longPreferencesKey("start_time")
        private val PAUSED_TOTAL_MS = longPreferencesKey("paused_total_ms")
        private val PAUSE_START = longPreferencesKey("pause_start")
        private val PAUSE_COUNT = intPreferencesKey("pause_count")
        private val SEGMENTS = stringPreferencesKey("segments")
        private val STATUS = stringPreferencesKey("status")
        private val MODE = stringPreferencesKey("mode")
    }

    data class PomodoroSavedState(
        val sessionId: String?,
        val subject: String,
        val plannedMinutes: Int,
        val startTime: Long,
        val pausedTotalMs: Long,
        val pauseStart: Long?,
        val pauseCount: Int,
        val segments: List<Int>,
        val status: String,
        val mode: String
    )

    val savedState: Flow<PomodoroSavedState?> = context.pomodoroDataStore.data.map { prefs ->
        val sessionId = prefs[SESSION_ID] ?: return@map null
        val segments = prefs[SEGMENTS]
            ?.split(",")
            ?.mapNotNull { it.trim().toIntOrNull() }
            ?: emptyList()
        PomodoroSavedState(
            sessionId = sessionId,
            subject = prefs[SUBJECT] ?: "",
            plannedMinutes = prefs[PLANNED_MINUTES] ?: 25,
            startTime = prefs[START_TIME] ?: 0L,
            pausedTotalMs = prefs[PAUSED_TOTAL_MS] ?: 0L,
            pauseStart = prefs[PAUSE_START]?.takeIf { it > 0 },
            pauseCount = prefs[PAUSE_COUNT] ?: 0,
            segments = segments,
            status = prefs[STATUS] ?: "idle",
            mode = prefs[MODE] ?: "countdown"
        )
    }

    fun getSavedStateSync(): PomodoroSavedState? {
        return runBlocking {
            savedState.first()
        }
    }

    suspend fun saveState(state: PomodoroSavedState) {
        context.pomodoroDataStore.edit { prefs ->
            prefs[SESSION_ID] = state.sessionId ?: ""
            prefs[SUBJECT] = state.subject
            prefs[PLANNED_MINUTES] = state.plannedMinutes
            prefs[START_TIME] = state.startTime
            prefs[PAUSED_TOTAL_MS] = state.pausedTotalMs
            prefs[PAUSE_START] = state.pauseStart ?: 0L
            prefs[PAUSE_COUNT] = state.pauseCount
            prefs[SEGMENTS] = state.segments.joinToString(",")
            prefs[STATUS] = state.status
            prefs[MODE] = state.mode
        }
    }

    suspend fun clearState() {
        context.pomodoroDataStore.edit { prefs ->
            prefs.clear()
        }
    }
}
