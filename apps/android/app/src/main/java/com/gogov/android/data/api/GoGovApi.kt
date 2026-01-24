package com.gogov.android.data.api

import com.gogov.android.domain.model.*
import retrofit2.Response
import retrofit2.http.*

interface GoGovApi {

    // Auth
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthSessionResponse>

    @GET("auth/email/challenge")
    suspend fun getEmailChallenge(): Response<EmailChallengeResponse>

    @POST("auth/email/register/request")
    suspend fun requestEmailVerification(@Body request: EmailRegisterRequest): Response<EmailRegisterResponse>

    @POST("auth/email/register/verify")
    suspend fun verifyEmail(@Body request: EmailVerifyRequest): Response<EmailVerifyResponse>

    @POST("auth/register/complete")
    suspend fun completeRegistration(@Body request: RegisterCompleteRequest): Response<AuthSessionResponse>

    @GET("auth/me")
    suspend fun getMe(): Response<AuthMeResponse>

    @POST("auth/logout")
    suspend fun logout(): Response<LogoutResponse>

    @POST("profile")
    suspend fun updateProfile(@Body request: ProfileUpdateRequest): Response<ProfileUpdateResponse>

    // Pomodoro
    @GET("pomodoro/subjects")
    suspend fun getSubjects(): Response<PomodoroSubjectsResponse>

    @POST("pomodoro/subjects")
    suspend fun createSubject(@Body request: PomodoroSubjectCreateRequest): Response<PomodoroSubject>

    @DELETE("pomodoro/subjects/{id}")
    suspend fun deleteSubject(@Path("id") id: String): Response<IdResponse>

    @POST("pomodoro/start")
    suspend fun startPomodoro(@Body request: PomodoroStartRequest): Response<PomodoroSession>

    @POST("pomodoro/{id}/finish")
    suspend fun finishPomodoro(
        @Path("id") id: String,
        @Body request: PomodoroFinishRequest
    ): Response<PomodoroFinishResponse>

    @GET("pomodoro/insights")
    suspend fun getInsights(@Query("days") days: Int = 84): Response<PomodoroInsights>

    // AI Chat
    @GET("ai/chat/history")
    suspend fun getChatHistory(@Query("mode") mode: String? = null): Response<ChatHistoryResponse>

    @POST("ai/chat")
    suspend fun sendChat(@Body request: ChatRequest): Response<ChatResponse>

    // Daily Tasks
    @GET("study-plan/daily")
    suspend fun getDailyTask(@Query("date") date: String): Response<DailyTaskResponse>

    @POST("ai/study-plan/daily")
    suspend fun generateDailyTask(@Body request: DailyTaskGenerateRequest): Response<DailyTaskResponse>

    @PATCH("study-plan/daily/{id}")
    suspend fun updateDailyTask(
        @Path("id") id: String,
        @Body request: DailyTaskUpdateRequest
    ): Response<DailyTaskResponse>

    @POST("ai/study-plan/task-breakdown")
    suspend fun breakdownTask(@Body request: TaskBreakdownRequest): Response<TaskBreakdownResponse>

    @GET("study-plan/daily/history")
    suspend fun getDailyTaskHistory(
        @Query("days") days: Int,
        @Query("date") date: String
    ): Response<DailyTaskHistoryResponse>
}
