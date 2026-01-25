package com.gogov.android.data.repository

import com.gogov.android.data.api.ApiClient
import com.gogov.android.domain.model.MockAnalysisRequest
import com.gogov.android.domain.model.MockAnalysisResponse
import com.gogov.android.domain.model.MockHistoryRecord
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class MockRepository {

    suspend fun analyze(request: MockAnalysisRequest): Result<MockAnalysisResponse> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.analyzeMock(request).execute()
            }
            if (response.isSuccessful) {
                Result.success(response.body() ?: MockAnalysisResponse())
            } else {
                Result.failure(Exception(parseError(response.errorBody()?.string())))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getHistory(limit: Int = 20): Result<List<MockHistoryRecord>> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.getMockReports(limit).execute()
            }
            if (response.isSuccessful) {
                Result.success(response.body()?.history ?: emptyList())
            } else {
                Result.failure(Exception(parseError(response.errorBody()?.string())))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteHistory(id: String): Result<Unit> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.deleteMockReport(id).execute()
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
