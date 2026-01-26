package com.gogov.android.ui.chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gogov.android.data.repository.ChatRepository
import com.gogov.android.domain.model.ChatHistoryScope
import com.gogov.android.domain.model.ChatMessage
import com.gogov.android.domain.model.ChatMode
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch


data class ChatHistoryItem(
    val id: String,
    val title: String,
    val question: String,
    val answer: String?,
    val createdAt: String
)

data class ChatHistoryUiState(
    val items: List<ChatHistoryItem> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

class ChatHistoryViewModel(private val repository: ChatRepository) : ViewModel() {

    private val _state = MutableStateFlow(ChatHistoryUiState())
    val state: StateFlow<ChatHistoryUiState> = _state.asStateFlow()

    fun loadHistory(mode: ChatMode) {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            repository.getHistory(mode, ChatHistoryScope.HISTORY).fold(
                onSuccess = { messages ->
                    _state.update {
                        it.copy(
                            items = buildHistoryItems(messages),
                            isLoading = false
                        )
                    }
                },
                onFailure = { error ->
                    _state.update { it.copy(error = error.message, isLoading = false) }
                }
            )
        }
    }
}

private fun buildHistoryItems(messages: List<ChatMessage>): List<ChatHistoryItem> {
    if (messages.isEmpty()) return emptyList()

    val items = mutableListOf<ChatHistoryItem>()
    var currentQuestion: ChatMessage? = null
    val answerBuilder = StringBuilder()

    fun flushCurrent() {
        val question = currentQuestion ?: return
        val content = question.content.trim().ifBlank { "[图片消息]" }
        val title = content.take(15)
        val answer = answerBuilder.toString().trim().ifBlank { null }

        items.add(
            ChatHistoryItem(
                id = question.id,
                title = title,
                question = content,
                answer = answer,
                createdAt = question.createdAt
            )
        )
    }

    messages.forEach { message ->
        if (message.role == "user") {
            if (currentQuestion != null) {
                flushCurrent()
                answerBuilder.setLength(0)
            }
            currentQuestion = message
        } else if (currentQuestion != null) {
            if (answerBuilder.isNotEmpty()) {
                answerBuilder.append("\n")
            }
            answerBuilder.append(message.content.trim())
        }
    }

    if (currentQuestion != null) {
        flushCurrent()
    }

    return items.asReversed()
}
