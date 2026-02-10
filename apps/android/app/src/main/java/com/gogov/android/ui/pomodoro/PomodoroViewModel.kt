package com.gogov.android.ui.pomodoro

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gogov.android.data.local.PomodoroStorage
import com.gogov.android.data.repository.PomodoroRepository
import com.gogov.android.domain.model.*
import com.gogov.android.util.AppLifecycleObserver
import com.gogov.android.util.DateUtils
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class PomodoroViewModel(
    private val repository: PomodoroRepository,
    private val storage: PomodoroStorage,
    private val lifecycleObserver: AppLifecycleObserver
) : ViewModel() {

    companion object {
        const val PAUSE_LIMIT_SECONDS = 5 * 60
        val BUILT_IN_SUBJECTS = listOf(
            "常识", "政治理论", "言语理解", "数量关系", "判断推理", "资料分析", "专业知识", "申论"
        )
        val DURATION_PRESETS = listOf(5, 15, 25, 35, 45, 60)
    }

    private val _state = MutableStateFlow(PomodoroState())
    val state: StateFlow<PomodoroState> = _state.asStateFlow()

    private val _customSubjects = MutableStateFlow<List<PomodoroSubject>>(emptyList())
    val customSubjects: StateFlow<List<PomodoroSubject>> = _customSubjects.asStateFlow()

    private val _insights = MutableStateFlow<PomodoroInsights?>(null)
    val insights: StateFlow<PomodoroInsights?> = _insights.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message.asStateFlow()

    private val _lastResult = MutableStateFlow<PomodoroState?>(null)
    val lastResult: StateFlow<PomodoroState?> = _lastResult.asStateFlow()

    private var timerJob: Job? = null
    private var startTimeMs: Long = 0L
    private var pausedTotalMs: Long = 0L
    private var pauseStartMs: Long? = null

    init {
        observeAppLifecycle()
        observeOverlayPreference()
        restoreState()
    }

    private fun observeAppLifecycle() {
        viewModelScope.launch {
            lifecycleObserver.isInForeground.collect { inForeground ->
                val currentState = _state.value
                if (!inForeground && currentState.status == PomodoroStatus.RUNNING) {
                    if (currentState.overlayEnabled) {
                        saveStateToDisk()
                    } else {
                        pauseSession()
                    }
                }
            }
        }
    }

    private fun observeOverlayPreference() {
        viewModelScope.launch {
            storage.savedState
                .map { it?.overlayEnabled ?: false }
                .distinctUntilChanged()
                .collect { enabled ->
                    _state.update { current ->
                        if (current.sessionId == null) current.copy(overlayEnabled = false)
                        else current.copy(overlayEnabled = enabled)
                    }

                    val current = _state.value
                    if (!enabled && !lifecycleObserver.isInForeground.value && current.status == PomodoroStatus.RUNNING) {
                        pauseSession()
                    }
                }
        }
    }

    private fun restoreState() {
        viewModelScope.launch {
            val saved = storage.getSavedStateSync() ?: return@launch

            if (saved.sessionId.isNullOrEmpty()) return@launch

            val status = when (saved.status) {
                "running" -> PomodoroStatus.RUNNING
                "paused" -> PomodoroStatus.PAUSED
                else -> return@launch
            }

            val mode = if (saved.mode == "timer") PomodoroMode.TIMER else PomodoroMode.COUNTDOWN

            startTimeMs = saved.startTime
            pausedTotalMs = saved.pausedTotalMs
            pauseStartMs = saved.pauseStart

            val now = System.currentTimeMillis()
            val elapsed = if (status == PomodoroStatus.PAUSED && pauseStartMs != null) {
                ((pauseStartMs!! - startTimeMs - pausedTotalMs) / 1000).toInt()
            } else {
                ((now - startTimeMs - pausedTotalMs) / 1000).toInt()
            }

            val pauseElapsed = if (status == PomodoroStatus.PAUSED && pauseStartMs != null) {
                ((now - pauseStartMs!!) / 1000).toInt()
            } else 0

            if (pauseElapsed >= PAUSE_LIMIT_SECONDS) {
                finishSession(PomodoroStatus.FAILED, "pause_timeout")
                return@launch
            }

            _state.value = PomodoroState(
                status = status,
                mode = mode,
                sessionId = saved.sessionId,
                subject = saved.subject,
                plannedMinutes = saved.plannedMinutes,
                elapsedSeconds = elapsed,
                pauseElapsedSeconds = pauseElapsed,
                pauseCount = saved.pauseCount,
                segments = saved.segments,
                overlayEnabled = saved.overlayEnabled
            )

            if (status == PomodoroStatus.RUNNING || status == PomodoroStatus.PAUSED) {
                startTimer()
            }
        }
    }

    private suspend fun saveStateToDisk() {
        val current = _state.value
        if (current.sessionId == null) {
            storage.clearState()
            return
        }

        storage.saveState(
            PomodoroStorage.PomodoroSavedState(
                sessionId = current.sessionId,
                subject = current.subject,
                plannedMinutes = current.plannedMinutes,
                startTime = startTimeMs,
                pausedTotalMs = pausedTotalMs,
                pauseStart = pauseStartMs,
                pauseCount = current.pauseCount,
                segments = current.segments,
                status = when (current.status) {
                    PomodoroStatus.RUNNING -> "running"
                    PomodoroStatus.PAUSED -> "paused"
                    else -> "idle"
                },
                mode = if (current.mode == PomodoroMode.TIMER) "timer" else "countdown",
                overlayEnabled = current.overlayEnabled
            )
        )
    }

    fun setOverlayEnabled(enabled: Boolean) {
        _state.update { it.copy(overlayEnabled = enabled) }
        viewModelScope.launch { saveStateToDisk() }
    }

    fun loadData() {
        viewModelScope.launch {
            loadSubjects()
            loadInsights()
        }
    }

    private suspend fun loadSubjects() {
        repository.getSubjects().fold(
            onSuccess = { _customSubjects.value = it },
            onFailure = { _message.value = it.message }
        )
    }

    private suspend fun loadInsights() {
        repository.getInsights().fold(
            onSuccess = { _insights.value = it },
            onFailure = { _message.value = it.message }
        )
    }

    fun setSubject(subject: String) {
        _state.update { it.copy(subject = subject) }
    }

    fun setPlannedMinutes(minutes: Int) {
        _state.update { it.copy(plannedMinutes = minutes.coerceIn(1, 240)) }
    }

    fun setMode(mode: PomodoroMode) {
        _state.update { it.copy(mode = mode) }
    }

    fun startSession() {
        val current = _state.value
        if (current.subject.isBlank()) {
            _message.value = "请选择学习科目。"
            return
        }

        _isLoading.value = true
        _message.value = null
        _lastResult.value = null

        viewModelScope.launch {
            repository.startSession(current.subject, current.plannedMinutes).fold(
                onSuccess = { session ->
                    startTimeMs = System.currentTimeMillis()
                    pausedTotalMs = 0L
                    pauseStartMs = null

                    _state.update {
                        it.copy(
                            status = PomodoroStatus.RUNNING,
                            sessionId = session.id,
                            elapsedSeconds = 0,
                            pauseElapsedSeconds = 0,
                            pauseCount = 0,
                            segments = emptyList(),
                            overlayEnabled = false
                        )
                    }

                    saveStateToDisk()
                    startTimer()
                },
                onFailure = { _message.value = it.message }
            )
            _isLoading.value = false
        }
    }

    fun pauseSession() {
        if (_state.value.status != PomodoroStatus.RUNNING) return

        pauseStartMs = System.currentTimeMillis()
        _state.update {
            it.copy(
                status = PomodoroStatus.PAUSED,
                pauseCount = it.pauseCount + 1,
                pauseElapsedSeconds = 0
            )
        }

        viewModelScope.launch { saveStateToDisk() }
    }

    fun resumeSession() {
        if (_state.value.status != PomodoroStatus.PAUSED) return

        pauseStartMs?.let { start ->
            pausedTotalMs += System.currentTimeMillis() - start
        }
        pauseStartMs = null

        _state.update {
            it.copy(
                status = PomodoroStatus.RUNNING,
                pauseElapsedSeconds = 0
            )
        }

        viewModelScope.launch { saveStateToDisk() }
    }

    fun finishSession(finalStatus: PomodoroStatus, reason: String? = null) {
        timerJob?.cancel()
        timerJob = null

        val current = _state.value
        val sessionId = current.sessionId ?: return

        val now = System.currentTimeMillis()
        val totalPausedMs = pausedTotalMs + (pauseStartMs?.let { now - it } ?: 0L)
        val durationSeconds = ((now - startTimeMs - totalPausedMs) / 1000).toInt().coerceAtLeast(0)
        val pauseSeconds = (totalPausedMs / 1000).toInt()

        _lastResult.value = current.copy(
            status = finalStatus,
            elapsedSeconds = durationSeconds
        )

        viewModelScope.launch {
            repository.finishSession(
                sessionId = sessionId,
                status = when (finalStatus) {
                    PomodoroStatus.COMPLETED -> "completed"
                    PomodoroStatus.FAILED -> "failed"
                    else -> "abandoned"
                },
                durationSeconds = durationSeconds,
                pauseSeconds = pauseSeconds,
                pauseCount = current.pauseCount,
                failureReason = reason
            )

            storage.clearState()
            loadInsights()
        }

        resetState()
    }

    fun addSegment() {
        if (_state.value.status != PomodoroStatus.RUNNING) return
        if (_state.value.mode != PomodoroMode.TIMER) return

        // Capture segment based on the real elapsed time at tap, not the UI tick.
        val now = System.currentTimeMillis()
        val elapsed = ((now - startTimeMs - pausedTotalMs) / 1000).toInt()
        val segmentsTotal = _state.value.segments.sum()
        val currentSegment = elapsed - segmentsTotal
        if (currentSegment <= 0) return

        _state.update {
            it.copy(
                elapsedSeconds = elapsed.coerceAtLeast(it.elapsedSeconds),
                segments = it.segments + currentSegment
            )
        }
        viewModelScope.launch { saveStateToDisk() }
    }

    fun clearMessage() {
        _message.value = null
    }

    fun clearLastResult() {
        _lastResult.value = null
    }

    private fun resetState() {
        startTimeMs = 0L
        pausedTotalMs = 0L
        pauseStartMs = null

        _state.update {
            it.copy(
                status = PomodoroStatus.IDLE,
                sessionId = null,
                elapsedSeconds = 0,
                pauseElapsedSeconds = 0,
                pauseCount = 0,
                segments = emptyList(),
                overlayEnabled = false
            )
        }
    }

    private fun startTimer() {
        timerJob?.cancel()
        timerJob = viewModelScope.launch {
            while (true) {
                delay(500)
                updateTimer()
            }
        }
    }

    private fun updateTimer() {
        val current = _state.value
        val now = System.currentTimeMillis()

        when (current.status) {
            PomodoroStatus.RUNNING -> {
                val elapsed = ((now - startTimeMs - pausedTotalMs) / 1000).toInt()
                _state.update { it.copy(elapsedSeconds = elapsed) }

                if (current.mode == PomodoroMode.COUNTDOWN) {
                    val plannedSeconds = current.plannedMinutes * 60
                    if (elapsed >= plannedSeconds) {
                        finishSession(PomodoroStatus.COMPLETED)
                    }
                }
            }

            PomodoroStatus.PAUSED -> {
                pauseStartMs?.let { start ->
                    val pauseElapsed = ((now - start) / 1000).toInt()
                    _state.update { it.copy(pauseElapsedSeconds = pauseElapsed) }

                    if (pauseElapsed >= PAUSE_LIMIT_SECONDS) {
                        finishSession(PomodoroStatus.FAILED, "pause_timeout")
                    }
                }
            }

            else -> {
                timerJob?.cancel()
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        timerJob?.cancel()
    }
}
