package com.gogov.android.ui.quick

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gogov.android.data.repository.QuickPracticeRepository
import com.gogov.android.domain.model.QuickPracticeCategory
import com.gogov.android.domain.model.QuickPracticeQuestion
import com.gogov.android.domain.model.QuickPracticeSessionRecord
import com.gogov.android.domain.model.QuickPracticeSessionRequest
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.Instant
import kotlin.math.roundToInt

enum class PracticeMode { DRILL, QUIZ }
enum class PracticeStatus { IDLE, LOADING, ACTIVE, DONE }

data class QuickPracticeUiState(
    val categories: List<QuickPracticeCategory> = emptyList(),
    val selectedGroup: String = "",
    val selectedCategoryId: String = "",
    val mode: PracticeMode = PracticeMode.DRILL,
    val setSize: Int = 10,
    val autoNext: Boolean = true,
    val status: PracticeStatus = PracticeStatus.IDLE,
    val questions: List<QuickPracticeQuestion> = emptyList(),
    val currentIndex: Int = 0,
    val answers: Map<String, String> = emptyMap(),
    val inputValue: String = "",
    val elapsedSeconds: Int = 0,
    val error: String? = null
)

class QuickPracticeViewModel(
    private val repository: QuickPracticeRepository
) : ViewModel() {

    private val _state = MutableStateFlow(QuickPracticeUiState())
    val state: StateFlow<QuickPracticeUiState> = _state.asStateFlow()

    private var timerJob: Job? = null
    private var autoNextJob: Job? = null
    private var sessionStartedAt: Long? = null
    private var sessionEndedAt: Long? = null
    private var submitted = false

    init {
        loadCategories()
    }

    fun loadCategories() {
        viewModelScope.launch {
            _state.update { it.copy(error = null) }
            repository.loadCategories().fold(
                onSuccess = { list ->
                    val group = list.firstOrNull()?.group ?: "其他"
                    val firstInGroup = list.firstOrNull { (it.group ?: "其他") == group }
                    _state.update {
                        it.copy(
                            categories = list,
                            selectedGroup = group,
                            selectedCategoryId = firstInGroup?.id ?: "",
                            error = null
                        )
                    }
                },
                onFailure = { error ->
                    _state.update { it.copy(error = error.message) }
                }
            )
        }
    }

    fun selectGroup(group: String) {
        val categories = _state.value.categories
        val first = categories.firstOrNull { (it.group ?: "其他") == group }
        _state.update {
            it.copy(
                selectedGroup = group,
                selectedCategoryId = first?.id ?: it.selectedCategoryId
            )
        }
    }

    fun selectCategory(id: String) {
        _state.update { it.copy(selectedCategoryId = id) }
    }

    fun setMode(mode: PracticeMode) {
        _state.update { it.copy(mode = mode) }
    }

    fun setSetSize(size: Int) {
        _state.update { it.copy(setSize = size) }
    }

    fun toggleAutoNext() {
        _state.update { it.copy(autoNext = !it.autoNext) }
    }

    fun startSession() {
        val current = _state.value
        if (current.selectedCategoryId.isBlank() || current.status == PracticeStatus.LOADING) {
            return
        }
        viewModelScope.launch {
            _state.update {
                it.copy(
                    status = PracticeStatus.LOADING,
                    error = null,
                    answers = emptyMap(),
                    currentIndex = 0,
                    questions = emptyList(),
                    inputValue = "",
                    elapsedSeconds = 0
                )
            }
            val count = current.setSize.coerceIn(1, 50)
            repository.fetchBatch(current.selectedCategoryId, count).fold(
                onSuccess = { questions ->
                    sessionStartedAt = System.currentTimeMillis()
                    sessionEndedAt = null
                    submitted = false
                    _state.update {
                        it.copy(
                            questions = questions,
                            status = PracticeStatus.ACTIVE,
                            currentIndex = 0,
                            inputValue = ""
                        )
                    }
                    startTimer()
                },
                onFailure = { error ->
                    _state.update {
                        it.copy(
                            status = PracticeStatus.IDLE,
                            error = error.message ?: "获取题目失败"
                        )
                    }
                }
            )
        }
    }

    fun updateInput(value: String) {
        if (_state.value.status != PracticeStatus.ACTIVE) return
        if (isAnswered()) return
        _state.update { it.copy(inputValue = value) }
    }

    fun handleKeypad(key: String) {
        if (_state.value.status != PracticeStatus.ACTIVE) return
        if (isAnswered()) return
        _state.update { state ->
            val next = when (key) {
                "clear" -> ""
                "back" -> if (state.inputValue.isNotEmpty()) state.inputValue.dropLast(1) else ""
                "toggle" -> {
                    if (state.inputValue.startsWith("-")) state.inputValue.drop(1)
                    else "-${state.inputValue}"
                }
                else -> state.inputValue + key
            }
            state.copy(inputValue = next)
        }
    }

    fun submitInput() {
        val current = _state.value
        if (current.status != PracticeStatus.ACTIVE) return
        val question = current.questions.getOrNull(current.currentIndex) ?: return
        if (current.inputValue.trim().isEmpty()) return
        if (QuickPracticeEvaluator.parseNumeric(current.inputValue.trim()) == null &&
            question.choices.isNullOrEmpty()
        ) {
            return
        }
        submitAnswer(current.inputValue.trim())
    }

    fun selectChoice(choice: String) {
        if (_state.value.status != PracticeStatus.ACTIVE) return
        submitAnswer(choice)
    }

    fun nextQuestion() {
        val current = _state.value
        if (current.status != PracticeStatus.ACTIVE) return
        val next = current.currentIndex + 1
        if (next >= current.questions.size) {
            finishSession()
            return
        }
        _state.update {
            it.copy(
                currentIndex = next,
                inputValue = it.answers[current.questions[next].id] ?: ""
            )
        }
    }

    fun restart() {
        stopTimer()
        autoNextJob?.cancel()
        _state.update {
            it.copy(
                status = PracticeStatus.IDLE,
                questions = emptyList(),
                answers = emptyMap(),
                currentIndex = 0,
                inputValue = "",
                elapsedSeconds = 0,
                error = null
            )
        }
    }

    fun finishSession() {
        val current = _state.value
        if (current.status != PracticeStatus.ACTIVE) return
        sessionEndedAt = System.currentTimeMillis()
        stopTimer()
        _state.update { it.copy(status = PracticeStatus.DONE) }
        submitSession()
    }

    fun clearError() {
        _state.update { it.copy(error = null) }
    }

    private fun submitAnswer(value: String) {
        val current = _state.value
        val question = current.questions.getOrNull(current.currentIndex) ?: return
        if (current.answers.containsKey(question.id)) return

        _state.update {
            it.copy(
                answers = it.answers + (question.id to value),
                inputValue = value
            )
        }

        val category = current.categories.firstOrNull { it.id == question.categoryId }
        val evaluation = QuickPracticeEvaluator.evaluate(question, value, category)

        if (current.mode == PracticeMode.QUIZ) {
            nextQuestion()
            return
        }

        if (current.autoNext && evaluation.correct) {
            autoNextJob?.cancel()
            autoNextJob = viewModelScope.launch {
                delay(700)
                nextQuestion()
            }
        }
    }

    private fun isAnswered(): Boolean {
        val current = _state.value
        val question = current.questions.getOrNull(current.currentIndex) ?: return false
        return current.answers.containsKey(question.id)
    }

    private fun startTimer() {
        stopTimer()
        timerJob = viewModelScope.launch {
            while (_state.value.status == PracticeStatus.ACTIVE) {
                val start = sessionStartedAt ?: break
                val elapsed = ((System.currentTimeMillis() - start) / 1000.0).roundToInt()
                _state.update { it.copy(elapsedSeconds = elapsed) }
                delay(1000)
            }
        }
    }

    private fun stopTimer() {
        timerJob?.cancel()
        timerJob = null
    }

    private fun submitSession() {
        if (submitted) return
        val current = _state.value
        val startedAt = sessionStartedAt ?: return
        val endedAt = sessionEndedAt ?: return
        if (current.questions.isEmpty()) return

        val categoryId = current.selectedCategoryId
        val questions = current.questions.mapNotNull { question ->
            val userAnswer = current.answers[question.id] ?: ""
            if (userAnswer.isBlank()) {
                return@mapNotNull null
            }
            val category = current.categories.firstOrNull { it.id == question.categoryId }
            val evaluation = QuickPracticeEvaluator.evaluate(question, userAnswer, category)
            QuickPracticeSessionRecord(
                id = question.id,
                prompt = question.prompt,
                answer = question.answer,
                userAnswer = userAnswer,
                choices = question.choices,
                explanation = question.explanation,
                correct = evaluation.correct
            )
        }

        if (questions.isEmpty()) return

        val request = QuickPracticeSessionRequest(
            categoryId = categoryId,
            mode = if (current.mode == PracticeMode.DRILL) "drill" else "quiz",
            startedAt = Instant.ofEpochMilli(startedAt).toString(),
            endedAt = Instant.ofEpochMilli(endedAt).toString(),
            questions = questions
        )

        submitted = true
        viewModelScope.launch {
            repository.submitSession(request)
        }
    }
}
