package com.gogov.android.ui.chat

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gogov.android.data.repository.ChatRepository
import com.gogov.android.domain.model.ChatMessage
import com.gogov.android.domain.model.ChatHistoryScope
import com.gogov.android.domain.model.ChatMode
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream

data class ChatUiState(
    val messages: List<ChatMessage> = emptyList(),
    val mode: ChatMode = ChatMode.TUTOR,
    val isLoading: Boolean = false,
    val isSending: Boolean = false,
    val error: String? = null,
    val inputText: String = "",
    val selectedImageUri: android.net.Uri? = null,
    val selectedImageDataUrl: String? = null
)

class ChatViewModel(private val repository: ChatRepository) : ViewModel() {

    private val _state = MutableStateFlow(ChatUiState())
    val state: StateFlow<ChatUiState> = _state.asStateFlow()
    private val imageCache = object : LinkedHashMap<String, String>(16, 0.75f, true) {
        override fun removeEldestEntry(eldest: MutableMap.MutableEntry<String, String>?): Boolean {
            return size > 20
        }
    }

    fun loadHistory() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            repository.getHistory(_state.value.mode).fold(
                onSuccess = { messages ->
                    val ordered = normalizeMessages(messages)
                    _state.update {
                        it.copy(
                            messages = withCachedImages(ordered),
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

    fun loadConversation(userMessageId: String) {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            repository.getHistory(_state.value.mode, ChatHistoryScope.HISTORY).fold(
                onSuccess = { messages ->
                    val ordered = normalizeMessages(messages)
                    val conversation = extractConversation(ordered, userMessageId)
                    _state.update {
                        it.copy(
                            messages = withCachedImages(conversation),
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

    fun setMode(mode: ChatMode) {
        if (_state.value.mode == mode) return

        _state.update { it.copy(mode = mode, messages = emptyList()) }
        loadHistory()
    }

    fun setInputText(text: String) {
        _state.update { it.copy(inputText = text, error = null) }
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

    private fun uriToDataUrl(uri: Uri, context: Context): String {
        val bitmap = context.contentResolver.openInputStream(uri)?.use { stream ->
            BitmapFactory.decodeStream(stream)
        } ?: throw Exception("无法读取图片或图片格式不支持")

        // 压缩图片以减小尺寸
        val maxSize = 1024
        val ratio = Math.min(
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

    fun sendMessage() {
        val content = _state.value.inputText.trim()
        val selectedImageUri = _state.value.selectedImageUri
        val imageDataUrl = _state.value.selectedImageDataUrl

        if (content.isBlank() && imageDataUrl == null) {
            _state.update { it.copy(error = "请输入内容或选择图片。") }
            return
        }

        if (content.length > 2000) {
            _state.update { it.copy(error = "内容过长（最多 2000 字）。") }
            return
        }

        // 如果有图片但没有文字，使用简短的默认提示
        val messageContent = if (imageDataUrl != null && content.isBlank()) {
            "请看图"
        } else {
            content
        }

        val pendingMessage = ChatMessage(
            id = "pending-${System.currentTimeMillis()}",
            role = "user",
            content = messageContent,
            createdAt = java.time.Instant.now().toString(),
            imageUrl = imageDataUrl
        )

        _state.update {
            it.copy(
                messages = it.messages + pendingMessage,
                inputText = "",
                selectedImageUri = null,
                selectedImageDataUrl = null,
                isSending = true,
                error = null
            )
        }

        viewModelScope.launch {
            repository.sendMessage(messageContent, _state.value.mode, imageDataUrl).fold(
                onSuccess = { newMessages ->
                    _state.update { state ->
                        val withoutPending = state.messages.filter { it.id != pendingMessage.id }
                        val withImage = attachImageToResponse(newMessages, imageDataUrl)
                        val ordered = normalizeMessages(withoutPending + withImage)
                        state.copy(
                            messages = withCachedImages(ordered),
                            isSending = false
                        )
                    }
                },
                onFailure = { error ->
                    _state.update { state ->
                        state.copy(
                            inputText = content,
                            selectedImageUri = selectedImageUri,
                            selectedImageDataUrl = imageDataUrl,
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

    private fun attachImageToResponse(
        messages: List<ChatMessage>,
        imageDataUrl: String?
    ): List<ChatMessage> {
        if (imageDataUrl.isNullOrBlank()) {
            return messages
        }

        val userMessage = messages.lastOrNull { it.role == "user" } ?: return messages
        imageCache[userMessage.id] = imageDataUrl
        return messages.map { message ->
            if (message.id == userMessage.id) message.copy(imageUrl = imageDataUrl) else message
        }
    }

    private fun withCachedImages(messages: List<ChatMessage>): List<ChatMessage> {
        return messages.map { message ->
            val cached = imageCache[message.id]
            val imageUrl = message.imageUrl ?: cached
            if (imageUrl != null && message.imageUrl == null) {
                message.copy(imageUrl = imageUrl)
            } else {
                if (message.imageUrl != null) {
                    imageCache[message.id] = message.imageUrl
                }
                message
            }
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

    private fun extractConversation(
        messages: List<ChatMessage>,
        userMessageId: String
    ): List<ChatMessage> {
        if (messages.isEmpty()) return emptyList()
        val startIndex = messages.indexOfFirst { it.id == userMessageId }
        if (startIndex == -1) return messages

        val slice = mutableListOf<ChatMessage>()
        slice.add(messages[startIndex])
        var index = startIndex + 1
        while (index < messages.size) {
            val message = messages[index]
            if (message.role == "user") break
            slice.add(message)
            index += 1
        }
        return slice
    }
}
