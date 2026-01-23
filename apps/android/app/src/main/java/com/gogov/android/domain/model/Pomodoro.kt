package com.gogov.android.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class PomodoroSession(
    val id: String,
    val subject: String,
    val plannedMinutes: Int,
    val startedAt: String
)

@Serializable
data class PomodoroStartRequest(
    val subject: String,
    val plannedMinutes: Int
)

@Serializable
data class PomodoroFinishRequest(
    val status: String,
    val durationSeconds: Int,
    val pauseSeconds: Int,
    val pauseCount: Int,
    val failureReason: String? = null
)

@Serializable
data class PomodoroFinishResponse(
    val id: String,
    val status: String,
    val durationSeconds: Int,
    val pauseSeconds: Int
)

@Serializable
data class PomodoroSubject(
    val id: String,
    val name: String,
    val createdAt: String? = null
)

@Serializable
data class PomodoroSubjectsResponse(
    val subjects: List<PomodoroSubject>
)

@Serializable
data class PomodoroInsights(
    val totals: PomodoroTotals,
    val subjects: List<String>,
    val heatmap: PomodoroHeatmap,
    val timeBuckets: List<PomodoroTimeBucket>,
    val radar: List<PomodoroRadarItem>
)

@Serializable
data class PomodoroTotals(
    val sessions: Int,
    val completed: Int,
    val failed: Int,
    val focusMinutes: Int
)

@Serializable
data class PomodoroHeatmap(
    val days: List<PomodoroHeatmapDay>
)

@Serializable
data class PomodoroHeatmapDay(
    val date: String,
    val totalMinutes: Int,
    val totals: Map<String, Int> = emptyMap()
)

@Serializable
data class PomodoroTimeBucket(
    val key: String,
    val label: String,
    val range: String,
    val count: Int,
    val minutes: Int
)

@Serializable
data class PomodoroRadarItem(
    val subject: String,
    val minutes: Int
)

enum class PomodoroStatus {
    IDLE,
    RUNNING,
    PAUSED,
    COMPLETED,
    FAILED,
    ABANDONED
}

enum class PomodoroMode {
    COUNTDOWN,
    TIMER
}

data class PomodoroState(
    val status: PomodoroStatus = PomodoroStatus.IDLE,
    val mode: PomodoroMode = PomodoroMode.COUNTDOWN,
    val sessionId: String? = null,
    val subject: String = "",
    val plannedMinutes: Int = 25,
    val elapsedSeconds: Int = 0,
    val pauseElapsedSeconds: Int = 0,
    val pauseCount: Int = 0,
    val segments: List<Int> = emptyList()
)
