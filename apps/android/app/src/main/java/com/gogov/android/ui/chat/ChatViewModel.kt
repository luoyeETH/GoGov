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
    val mode: ChatMode = ChatMode.PLANNER,
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
                    _state.update { it.copy(messages = messages, isLoading = false) }
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
            _state.update { it.copy(error = "Please enter a message.") }
            return
        }

        if (content.length > 2000) {
            _state.update { it.copy(error = "Message too long (max 2000 characters).") }
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
                        state.copy(
                            messages = withoutPending + newMessages,
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
}
