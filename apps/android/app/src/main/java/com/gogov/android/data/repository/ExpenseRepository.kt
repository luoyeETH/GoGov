package com.gogov.android.data.repository

import com.gogov.android.data.api.ApiClient
import com.gogov.android.domain.model.ExpenseCreateRequest
import com.gogov.android.domain.model.ExpenseCreateResponse
import com.gogov.android.domain.model.ExpenseOverviewResponse
import com.gogov.android.domain.model.ExpenseParseRequest
import com.gogov.android.domain.model.ExpenseParseResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ExpenseRepository {

    suspend fun parseExpense(text: String): Result<ExpenseParseResponse> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.parseExpense(ExpenseParseRequest(text)).execute()
            }
            if (response.isSuccessful) {
                Result.success(response.body() ?: ExpenseParseResponse())
            } else {
                Result.failure(Exception(parseError(response.errorBody()?.string())))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun saveExpenses(request: ExpenseCreateRequest): Result<ExpenseCreateResponse> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.createExpenses(request).execute()
            }
            if (response.isSuccessful) {
                Result.success(response.body() ?: ExpenseCreateResponse())
            } else {
                Result.failure(Exception(parseError(response.errorBody()?.string())))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getOverview(range: String = "month"): Result<ExpenseOverviewResponse> {
        return try {
            val response = withContext(Dispatchers.IO) {
                ApiClient.api.getExpenseOverview(range).execute()
            }
            if (response.isSuccessful) {
                Result.success(response.body() ?: ExpenseOverviewResponse())
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
