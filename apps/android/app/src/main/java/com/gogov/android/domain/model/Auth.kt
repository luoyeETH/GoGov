package com.gogov.android.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class User(
    val id: String,
    val email: String? = null,
    val username: String? = null,
    val gender: String? = null,
    val age: Int? = null,
    val examStartDate: String? = null,
    val aiProvider: String? = null,
    val aiModel: String? = null,
    val aiBaseUrl: String? = null,
    val aiApiKeyConfigured: Boolean = false,
    val walletAddress: String? = null,
    val hasPassword: Boolean? = null,
    val reminderHour: Int? = null,
    val reminderMinute: Int? = null,
    val freeAi: FreeAiStatus? = null
)

@Serializable
data class AuthSessionResponse(
    val userId: String,
    val email: String? = null,
    val username: String? = null,
    val gender: String? = null,
    val age: Int? = null,
    val examStartDate: String? = null,
    val walletAddress: String? = null,
    val sessionToken: String,
    val sessionExpiresAt: String? = null
)

@Serializable
data class AuthMeResponse(
    val user: User,
    val sessionExpiresAt: String? = null
)

@Serializable
data class FreeAiStatus(
    val dailyLimit: Int? = null,
    val remaining: Int? = null
)

@Serializable
data class LoginRequest(
    val email: String,
    val password: String
)

@Serializable
data class RegisterCompleteRequest(
    val token: String,
    val username: String,
    val password: String,
    val gender: String? = null,
    val age: Int? = null,
    val examStartDate: String? = null
)

@Serializable
data class EmailChallengeResponse(
    val id: String,
    val question: String
)

@Serializable
data class EmailRegisterRequest(
    val email: String,
    val challengeId: String,
    val answer: String
)

@Serializable
data class EmailRegisterResponse(
    val status: String
)

@Serializable
data class EmailVerifyRequest(
    val token: String
)

@Serializable
data class EmailVerifyResponse(
    val email: String
)

@Serializable
data class LogoutResponse(
    val status: String? = null
)

@Serializable
data class IdResponse(
    val id: String
)

@Serializable
data class ProfileUpdateRequest(
    val username: String? = null,
    val gender: String? = null,
    val age: Int? = null,
    val examStartDate: String? = null,
    val aiProvider: String? = null,
    val aiModel: String? = null,
    val aiBaseUrl: String? = null,
    val aiApiKey: String? = null,
    val reminderHour: Int? = null,
    val reminderMinute: Int? = null
)

@Serializable
data class ProfileUpdateResponse(
    val user: User
)

@Serializable
data class PasswordUpdateRequest(
    val oldPassword: String,
    val newPassword: String
)

@Serializable
data class PasswordUpdateResponse(
    val status: String
)

@Serializable
data class StudyPlanProfile(
    val id: String,
    val prepStartDate: String? = null,
    val totalStudyHours: Int? = null,
    val totalStudyDurationText: String? = null,
    val currentProgress: String? = null,
    val targetExam: String? = null,
    val targetExamDate: String? = null,
    val plannedMaterials: String? = null,
    val interviewExperience: Boolean? = null,
    val learningGoals: String? = null,
    val notes: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

@Serializable
data class StudyPlanProfileResponse(
    val profile: StudyPlanProfile? = null
)

@Serializable
data class StudyPlanProfileUpdateRequest(
    val prepStartDate: String? = null,
    val totalStudyDuration: String? = null,
    val currentProgress: String? = null,
    val targetExam: String? = null,
    val targetExamDate: String? = null,
    val studyResources: String? = null,
    val interviewExperience: Boolean? = null,
    val notes: String? = null
)
