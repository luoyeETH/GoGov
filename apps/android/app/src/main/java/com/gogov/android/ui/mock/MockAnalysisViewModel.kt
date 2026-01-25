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
    val isLoadingHistory: Boolean = false
)

enum class MockInputMode {
    IMAGE,
    MANUAL
}

class MockAnalysisViewModel(
    private val repository: MockRepository
) : ViewModel() {

    private val _state = MutableStateFlow(MockAnalysisUiState())
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
            val timeMinutes = draft.timeMinutes.toIntOrNull()
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
}
