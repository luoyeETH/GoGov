package com.gogov.android.data.repository

import com.gogov.android.data.api.ApiClient
import com.gogov.android.domain.model.QuickPracticeBatchResponse
import com.gogov.android.domain.model.QuickPracticeCategoriesResponse
import com.gogov.android.domain.model.QuickPracticeCategory
import com.gogov.android.domain.model.QuickPracticeQuestion
import com.gogov.android.domain.model.QuickPracticeSessionRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class QuickPracticeRepository {

    suspend fun loadCategories(): Result<List<QuickPracticeCategory>> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.getQuickCategories().execute()
            }
            if (response.isSuccessful) {
                val body = response.body() ?: QuickPracticeCategoriesResponse(emptyList())
                Result.success(body.categories)
            } else {
                Result.failure(Exception(parseError(response.errorBody()?.string())))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun fetchBatch(categoryId: String, count: Int): Result<List<QuickPracticeQuestion>> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.getQuickBatch(categoryId, count).execute()
            }
            if (response.isSuccessful) {
                val body = response.body() ?: QuickPracticeBatchResponse(emptyList())
                Result.success(body.questions)
            } else {
                Result.failure(Exception(parseError(response.errorBody()?.string())))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun submitSession(request: QuickPracticeSessionRequest): Result<Unit> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.submitQuickSession(request).execute()
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
