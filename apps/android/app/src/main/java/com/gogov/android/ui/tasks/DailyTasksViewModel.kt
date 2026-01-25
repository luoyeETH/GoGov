package com.gogov.android.ui.tasks

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gogov.android.data.repository.AuthRepository
import com.gogov.android.data.repository.DailyTaskRepository
import com.gogov.android.domain.model.DailyTaskRecord
import com.gogov.android.domain.model.Subtask
import com.gogov.android.domain.model.TaskItem
import com.gogov.android.domain.model.User
import com.gogov.android.domain.model.StudyPlanProfile
import com.gogov.android.util.DateUtils
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.util.UUID

data class DailyTasksUiState(
    val taskRecord: DailyTaskRecord? = null,
    val userName: String? = null,
    val targetExam: String? = null,
    val targetExamDate: String? = null,
    val greetingText: String? = null,
    val countdownText: String? = null,
    val hasTargetExam: Boolean = false,
    val profileLoaded: Boolean = false,
    val isLoading: Boolean = false,
    val isGenerating: Boolean = false,
    val isSaving: Boolean = false,
    val breakdownTaskId: String? = null,
    val adjustNote: String = "",
    val error: String? = null,
    val today: String = DateUtils.getBeijingDateString()
)

class DailyTasksViewModel(
    private val repository: DailyTaskRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _state = MutableStateFlow(DailyTasksUiState())
    val state: StateFlow<DailyTasksUiState> = _state.asStateFlow()

    fun loadTasks() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            val today = DateUtils.getBeijingDateString()
            val user = authRepository.getCurrentUser().getOrNull()
            val profileResult = authRepository.getStudyPlanProfile()
            val profile = profileResult.getOrNull()
            val profileLoaded = profileResult.isSuccess

            val targetExamDate = profile?.targetExamDate?.take(10)?.trim()
            val targetExam = profile?.targetExam?.trim()
            val hasTargetExam = profileLoaded && !targetExamDate.isNullOrBlank()

            val greeting = buildGreeting(user, profile, today)
            _state.update {
                it.copy(
                    userName = greeting?.userName,
                    targetExam = greeting?.targetExam ?: targetExam,
                    targetExamDate = targetExamDate,
                    greetingText = greeting?.greetingText,
                    countdownText = greeting?.countdownText,
                    hasTargetExam = hasTargetExam,
                    profileLoaded = profileLoaded,
                    today = today
                )
            }

            if (profileLoaded && !hasTargetExam) {
                _state.update { it.copy(taskRecord = null, isLoading = false) }
                return@launch
            }

            repository.getDailyTask(today).fold(
                onSuccess = { record ->
                    _state.update { it.copy(taskRecord = record, isLoading = false, today = today) }

                    // Auto-generate if no tasks exist
                    if (record == null) {
                        generateTasks(auto = true)
                    }
                },
                onFailure = { error ->
                    _state.update { it.copy(error = error.message, isLoading = false) }
                }
            )
        }
    }

    fun setAdjustNote(note: String) {
        _state.update { it.copy(adjustNote = note) }
    }

    fun generateTasks(auto: Boolean = false) {
        val currentState = _state.value
        if (currentState.profileLoaded && !currentState.hasTargetExam) return
        if (currentState.isGenerating) return

        viewModelScope.launch {
            _state.update { it.copy(isGenerating = true, error = null) }

            repository.generateDailyTask(
                date = currentState.today,
                adjustNote = currentState.adjustNote.takeIf { it.isNotBlank() },
                existingTasks = currentState.taskRecord?.tasks,
                auto = auto
            ).fold(
                onSuccess = { record ->
                    _state.update {
                        it.copy(
                            taskRecord = record,
                            isGenerating = false,
                            adjustNote = ""
                        )
                    }
                },
                onFailure = { error ->
                    _state.update { it.copy(error = error.message, isGenerating = false) }
                }
            )
        }
    }

    fun toggleTask(taskId: String) {
        val current = _state.value.taskRecord ?: return

        val updatedTasks = current.tasks.map { task ->
            if (task.id == taskId) task.copy(done = !task.done) else task
        }

        updateTasksOptimistically(updatedTasks)
    }

    fun toggleSubtask(taskId: String, subtaskId: String) {
        val current = _state.value.taskRecord ?: return

        val updatedTasks = current.tasks.map { task ->
            if (task.id == taskId) {
                val updatedSubtasks = task.subtasks.map { sub ->
                    if (sub.id == subtaskId) sub.copy(done = !sub.done) else sub
                }
                task.copy(subtasks = updatedSubtasks)
            } else task
        }

        updateTasksOptimistically(updatedTasks)
    }

    fun breakdownTask(task: TaskItem) {
        val current = _state.value.taskRecord ?: return

        viewModelScope.launch {
            _state.update { it.copy(breakdownTaskId = task.id, error = null) }

            repository.breakdownTask(
                task = task.title,
                context = current.summary ?: ""
            ).fold(
                onSuccess = { subtasks ->
                    if (subtasks.isNotEmpty()) {
                        val updatedTasks = current.tasks.map { t ->
                            if (t.id == task.id) {
                                t.copy(
                                    subtasks = subtasks.map { title ->
                                        Subtask(
                                            id = "sub-${UUID.randomUUID().toString().take(8)}",
                                            title = title,
                                            done = false
                                        )
                                    }
                                )
                            } else t
                        }
                        updateTasksOptimistically(updatedTasks)
                    }
                    _state.update { it.copy(breakdownTaskId = null) }
                },
                onFailure = { error ->
                    _state.update { it.copy(error = error.message, breakdownTaskId = null) }
                }
            )
        }
    }

    private fun updateTasksOptimistically(tasks: List<TaskItem>) {
        val current = _state.value.taskRecord ?: return

        // Update UI immediately
        _state.update {
            it.copy(taskRecord = current.copy(tasks = tasks), isSaving = true)
        }

        // Save to server
        viewModelScope.launch {
            repository.updateDailyTask(current.id, tasks).fold(
                onSuccess = { record ->
                    _state.update {
                        it.copy(
                            taskRecord = record ?: it.taskRecord,
                            isSaving = false
                        )
                    }
                },
                onFailure = { error ->
                    _state.update { it.copy(error = error.message, isSaving = false) }
                }
            )
        }
    }

    fun clearError() {
        _state.update { it.copy(error = null) }
    }

    private data class GreetingInfo(
        val userName: String,
        val targetExam: String,
        val greetingText: String,
        val countdownText: String
    )

    private fun buildGreeting(
        user: User?,
        profile: StudyPlanProfile?,
        todayLabel: String
    ): GreetingInfo? {
        val targetExamDate = profile?.targetExamDate?.take(10)?.trim()
        if (targetExamDate.isNullOrBlank()) return null

        val examLabel = profile?.targetExam?.trim().takeUnless { it.isNullOrBlank() } ?: "目标考试"
        val daysLeft = DateUtils.daysUntil(targetExamDate, todayLabel) ?: return null

        val userName = user?.username?.trim().takeUnless { it.isNullOrBlank() }
            ?: user?.email?.trim().takeUnless { it.isNullOrBlank() }
            ?: user?.walletAddress?.trim().takeUnless { it.isNullOrBlank() }
            ?: "同学"
        val greetingLabel = DateUtils.getGreetingLabel()
        val greetingText = "${greetingLabel}好，${userName}"
        val countdownText = "距离${examLabel}还有 ${daysLeft} 天"
        return GreetingInfo(userName, examLabel, greetingText, countdownText)
    }
}
