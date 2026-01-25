package com.gogov.android.ui.chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gogov.android.data.repository.ChatRepository
import com.gogov.android.domain.model.ChatMessage
import com.gogov.android.domain.model.ChatMode
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ChatUiState(
    val messages: List<ChatMessage> = emptyList(),
    val mode: ChatMode = ChatMode.TUTOR,
    val isLoading: Boolean = false,
    val isSending: Boolean = false,
    val error: String? = null,
    val inputText: String = ""
)

class ChatViewModel(private val repository: ChatRepository) : ViewModel() {

    private val _state = MutableStateFlow(ChatUiState())
    val state: StateFlow<ChatUiState> = _state.asStateFlow()

    fun loadHistory() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            repository.getHistory(_state.value.mode).fold(
                onSuccess = { messages ->
                    val ordered = normalizeMessages(messages)
                    _state.update { it.copy(messages = ordered, isLoading = false) }
                },
                onFailure = { error ->
                    _state.update { it.copy(error = error.message, isLoading = false) }
                }
            )
        }
    }

    fun setMode(mode: ChatMode) {
        if (_state.value.mode == mode) return

        _state.update { it.copy(mode = mode, messages = emptyList()) }
        loadHistory()
    }

    fun setInputText(text: String) {
        _state.update { it.copy(inputText = text, error = null) }
    }

    fun sendMessage() {
        val content = _state.value.inputText.trim()
        if (content.isBlank()) {
            _state.update { it.copy(error = "请输入内容。") }
            return
        }

        if (content.length > 2000) {
            _state.update { it.copy(error = "内容过长（最多 2000 字）。") }
            return
        }

        val pendingMessage = ChatMessage(
            id = "pending-${System.currentTimeMillis()}",
            role = "user",
            content = content,
            createdAt = java.time.Instant.now().toString()
        )

        _state.update {
            it.copy(
                messages = it.messages + pendingMessage,
                inputText = "",
                isSending = true,
                error = null
            )
        }

        viewModelScope.launch {
            repository.sendMessage(content, _state.value.mode).fold(
                onSuccess = { newMessages ->
                    _state.update { state ->
                        val withoutPending = state.messages.filter { it.id != pendingMessage.id }
                        val ordered = normalizeMessages(withoutPending + newMessages)
                        state.copy(
                            messages = ordered,
                            isSending = false
                        )
                    }
                },
                onFailure = { error ->
                    _state.update { state ->
                        state.copy(
                            inputText = content,
                            error = error.message,
                            isSending = false,
                            messages = state.messages.map {
                                if (it.id == pendingMessage.id) it.copy(id = "failed-${it.id}")
                                else it
                            }
                        )
                    }
                }
            )
        }
    }

    fun clearError() {
        _state.update { it.copy(error = null) }
    }

    private data class SortableMessage(
        val message: ChatMessage,
        val timeMillis: Long?,
        val index: Int
    )

    private fun normalizeMessages(messages: List<ChatMessage>): List<ChatMessage> {
        if (messages.size <= 1) return messages
        val sortable = messages.mapIndexed { index, message ->
            SortableMessage(message, parseEpochMillis(message.createdAt), index)
        }
        val hasTime = sortable.any { it.timeMillis != null }
        if (!hasTime) return messages
        return sortable
            .sortedWith(compareBy<SortableMessage> { it.timeMillis ?: Long.MAX_VALUE }
                .thenBy { it.index })
            .map { it.message }
    }

    private fun parseEpochMillis(value: String?): Long? {
        if (value.isNullOrBlank()) return null
        return try {
            java.time.Instant.parse(value).toEpochMilli()
        } catch (e: Exception) {
            null
        }
    }
}
