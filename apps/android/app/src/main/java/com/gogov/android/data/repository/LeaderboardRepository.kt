package com.gogov.android.data.repository

import com.gogov.android.data.api.ApiClient
import com.gogov.android.domain.model.LeaderboardResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class LeaderboardRepository {

    suspend fun getLeaderboard(period: String): Result<LeaderboardResponse> = withContext(Dispatchers.IO) {
        try {
            val response = ApiClient.api.getLeaderboard(period).execute()
            if (response.isSuccessful) {
                response.body()?.let { data ->
                    Result.success(data)
                } ?: Result.failure(Exception("空响应"))
            } else {
                val errorMsg = response.errorBody()?.string() ?: "获取排行榜失败"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
