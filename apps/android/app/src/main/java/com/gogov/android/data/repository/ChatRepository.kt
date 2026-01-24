package com.gogov.android.data.repository

import com.gogov.android.data.api.ApiClient
import com.gogov.android.domain.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ChatRepository {

    suspend fun getHistory(mode: ChatMode? = null): Result<List<ChatMessage>> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.getChatHistory(mode?.value).execute()
            }
            if (response.isSuccessful) {
                Result.success(response.body()?.messages ?: emptyList())
            } else {
                Result.failure(Exception(parseError(response.errorBody()?.string())))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun sendMessage(message: String, mode: ChatMode): Result<List<ChatMessage>> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.sendChat(ChatRequest(message, mode.value)).execute()
            }
            if (response.isSuccessful) {
                Result.success(response.body()?.messages ?: emptyList())
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
