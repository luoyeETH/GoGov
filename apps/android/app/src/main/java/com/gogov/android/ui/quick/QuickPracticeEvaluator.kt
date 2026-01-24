package com.gogov.android.ui.quick

import com.gogov.android.domain.model.QuickPracticeCategory
import com.gogov.android.domain.model.QuickPracticeQuestion
import kotlin.math.abs
import kotlin.math.pow

data class QuickPracticeEvaluation(
    val correct: Boolean,
    val isNumeric: Boolean,
    val errorValue: Double? = null,
    val errorPercent: Double? = null,
    val isAnalysis: Boolean = false,
    val isPercentConversion: Boolean = false
)

object QuickPracticeEvaluator {
    private val repeatableCategories = setOf("percent-decimal", "percent-precision")
    private const val analysisTolerance = 0.02

    fun evaluate(
        question: QuickPracticeQuestion,
        userAnswer: String,
        category: QuickPracticeCategory?
    ): QuickPracticeEvaluation {
        val trimmed = userAnswer.trim()
        val answerText = question.answer.trim()
        val userValue = parseNumeric(trimmed)
        val answerValue = parseNumeric(answerText)
        val isAnalysis = (category?.group ?: "其他") == "资料分析专项"
        val isPercentConversion = repeatableCategories.contains(question.categoryId)

        if (userValue != null && answerValue != null) {
            val errorValue = userValue - answerValue
            val errorPercent = if (answerValue != 0.0) abs(errorValue) / abs(answerValue) else null
            var correct = abs(userValue - answerValue) <= 1e-6
            if (isPercentConversion && answerText.contains("%")) {
                correct = roundTo(userValue, 1) == roundTo(answerValue, 1)
            } else if (isAnalysis && !isPercentConversion) {
                correct = if (answerValue == 0.0) {
                    abs(userValue - answerValue) <= 1e-6
                } else {
                    errorPercent != null && errorPercent <= analysisTolerance
                }
            }
            return QuickPracticeEvaluation(
                correct = correct,
                isNumeric = true,
                errorValue = errorValue,
                errorPercent = errorPercent,
                isAnalysis = isAnalysis,
                isPercentConversion = isPercentConversion
            )
        }

        return QuickPracticeEvaluation(
            correct = trimmed == answerText,
            isNumeric = false,
            isAnalysis = isAnalysis,
            isPercentConversion = isPercentConversion
        )
    }

    fun parseNumeric(value: String): Double? {
        val cleaned = value.replace(Regex("[%\\s,]"), "")
        if (cleaned.isBlank()) return null
        val parsed = cleaned.toDoubleOrNull()
        return if (parsed != null && parsed.isFinite()) parsed else null
    }

    private fun roundTo(value: Double, digits: Int): Double {
        val factor = 10.0.pow(digits.toDouble())
        return kotlin.math.round(value * factor) / factor
    }
}
