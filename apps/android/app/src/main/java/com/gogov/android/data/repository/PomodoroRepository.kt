package com.gogov.android.data.repository

import com.gogov.android.data.api.ApiClient
import com.gogov.android.domain.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class PomodoroRepository {

    suspend fun getSubjects(): Result<List<PomodoroSubject>> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.getSubjects().execute()
            }
            if (response.isSuccessful) {
                Result.success(response.body()?.subjects ?: emptyList())
            } else {
                Result.failure(Exception(parseError(response.errorBody()?.string())))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createSubject(name: String): Result<PomodoroSubject> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.createSubject(PomodoroSubjectCreateRequest(name)).execute()
            }
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(parseError(response.errorBody()?.string())))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteSubject(id: String): Result<Unit> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.deleteSubject(id).execute()
            }
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(parseError(response.errorBody()?.string())))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun startSession(subject: String, plannedMinutes: Int): Result<PomodoroSession> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.startPomodoro(PomodoroStartRequest(subject, plannedMinutes)).execute()
            }
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(parseError(response.errorBody()?.string())))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun finishSession(
        sessionId: String,
        status: String,
        durationSeconds: Int,
        pauseSeconds: Int,
        pauseCount: Int,
        failureReason: String? = null
    ): Result<PomodoroFinishResponse> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.finishPomodoro(
                    sessionId,
                    PomodoroFinishRequest(status, durationSeconds, pauseSeconds, pauseCount, failureReason)
                ).execute()
            }
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(parseError(response.errorBody()?.string())))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getInsights(days: Int = 84): Result<PomodoroInsights> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.getInsights(days).execute()
            }
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(parseError(response.errorBody()?.string())))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun parseError(errorBody: String?): String {
        if (errorBody == null) return "未知错误"
        return try {
            val regex = """"error"\s*:\s*"([^"]+)"""".toRegex()
            regex.find(errorBody)?.groupValues?.get(1) ?: errorBody
        } catch (e: Exception) {
            errorBody
        }
    }
}
