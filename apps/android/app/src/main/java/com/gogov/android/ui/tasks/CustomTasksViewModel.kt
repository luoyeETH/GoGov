package com.gogov.android.ui.tasks

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gogov.android.data.repository.CustomTaskRepository
import com.gogov.android.domain.model.CustomTask
import com.gogov.android.domain.model.CustomTaskCreateRequest
import com.gogov.android.domain.model.CustomTaskOccurrence
import com.gogov.android.domain.model.CustomTaskRecurrenceType
import com.gogov.android.util.DateUtils
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalDate

data class CustomTasksUiState(
    val date: String = DateUtils.getBeijingDateString(),
    val todayTasks: List<CustomTaskOccurrence> = emptyList(),
    val overdueTasks: List<CustomTaskOccurrence> = emptyList(),
    val completedTasks: List<CustomTaskOccurrence> = emptyList(),
    val tasks: List<CustomTask> = emptyList(),
    val hasLoaded: Boolean = false,
    val isLoading: Boolean = false,
    val isSubmitting: Boolean = false,
    val completingKeys: Set<String> = emptySet(),
    val uncompletingKeys: Set<String> = emptySet(),
    val deletingTaskId: String? = null,
    val title: String = "",
    val notes: String = "",
    val recurrenceType: CustomTaskRecurrenceType = CustomTaskRecurrenceType.once,
    val startDate: String = DateUtils.getBeijingDateString(),
    val intervalDays: String = "1",
    val weekdays: Set<Int> = setOf(1, 2, 3, 4, 5),
    val error: String? = null
)

class CustomTasksViewModel(
    private val repository: CustomTaskRepository
) : ViewModel() {

    private val _state = MutableStateFlow(CustomTasksUiState())
    val state: StateFlow<CustomTasksUiState> = _state.asStateFlow()

    fun loadTasks() {
        viewModelScope.launch {
            _state.update {
                it.copy(
                    isLoading = true,
                    error = null
                )
            }
            val today = DateUtils.getBeijingDateString()
            repository.getCustomTasks(today).fold(
                onSuccess = { response ->
                    _state.update {
                        it.copy(
                            date = response.date,
                            todayTasks = response.today,
                            overdueTasks = response.overdue,
                            completedTasks = response.completed,
                            tasks = response.tasks,
                            hasLoaded = true,
                            isLoading = false
                        )
                    }
                },
                onFailure = { error ->
                    _state.update { it.copy(hasLoaded = true, isLoading = false, error = error.message) }
                }
            )
        }
    }

    fun setTitle(value: String) {
        _state.update { it.copy(title = value) }
    }

    fun setNotes(value: String) {
        _state.update { it.copy(notes = value) }
    }

    fun setRecurrenceType(value: CustomTaskRecurrenceType) {
        _state.update {
            it.copy(
                recurrenceType = value,
                weekdays = if (value == CustomTaskRecurrenceType.weekly && it.weekdays.isEmpty()) {
                    setOf(1, 2, 3, 4, 5)
                } else {
                    it.weekdays
                },
                intervalDays = if (value == CustomTaskRecurrenceType.interval && it.intervalDays.isBlank()) {
                    "1"
                } else {
                    it.intervalDays
                }
            )
        }
    }

    fun setStartDate(value: String) {
        _state.update { it.copy(startDate = value) }
    }

    fun setIntervalDays(value: String) {
        _state.update { it.copy(intervalDays = value) }
    }

    fun toggleWeekday(value: Int) {
        if (value !in 0..6) return
        _state.update {
            val next = it.weekdays.toMutableSet()
            if (next.contains(value)) {
                next.remove(value)
            } else {
                next.add(value)
            }
            it.copy(weekdays = next)
        }
    }

    fun createTask() {
        val current = _state.value
        val title = current.title.trim()
        if (title.isBlank()) {
            _state.update { it.copy(error = "请输入任务名称。") }
            return
        }
        if (current.recurrenceType == CustomTaskRecurrenceType.weekly && current.weekdays.isEmpty()) {
            _state.update { it.copy(error = "请选择每周重复的日期。") }
            return
        }
        val intervalValue = current.intervalDays.trim().toIntOrNull()
        if (current.recurrenceType == CustomTaskRecurrenceType.interval &&
            (intervalValue == null || intervalValue < 1)
        ) {
            _state.update { it.copy(error = "间隔天数至少为 1 天。") }
            return
        }
        val startDate = current.startDate.trim()
        val parsedDate = runCatching { LocalDate.parse(startDate) }.getOrNull()
        if (parsedDate == null) {
            _state.update { it.copy(error = "日期格式应为 YYYY-MM-DD。") }
            return
        }

        viewModelScope.launch {
            _state.update { it.copy(isSubmitting = true, error = null) }
            val request = CustomTaskCreateRequest(
                title = title,
                notes = current.notes.trim().takeIf { it.isNotBlank() },
                recurrenceType = current.recurrenceType,
                startDate = parsedDate.toString(),
                intervalDays = if (current.recurrenceType == CustomTaskRecurrenceType.interval) {
                    intervalValue
                } else {
                    null
                },
                weekdays = if (current.recurrenceType == CustomTaskRecurrenceType.weekly) {
                    current.weekdays.toList().sorted()
                } else {
                    null
                }
            )
            repository.createCustomTask(request).fold(
                onSuccess = {
                    _state.update {
                        it.copy(
                            isSubmitting = false,
                            title = "",
                            notes = "",
                            error = null
                        )
                    }
                    loadTasks()
                },
                onFailure = { error ->
                    _state.update { it.copy(isSubmitting = false, error = error.message) }
                }
            )
        }
    }

    fun completeTask(item: CustomTaskOccurrence) {
        val key = keyOf(item)
        if (_state.value.completingKeys.contains(key)) return

        viewModelScope.launch {
            _state.update { it.copy(completingKeys = it.completingKeys + key, error = null) }
            repository.completeTask(item.taskId, item.occurrenceDate).fold(
                onSuccess = { loadTasks() },
                onFailure = { error -> _state.update { it.copy(error = error.message) } }
            )
            _state.update { it.copy(completingKeys = it.completingKeys - key) }
        }
    }

    fun uncompleteTask(item: CustomTaskOccurrence) {
        val key = keyOf(item)
        if (_state.value.uncompletingKeys.contains(key)) return

        viewModelScope.launch {
            _state.update { it.copy(uncompletingKeys = it.uncompletingKeys + key, error = null) }
            repository.uncompleteTask(item.taskId, item.occurrenceDate).fold(
                onSuccess = { loadTasks() },
                onFailure = { error -> _state.update { it.copy(error = error.message) } }
            )
            _state.update { it.copy(uncompletingKeys = it.uncompletingKeys - key) }
        }
    }

    fun deleteTask(taskId: String) {
        if (_state.value.deletingTaskId == taskId) return

        viewModelScope.launch {
            _state.update { it.copy(deletingTaskId = taskId, error = null) }
            repository.deleteTask(taskId).fold(
                onSuccess = { loadTasks() },
                onFailure = { error -> _state.update { it.copy(error = error.message) } }
            )
            _state.update { it.copy(deletingTaskId = null) }
        }
    }

    fun clearError() {
        _state.update { it.copy(error = null) }
    }

    private fun keyOf(item: CustomTaskOccurrence): String {
        return "${item.taskId}-${item.occurrenceDate}"
    }
}
