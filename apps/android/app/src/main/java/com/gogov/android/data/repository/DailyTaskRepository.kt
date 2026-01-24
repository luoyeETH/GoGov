package com.gogov.android.data.repository

import com.gogov.android.data.api.ApiClient
import com.gogov.android.domain.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class DailyTaskRepository {

    suspend fun getDailyTask(date: String): Result<DailyTaskRecord?> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.getDailyTask(date).execute()
            }
            if (response.isSuccessful) {
                Result.success(response.body()?.task)
            } else {
                Result.failure(Exception(parseError(response.errorBody()?.string())))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun generateDailyTask(
        date: String,
        adjustNote: String? = null,
        existingTasks: List<TaskItem>? = null,
        auto: Boolean = false
    ): Result<DailyTaskRecord?> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.generateDailyTask(
                    DailyTaskGenerateRequest(date, adjustNote, existingTasks, auto)
                ).execute()
            }
            if (response.isSuccessful) {
                Result.success(response.body()?.task)
            } else {
                Result.failure(Exception(parseError(response.errorBody()?.string())))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateDailyTask(id: String, tasks: List<TaskItem>): Result<DailyTaskRecord?> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.updateDailyTask(id, DailyTaskUpdateRequest(tasks)).execute()
            }
            if (response.isSuccessful) {
                Result.success(response.body()?.task)
            } else {
                Result.failure(Exception(parseError(response.errorBody()?.string())))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun breakdownTask(task: String, context: String): Result<List<String>> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.breakdownTask(TaskBreakdownRequest(task, context)).execute()
            }
            if (response.isSuccessful) {
                Result.success(response.body()?.subtasks ?: emptyList())
            } else {
                Result.failure(Exception(parseError(response.errorBody()?.string())))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getHistory(days: Int, date: String): Result<List<DailyTaskRecord>> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.getDailyTaskHistory(days, date).execute()
            }
            if (response.isSuccessful) {
                Result.success(response.body()?.tasks ?: emptyList())
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
