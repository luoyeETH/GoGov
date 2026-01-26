package com.gogov.android.data.api

import com.gogov.android.domain.model.*
import com.google.gson.JsonObject
import okhttp3.ResponseBody
import retrofit2.Call
import retrofit2.http.*

interface GoGovApi {

    // Auth
    @POST("auth/login")
    fun login(@Body request: LoginRequest): Call<ResponseBody>

    @GET("auth/email/challenge")
    fun getEmailChallenge(): Call<EmailChallengeResponse>

    @POST("auth/email/register/request")
    fun requestEmailVerification(@Body request: EmailRegisterRequest): Call<EmailRegisterResponse>

    @POST("auth/email/register/verify")
    fun verifyEmail(@Body request: EmailVerifyRequest): Call<EmailVerifyResponse>

    @POST("auth/register/complete")
    fun completeRegistration(@Body request: RegisterCompleteRequest): Call<AuthSessionResponse>

    @GET("auth/me")
    fun getMe(): Call<AuthMeResponse>

    @POST("auth/logout")
    fun logout(): Call<LogoutResponse>

    @POST("profile")
    fun updateProfile(@Body request: JsonObject): Call<ProfileUpdateResponse>

    @POST("auth/password/update")
    fun updatePassword(@Body request: PasswordUpdateRequest): Call<PasswordUpdateResponse>

    // Study Plan Profile
    @GET("study-plan/profile")
    fun getStudyPlanProfile(): Call<StudyPlanProfileResponse>

    @PUT("study-plan/profile")
    fun updateStudyPlanProfile(@Body request: StudyPlanProfileUpdateRequest): Call<StudyPlanProfileResponse>

    // Pomodoro
    @GET("pomodoro/subjects")
    fun getSubjects(): Call<PomodoroSubjectsResponse>

    @POST("pomodoro/subjects")
    fun createSubject(@Body request: PomodoroSubjectCreateRequest): Call<PomodoroSubject>

    @DELETE("pomodoro/subjects/{id}")
    fun deleteSubject(@Path("id") id: String): Call<IdResponse>

    @POST("pomodoro/start")
    fun startPomodoro(@Body request: PomodoroStartRequest): Call<PomodoroSession>

    @POST("pomodoro/{id}/finish")
    fun finishPomodoro(
        @Path("id") id: String,
        @Body request: PomodoroFinishRequest
    ): Call<PomodoroFinishResponse>

    @GET("pomodoro/insights")
    fun getInsights(@Query("days") days: Int = 84): Call<PomodoroInsights>

    // AI Chat
    @GET("ai/chat/history")
    fun getChatHistory(
        @Query("mode") mode: String? = null,
        @Query("scope") scope: String? = null
    ): Call<ChatHistoryResponse>

    @POST("ai/chat")
    fun sendChat(@Body request: ChatRequest): Call<ChatResponse>

    // Mock Analysis
    @POST("ai/mock/analysis")
    fun analyzeMock(@Body request: MockAnalysisRequest): Call<MockAnalysisResponse>

    @GET("mock/reports")
    fun getMockReports(@Query("limit") limit: Int = 20): Call<MockHistoryResponse>

    @DELETE("mock/reports/{id}")
    fun deleteMockReport(@Path("id") id: String): Call<ResponseBody>

    // Daily Tasks
    @GET("study-plan/daily")
    fun getDailyTask(@Query("date") date: String): Call<DailyTaskResponse>

    @POST("ai/study-plan/daily")
    fun generateDailyTask(@Body request: DailyTaskGenerateRequest): Call<DailyTaskResponse>

    @PATCH("study-plan/daily/{id}")
    fun updateDailyTask(
        @Path("id") id: String,
        @Body request: DailyTaskUpdateRequest
    ): Call<DailyTaskResponse>

    @POST("ai/study-plan/task-breakdown")
    fun breakdownTask(@Body request: TaskBreakdownRequest): Call<TaskBreakdownResponse>

    @GET("study-plan/daily/history")
    fun getDailyTaskHistory(
        @Query("days") days: Int,
        @Query("date") date: String
    ): Call<DailyTaskHistoryResponse>

    // Quick Practice
    @GET("practice/quick/categories")
    fun getQuickCategories(): Call<QuickPracticeCategoriesResponse>

    @GET("practice/quick/batch")
    fun getQuickBatch(
        @Query("category") categoryId: String,
        @Query("count") count: Int
    ): Call<QuickPracticeBatchResponse>

    @POST("practice/quick/session")
    fun submitQuickSession(@Body request: QuickPracticeSessionRequest): Call<ResponseBody>

    // Expense Ledger
    @POST("expenses/parse")
    fun parseExpense(@Body request: ExpenseParseRequest): Call<ExpenseParseResponse>

    @POST("expenses")
    fun createExpenses(@Body request: ExpenseCreateRequest): Call<ExpenseCreateResponse>

    @GET("expenses/overview")
    fun getExpenseOverview(@Query("range") range: String = "month"): Call<ExpenseOverviewResponse>
}
