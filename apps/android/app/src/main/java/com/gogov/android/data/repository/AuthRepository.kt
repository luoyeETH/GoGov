package com.gogov.android.data.repository

import com.gogov.android.data.api.ApiClient
import com.gogov.android.data.local.TokenManager
import com.gogov.android.domain.model.*
import com.google.gson.GsonBuilder
import com.google.gson.JsonObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext

class AuthRepository(private val tokenManager: TokenManager) {

    val isLoggedIn: Flow<Boolean> = tokenManager.token.map { it != null }

    val currentToken: Flow<String?> = tokenManager.token

    private val gson = GsonBuilder()
        .setLenient()
        .create()

    suspend fun login(email: String, password: String): Result<User> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.login(LoginRequest(email, password)).execute()
            }
            val bodyText = response.body()?.string()?.trim()
            val errorText = response.errorBody()?.string()?.trim()
            if (response.isSuccessful) {
                if (bodyText.isNullOrBlank()) {
                    return Result.failure(Exception("服务器未返回登录信息"))
                }
                val body = parseAuthSession(bodyText)
                    ?: return Result.failure(
                        Exception(extractErrorMessage(bodyText, response.code(), response.headers()["Content-Type"]))
                    )
                if (body.sessionToken.isBlank()) {
                    return Result.failure(Exception("登录失败"))
                }
                tokenManager.saveToken(body.sessionToken)
                Result.success(body.toUser())
            } else {
                val error = if (!errorText.isNullOrBlank()) errorText else bodyText
                Result.failure(Exception(extractErrorMessage(error, response.code(), response.headers()["Content-Type"])))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getEmailChallenge(): Result<EmailChallengeResponse> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.getEmailChallenge().execute()
            }
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    Result.success(body)
                } else {
                    Result.failure(Exception("获取验证码失败"))
                }
            } else {
                val error = response.errorBody()?.string() ?: "请求失败"
                Result.failure(Exception(parseError(error)))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun requestEmailVerification(
        email: String,
        challengeId: String,
        answer: String
    ): Result<Unit> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.requestEmailVerification(
                    EmailRegisterRequest(email, challengeId, answer)
                ).execute()
            }
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                val error = response.errorBody()?.string() ?: "验证失败"
                Result.failure(Exception(parseError(error)))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun verifyEmail(token: String): Result<String> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.verifyEmail(EmailVerifyRequest(token)).execute()
            }
            if (response.isSuccessful) {
                val email = response.body()?.email ?: ""
                Result.success(email)
            } else {
                val error = response.errorBody()?.string() ?: "验证失败"
                Result.failure(Exception(parseError(error)))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun completeRegistration(
        username: String,
        password: String,
        verificationToken: String
    ): Result<User> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.completeRegistration(
                    RegisterCompleteRequest(
                        token = verificationToken,
                        username = username,
                        password = password
                    )
                ).execute()
            }
            if (response.isSuccessful) {
                val body = response.body()!!
                tokenManager.saveToken(body.sessionToken)
                Result.success(body.toUser())
            } else {
                val error = response.errorBody()?.string() ?: "注册失败"
                Result.failure(Exception(parseError(error)))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getCurrentUser(): Result<User> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.getMe().execute()
            }
            if (response.isSuccessful) {
                Result.success(response.body()!!.user)
            } else {
                if (response.code() == 401) {
                    tokenManager.clearToken()
                }
                val error = response.errorBody()?.string() ?: "获取用户信息失败"
                Result.failure(Exception(parseError(error)))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateProfile(request: ProfileUpdateRequest): Result<User> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.updateProfile(request).execute()
            }
            if (response.isSuccessful) {
                Result.success(response.body()!!.user)
            } else {
                val error = response.errorBody()?.string() ?: "更新失败"
                Result.failure(Exception(parseError(error)))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun logout(): Result<Unit> {
        return try {
            withContext(Dispatchers.IO) {
                ApiClient.api.logout().execute()
            }
            tokenManager.clearToken()
            Result.success(Unit)
        } catch (e: Exception) {
            tokenManager.clearToken()
            Result.success(Unit)
        }
    }

    private fun AuthSessionResponse.toUser(): User {
        return User(
            id = userId,
            email = email,
            username = username,
            gender = gender,
            age = age,
            examStartDate = examStartDate,
            walletAddress = walletAddress
        )
    }

    private fun parseAuthSession(raw: String): AuthSessionResponse? {
        return try {
            val trimmed = raw.trim()
            val normalized = if (trimmed.startsWith("\"") && trimmed.endsWith("\"") && trimmed.length >= 2) {
                trimmed.substring(1, trimmed.length - 1)
            } else {
                trimmed
            }
            if (!normalized.trim().startsWith("{")) return null
            gson.fromJson(normalized, AuthSessionResponse::class.java)
        } catch (e: Exception) {
            null
        }
    }

    private fun extractErrorMessage(raw: String?, statusCode: Int, contentType: String?): String {
        val trimmed = raw?.trim().orEmpty()
        if (trimmed.isBlank()) {
            return "登录失败（HTTP $statusCode）"
        }
        if (trimmed.startsWith("<")) {
            return "服务器返回非 JSON 响应（HTTP $statusCode）"
        }
        if (trimmed.startsWith("\"") && trimmed.endsWith("\"") && trimmed.length >= 2) {
            return trimmed.substring(1, trimmed.length - 1)
        }
        if (trimmed.startsWith("{")) {
            try {
                val json = gson.fromJson(trimmed, JsonObject::class.java)
                val error = json?.get("error")?.asString
                if (!error.isNullOrBlank()) {
                    return error
                }
            } catch (e: Exception) {
                // fall through
            }
        }
        val suffix = if (!contentType.isNullOrBlank()) "（$contentType）" else ""
        return trimmed.take(200) + suffix
    }

    private fun parseError(errorBody: String): String {
        return try {
            val trimmed = errorBody.trim()
            if (trimmed.startsWith("\"") && trimmed.endsWith("\"") && trimmed.length >= 2) {
                return trimmed.substring(1, trimmed.length - 1)
            }
            val regex = """"error"\s*:\s*"([^"]+)"""".toRegex()
            regex.find(trimmed)?.groupValues?.get(1) ?: trimmed
        } catch (e: Exception) {
            errorBody
        }
    }
}
