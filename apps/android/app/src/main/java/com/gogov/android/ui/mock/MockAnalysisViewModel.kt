package com.gogov.android.ui.mock

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gogov.android.data.repository.MockRepository
import com.gogov.android.domain.model.MockAnalysisResponse
import com.gogov.android.domain.model.MockMetricInput
import com.gogov.android.domain.model.MockAnalysisRequest
import com.gogov.android.domain.model.MockHistoryRecord
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream

data class MockMetricDraft(
    val subject: String = "",
    val correct: String = "",
    val total: String = "",
    val timeMinutes: String = ""
)

data class MockAnalysisUiState(
    val title: String = "",
    val note: String = "",
    val metrics: List<MockMetricDraft> = listOf(MockMetricDraft()),
    val selectedImageUri: Uri? = null,
    val selectedImageDataUrl: String? = null,
    val isSubmitting: Boolean = false,
    val error: String? = null,
    val result: MockAnalysisResponse? = null,
    val history: List<MockHistoryRecord> = emptyList(),
    val isLoadingHistory: Boolean = false,
    val isDeletingHistory: Boolean = false
)

enum class MockInputMode {
    IMAGE,
    MANUAL
}

class MockAnalysisViewModel(
    private val repository: MockRepository
) : ViewModel() {

    private val _state = MutableStateFlow(
        MockAnalysisUiState(
            title = getDefaultMockTitles().provincial,
            metrics = defaultSubjects.map { MockMetricDraft(subject = it) }
        )
    )
    val state: StateFlow<MockAnalysisUiState> = _state.asStateFlow()

    fun loadHistory() {
        viewModelScope.launch {
            _state.update { it.copy(isLoadingHistory = true, error = null) }
            repository.getHistory().fold(
                onSuccess = { history ->
                    _state.update { it.copy(history = history, isLoadingHistory = false) }
                },
                onFailure = { error ->
                    _state.update { it.copy(error = error.message, isLoadingHistory = false) }
                }
            )
        }
    }

    fun deleteHistory(id: String) {
        viewModelScope.launch {
            _state.update { it.copy(isDeletingHistory = true, error = null) }
            repository.deleteHistory(id).fold(
                onSuccess = {
                    _state.update { state ->
                        state.copy(
                            history = state.history.filter { it.id != id },
                            isDeletingHistory = false
                        )
                    }
                },
                onFailure = { error ->
                    _state.update { it.copy(isDeletingHistory = false, error = error.message) }
                }
            )
        }
    }

    fun setTitle(value: String) {
        _state.update { it.copy(title = value) }
    }

    fun setNote(value: String) {
        _state.update { it.copy(note = value) }
    }

    fun updateMetric(index: Int, update: (MockMetricDraft) -> MockMetricDraft) {
        _state.update { state ->
            val updated = state.metrics.toMutableList()
            if (index in updated.indices) {
                updated[index] = update(updated[index])
            }
            state.copy(metrics = updated)
        }
    }

    fun addMetricRow() {
        _state.update { state ->
            state.copy(metrics = state.metrics + MockMetricDraft())
        }
    }

    fun removeMetricRow(index: Int) {
        _state.update { state ->
            if (state.metrics.size <= 1) {
                state
            } else {
                state.copy(metrics = state.metrics.filterIndexed { i, _ -> i != index })
            }
        }
    }

    fun setSelectedImage(uri: Uri?, context: Context) {
        if (uri == null) {
            _state.update { it.copy(selectedImageUri = null, selectedImageDataUrl = null) }
            return
        }
        viewModelScope.launch {
            try {
                val dataUrl = withContext(Dispatchers.IO) {
                    uriToDataUrl(uri, context)
                }
                _state.update { it.copy(selectedImageUri = uri, selectedImageDataUrl = dataUrl) }
            } catch (e: Exception) {
                _state.update { it.copy(error = "图片处理失败：${e.message}") }
            }
        }
    }

    fun clearSelectedImage() {
        _state.update { it.copy(selectedImageUri = null, selectedImageDataUrl = null) }
    }

    fun submitAnalysis(mode: MockInputMode) {
        val state = _state.value
        val imageDataUrl = state.selectedImageDataUrl
        val metrics = state.metrics.mapNotNull { draft ->
            val subject = draft.subject.trim().takeIf { it.isNotBlank() }
            val correct = draft.correct.toIntOrNull()
            val total = draft.total.toIntOrNull()
            val timeMinutes = draft.timeMinutes.toDoubleOrNull()
            if (subject == null && correct == null && total == null && timeMinutes == null) {
                null
            } else {
                MockMetricInput(
                    subject = subject,
                    correct = correct,
                    total = total,
                    timeMinutes = timeMinutes
                )
            }
        }

        if (mode == MockInputMode.IMAGE && imageDataUrl == null) {
            _state.update { it.copy(error = "请上传模考图片。") }
            return
        }
        if (mode == MockInputMode.MANUAL && metrics.isEmpty()) {
            _state.update { it.copy(error = "请填写手动数据。") }
            return
        }

        _state.update { it.copy(isSubmitting = true, error = null, result = null) }
        viewModelScope.launch {
            val request = MockAnalysisRequest(
                images = if (mode == MockInputMode.IMAGE) imageDataUrl?.let { listOf(it) } else null,
                metrics = if (mode == MockInputMode.MANUAL && metrics.isNotEmpty()) metrics else null,
                title = state.title.trim().ifBlank { null },
                note = state.note.trim().ifBlank { null }
            )
            repository.analyze(request).fold(
                onSuccess = { response ->
                    _state.update {
                        it.copy(
                            isSubmitting = false,
                            result = response,
                            selectedImageUri = null,
                            selectedImageDataUrl = null
                        )
                    }
                    loadHistory()
                },
                onFailure = { error ->
                    _state.update { it.copy(isSubmitting = false, error = error.message) }
                }
            )
        }
    }

    fun clearError() {
        _state.update { it.copy(error = null) }
    }

    private fun uriToDataUrl(uri: Uri, context: Context): String {
        val bitmap = context.contentResolver.openInputStream(uri)?.use { stream ->
            BitmapFactory.decodeStream(stream)
        } ?: throw Exception("无法读取图片或图片格式不支持")

        val maxSize = 1024
        val ratio = minOf(
            maxSize.toFloat() / bitmap.width,
            maxSize.toFloat() / bitmap.height
        )

        val resizedBitmap = if (ratio < 1) {
            Bitmap.createScaledBitmap(
                bitmap,
                (bitmap.width * ratio).toInt(),
                (bitmap.height * ratio).toInt(),
                true
            )
        } else {
            bitmap
        }

        val outputStream = ByteArrayOutputStream()
        resizedBitmap.compress(Bitmap.CompressFormat.JPEG, 85, outputStream)
        val bytes = outputStream.toByteArray()

        val base64 = Base64.encodeToString(bytes, Base64.NO_WRAP)
        return "data:image/jpeg;base64,$base64"
    }

    private data class DefaultMockTitles(
        val provincial: String,
        val national: String
    )

    private fun getDefaultMockTitles(): DefaultMockTitles {
        val now = java.time.ZonedDateTime.now(java.time.ZoneId.of("Asia/Shanghai"))
        val weekStart = now.toLocalDate().with(java.time.DayOfWeek.MONDAY)
        val base = java.time.LocalDate.parse("2025-12-21")
        val daysDiff = java.time.temporal.ChronoUnit.DAYS.between(base, weekStart)
        val diffWeeks = Math.floorDiv(daysDiff, 7)
        val examYear = if (now.monthValue == 12) now.year + 1 else now.year
        val nationalRawSeason = baseNationalSeasonIndex - 1 + diffWeeks
        val nationalSeasonIndex = ((nationalRawSeason % 4 + 4) % 4).toInt()
        val provincialSeasonNumber = kotlin.math.max(1, baseProvincialSeasonNumber + diffWeeks.toInt())
        return DefaultMockTitles(
            national = "${examYear}粉笔模考（国考）第${seasons[nationalSeasonIndex]}季",
            provincial = "${examYear}粉笔模考（省考）第${formatChineseNumber(provincialSeasonNumber)}季"
        )
    }

    private fun formatChineseNumber(value: Int): String {
        val digits = listOf("零", "一", "二", "三", "四", "五", "六", "七", "八", "九")
        if (value <= 10) {
            return if (value == 10) "十" else digits.getOrElse(value) { "一" }
        }
        if (value < 20) {
            return "十${digits.getOrElse(value % 10) { "" }}"
        }
        val tens = value / 10
        val ones = value % 10
        return "${digits.getOrElse(tens) { "" }}十${if (ones == 0) "" else digits.getOrElse(ones) { "" }}"
    }

    companion object {
        private val defaultSubjects = listOf(
            "政治理论",
            "常识判断",
            "言语理解与表达",
            "数量关系",
            "判断推理",
            "资料分析"
        )
        private const val baseNationalSeasonIndex = 3
        private const val baseProvincialSeasonNumber = 4
        private val seasons = listOf("一", "二", "三", "四")
    }
}
