package com.gogov.android.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class LeaderboardResponse(
    val period: String,
    val periodLabel: String,
    val rankings: List<LeaderboardRanking>,
    val myRanking: LeaderboardMyRanking? = null
)

@Serializable
data class LeaderboardRanking(
    val rank: Int,
    val userId: String,
    val username: String? = null,
    val totalSeconds: Int,
    val formattedDuration: String
)

@Serializable
data class LeaderboardMyRanking(
    val rank: Int,
    val totalSeconds: Int,
    val formattedDuration: String
)

enum class LeaderboardPeriod(val value: String, val label: String) {
    DAY("day", "日榜"),
    WEEK("week", "周榜"),
    MONTH("month", "月榜")
}
