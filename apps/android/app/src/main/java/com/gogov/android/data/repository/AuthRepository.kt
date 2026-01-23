package com.gogov.android.data.repository

import com.gogov.android.data.api.ApiClient
import com.gogov.android.data.local.TokenManager
import com.gogov.android.domain.model.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

class AuthRepository(private val tokenManager: TokenManager) {

    val isLoggedIn: Flow<Boolean> = tokenManager.token.map { it != null }

    val currentToken: Flow<String?> = tokenManager.token

    suspend fun login(email: String, password: String): Result<User> {
        return try {
            val response = ApiClient.api.login(LoginRequest(email, password))
            if (response.isSuccessful) {
                val body = response.body()!!
                tokenManager.saveToken(body.token)
                Result.success(body.user)
            } else {
                val error = response.errorBody()?.string() ?: "Login failed"
                Result.failure(Exception(parseError(error)))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun requestEmailVerification(email: String): Result<Unit> {
        return try {
            val response = ApiClient.api.requestEmailVerification(EmailVerificationRequest(email))
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                val error = response.errorBody()?.string() ?: "Request failed"
                Result.failure(Exception(parseError(error)))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun verifyEmail(email: String, code: String): Result<String> {
        return try {
            val response = ApiClient.api.verifyEmail(mapOf("email" to email, "code" to code))
            if (response.isSuccessful) {
                val token = response.body()?.get("verificationToken") ?: ""
                Result.success(token)
            } else {
                val error = response.errorBody()?.string() ?: "Verification failed"
                Result.failure(Exception(parseError(error)))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun completeRegistration(email: String, password: String, verificationToken: String): Result<User> {
        return try {
            val response = ApiClient.api.completeRegistration(
                RegisterRequest(email, password, verificationToken)
            )
            if (response.isSuccessful) {
                val body = response.body()!!
                tokenManager.saveToken(body.token)
                Result.success(body.user)
            } else {
                val error = response.errorBody()?.string() ?: "Registration failed"
                Result.failure(Exception(parseError(error)))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getCurrentUser(): Result<User> {
        return try {
            val response = ApiClient.api.getMe()
            if (response.isSuccessful) {
                Result.success(response.body()!!.user)
            } else {
                if (response.code() == 401) {
                    tokenManager.clearToken()
                }
                val error = response.errorBody()?.string() ?: "Failed to get user"
                Result.failure(Exception(parseError(error)))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateProfile(request: ProfileUpdateRequest): Result<User> {
        return try {
            val response = ApiClient.api.updateProfile(request)
            if (response.isSuccessful) {
                Result.success(response.body()!!.user)
            } else {
                val error = response.errorBody()?.string() ?: "Update failed"
                Result.failure(Exception(parseError(error)))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun logout(): Result<Unit> {
        return try {
            ApiClient.api.logout()
            tokenManager.clearToken()
            Result.success(Unit)
        } catch (e: Exception) {
            tokenManager.clearToken()
            Result.success(Unit)
        }
    }

    private fun parseError(errorBody: String): String {
        return try {
            val regex = """"error"\s*:\s*"([^"]+)"""".toRegex()
            regex.find(errorBody)?.groupValues?.get(1) ?: errorBody
        } catch (e: Exception) {
            errorBody
        }
    }
}
