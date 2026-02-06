package com.gogov.android.domain.model

import kotlinx.serialization.Serializable

@Serializable
enum class CustomTaskRecurrenceType {
    once,
    daily,
    weekly,
    interval
}

@Serializable
data class CustomTask(
    val id: String,
    val title: String,
    val notes: String? = null,
    val startDate: String,
    val recurrenceType: CustomTaskRecurrenceType = CustomTaskRecurrenceType.once,
    val intervalDays: Int? = null,
    val weekdays: List<Int> = emptyList(),
    val isActive: Boolean = true,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

@Serializable
data class CustomTaskOccurrence(
    val taskId: String,
    val title: String,
    val notes: String? = null,
    val occurrenceDate: String,
    val recurrenceType: CustomTaskRecurrenceType = CustomTaskRecurrenceType.once,
    val intervalDays: Int? = null,
    val weekdays: List<Int> = emptyList()
)

@Serializable
data class CustomTasksResponse(
    val date: String,
    val today: List<CustomTaskOccurrence> = emptyList(),
    val overdue: List<CustomTaskOccurrence> = emptyList(),
    val tasks: List<CustomTask> = emptyList(),
    val completed: List<CustomTaskOccurrence> = emptyList()
)

@Serializable
data class CustomTaskCreateRequest(
    val title: String,
    val notes: String? = null,
    val recurrenceType: CustomTaskRecurrenceType = CustomTaskRecurrenceType.once,
    val startDate: String? = null,
    val intervalDays: Int? = null,
    val weekdays: List<Int>? = null
)

@Serializable
data class CustomTaskOccurrenceRequest(
    val date: String
)

@Serializable
data class CustomTaskCreateResponse(
    val task: CustomTask
)

@Serializable
data class SimpleOkResponse(
    val ok: Boolean = false
)
