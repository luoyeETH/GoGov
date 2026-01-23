package com.gogov.android.util

import java.time.Instant
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter

object DateUtils {
    private val beijingZone = ZoneId.of("Asia/Shanghai")
    private val dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")

    fun getBeijingDateString(): String {
        return ZonedDateTime.now(beijingZone).format(dateFormatter)
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

    fun parseIsoDateTime(isoString: String): ZonedDateTime? {
        return try {
            Instant.parse(isoString).atZone(beijingZone)
        } catch (e: Exception) {
            null
        }
    }
}
