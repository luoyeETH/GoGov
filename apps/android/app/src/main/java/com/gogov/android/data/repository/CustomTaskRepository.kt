package com.gogov.android.data.repository

import com.gogov.android.data.api.ApiClient
import com.gogov.android.domain.model.CustomTaskCreateRequest
import com.gogov.android.domain.model.CustomTasksResponse
import com.gogov.android.domain.model.CustomTaskOccurrenceRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class CustomTaskRepository {

    suspend fun getCustomTasks(date: String): Result<CustomTasksResponse> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.getCustomTasks(date).execute()
            }
            if (response.isSuccessful) {
                Result.success(response.body() ?: CustomTasksResponse(date = date))
            } else {
                Result.failure(Exception(parseError(response.errorBody()?.string())))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createCustomTask(request: CustomTaskCreateRequest): Result<Unit> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.createCustomTask(request).execute()
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

    suspend fun completeTask(taskId: String, date: String): Result<Unit> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.completeCustomTask(taskId, CustomTaskOccurrenceRequest(date)).execute()
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

    suspend fun uncompleteTask(taskId: String, date: String): Result<Unit> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.uncompleteCustomTask(taskId, CustomTaskOccurrenceRequest(date)).execute()
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

    suspend fun deleteTask(taskId: String): Result<Unit> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.deleteCustomTask(taskId).execute()
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
