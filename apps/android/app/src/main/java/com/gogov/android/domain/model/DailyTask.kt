package com.gogov.android.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class Subtask(
    val id: String,
    val title: String,
    val done: Boolean = false
)

@Serializable
data class TaskItem(
    val id: String,
    val title: String,
    val done: Boolean = false,
    val durationMinutes: Int? = null,
    val notes: String? = null,
    val subtasks: List<Subtask> = emptyList()
)

@Serializable
data class DailyTaskRecord(
    val id: String,
    val date: String,
    val summary: String? = null,
    val adjustNote: String? = null,
    val tasks: List<TaskItem>,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

@Serializable
data class DailyTaskResponse(
    val task: DailyTaskRecord? = null
)

@Serializable
data class DailyTaskGenerateRequest(
    val date: String,
    val adjustNote: String? = null,
    val tasks: List<TaskItem>? = null,
    val auto: Boolean = false
)

@Serializable
data class DailyTaskUpdateRequest(
    val tasks: List<TaskItem>
)

@Serializable
data class TaskBreakdownRequest(
    val task: String,
    val context: String
)

@Serializable
data class TaskBreakdownResponse(
    val subtasks: List<String>
)

@Serializable
data class DailyTaskHistoryResponse(
    val tasks: List<DailyTaskRecord>
)
