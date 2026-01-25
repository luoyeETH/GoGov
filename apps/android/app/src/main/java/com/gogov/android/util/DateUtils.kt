package com.gogov.android.util

import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.util.Locale

object DateUtils {
    private val beijingZone = ZoneId.of("Asia/Shanghai")
    private val dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")

    fun getBeijingDateString(): String {
        return ZonedDateTime.now(beijingZone).format(dateFormatter)
    }

    fun getBeijingHour(): Int {
        return ZonedDateTime.now(beijingZone).hour
    }

    fun getGreetingLabel(): String {
        val hour = getBeijingHour()
        return when {
            hour in 5..10 -> "早上"
            hour in 11..12 -> "中午"
            hour in 13..17 -> "下午"
            else -> "晚上"
        }
    }

    fun daysUntil(dateLabel: String, todayLabel: String = getBeijingDateString()): Int? {
        return try {
            val target = LocalDate.parse(dateLabel, dateFormatter)
            val today = LocalDate.parse(todayLabel, dateFormatter)
            val diff = ChronoUnit.DAYS.between(today, target)
            if (diff < 0) 0 else diff.toInt()
        } catch (e: Exception) {
            null
        }
    }

    fun formatSeconds(seconds: Int): String {
        val mins = (seconds / 60).toString().padStart(2, '0')
        val secs = (seconds % 60).toString().padStart(2, '0')
        return "$mins:$secs"
    }

    fun formatMinutes(minutes: Int): String {
        return if (minutes >= 60) {
            val hours = minutes / 60
            val rest = minutes % 60
            "$hours 小时 $rest 分钟"
        } else {
            "$minutes 分钟"
        }
    }

    fun formatMinutes(minutes: Double): String {
        if (!minutes.isFinite()) return "--"
        return if (minutes >= 60) {
            val hours = minutes / 60.0
            String.format(Locale.CHINA, "%.1f 小时", hours)
        } else {
            String.format(Locale.CHINA, "%.1f 分钟", minutes)
        }
    }

    fun parseIsoDateTime(isoString: String): ZonedDateTime? {
        return try {
            Instant.parse(isoString).atZone(beijingZone)
        } catch (e: Exception) {
            null
        }
    }
}
