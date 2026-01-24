package com.gogov.android

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import androidx.lifecycle.ProcessLifecycleOwner
import com.gogov.android.util.AppLifecycleObserver

class GoGovApplication : Application() {

    lateinit var appLifecycleObserver: AppLifecycleObserver
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this

        createNotificationChannels()

        appLifecycleObserver = AppLifecycleObserver()
        ProcessLifecycleOwner.get().lifecycle.addObserver(appLifecycleObserver)
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(NotificationManager::class.java)

            // Pomodoro channel
            val pomodoroChannel = NotificationChannel(
                CHANNEL_POMODORO,
                "番茄钟",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "番茄钟计时提醒"
            }
            notificationManager.createNotificationChannel(pomodoroChannel)

            // Daily reminder channel
            val reminderChannel = NotificationChannel(
                CHANNEL_REMINDER,
                "每日提醒",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "每日学习提醒"
            }
            notificationManager.createNotificationChannel(reminderChannel)
        }
    }

    companion object {
        const val CHANNEL_POMODORO = "pomodoro"
        const val CHANNEL_REMINDER = "reminder"

        lateinit var instance: GoGovApplication
            private set
    }
}
