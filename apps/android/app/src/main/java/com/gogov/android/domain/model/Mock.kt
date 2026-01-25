package com.gogov.android.domain.model

data class MockMetricInput(
    val subject: String? = null,
    val correct: Int? = null,
    val total: Int? = null,
    val timeMinutes: Double? = null
)

data class MockAnalysisRequest(
    val images: List<String>? = null,
    val metrics: List<MockMetricInput>? = null,
    val history: List<MockHistoryInput>? = null,
    val title: String? = null,
    val note: String? = null
)

data class MockHistoryInput(
    val date: String? = null,
    val metrics: List<MockMetricInput>? = null,
    val overallAccuracy: Double? = null,
    val timeTotalMinutes: Double? = null
)

data class MockAnalysisResponse(
    val summary: String? = null,
    val details: List<String>? = null,
    val speedFocus: List<String>? = null,
    val practiceFocus: List<String>? = null,
    val targets: List<String>? = null,
    val nextWeekPlan: List<String>? = null,
    val metrics: List<MockMetricInput>? = null,
    val overall: MockOverall? = null,
    val model: String? = null,
    val raw: String? = null,
    val historyId: String? = null
)

data class MockOverall(
    val accuracy: Double? = null,
    val timeTotalMinutes: Double? = null
)

data class MockHistoryResponse(
    val history: List<MockHistoryRecord> = emptyList()
)

data class MockHistoryRecord(
    val id: String,
    val title: String,
    val note: String? = null,
    val metrics: List<MockMetricInput> = emptyList(),
    val analysis: MockAnalysisPayload? = null,
    val analysisRaw: String? = null,
    val overallAccuracy: Double? = null,
    val timeTotalMinutes: Double? = null,
    val createdAt: String
)

data class MockAnalysisPayload(
    val summary: String? = null,
    val details: List<String>? = null,
    val speedFocus: List<String>? = null,
    val practiceFocus: List<String>? = null,
    val targets: List<String>? = null,
    val nextWeekPlan: List<String>? = null
)
