package com.gogov.android.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class ChatMessage(
    val id: String,
    val role: String,
    val content: String,
    val createdAt: String,
    val imageUrl: String? = null
)

@Serializable
data class ChatHistoryResponse(
    val messages: List<ChatMessage>
)

@Serializable
data class ChatRequest(
    val message: String,
    val mode: String,
    val imageDataUrl: String? = null
)

@Serializable
data class ChatResponse(
    val answer: String? = null,
    val messages: List<ChatMessage>? = null,
    val model: String? = null,
    val usage: Int? = null
)

enum class ChatMode(val value: String) {
    PLANNER("planner"),
    TUTOR("tutor")
}

enum class ChatHistoryScope(val value: String) {
    HISTORY("history")
}
