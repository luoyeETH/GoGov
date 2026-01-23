package com.gogov.android.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class User(
    val id: String,
    val email: String,
    val username: String? = null,
    val gender: String? = null,
    val age: Int? = null,
    val examStartDate: String? = null,
    val aiProvider: String? = null,
    val aiModel: String? = null,
    val aiBaseUrl: String? = null,
    val aiApiKeyConfigured: Boolean = false
)

@Serializable
data class AuthResponse(
    val user: User,
    val token: String,
    val sessionExpiresAt: String? = null
)

@Serializable
data class AuthMeResponse(
    val user: User,
    val sessionExpiresAt: String? = null
)

@Serializable
data class LoginRequest(
    val email: String,
    val password: String
)

@Serializable
data class RegisterRequest(
    val email: String,
    val password: String,
    val verificationToken: String
)

@Serializable
data class EmailVerificationRequest(
    val email: String
)

@Serializable
data class EmailVerificationResponse(
    val status: String
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
    val aiApiKey: String? = null
)

@Serializable
data class ProfileUpdateResponse(
    val user: User
)
