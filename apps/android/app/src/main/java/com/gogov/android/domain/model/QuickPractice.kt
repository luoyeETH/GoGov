package com.gogov.android.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class QuickPracticeCategory(
    val id: String,
    val name: String,
    val group: String? = null,
    val description: String
)

@Serializable
data class QuickPracticeQuestion(
    val id: String,
    val categoryId: String,
    val prompt: String,
    val answer: String,
    val choices: List<String>? = null,
    val explanation: String? = null,
    val shortcut: String? = null
)

@Serializable
data class QuickPracticeCategoriesResponse(
    val categories: List<QuickPracticeCategory>
)

@Serializable
data class QuickPracticeBatchResponse(
    val questions: List<QuickPracticeQuestion>
)

@Serializable
data class QuickPracticeSessionRecord(
    val id: String? = null,
    val prompt: String,
    val answer: String,
    val userAnswer: String,
    val choices: List<String>? = null,
    val explanation: String? = null,
    val correct: Boolean
)

@Serializable
data class QuickPracticeSessionRequest(
    val categoryId: String,
    val mode: String,
    val startedAt: String,
    val endedAt: String,
    val questions: List<QuickPracticeSessionRecord>
)
