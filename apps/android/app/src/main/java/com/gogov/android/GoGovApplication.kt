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
                "Pomodoro Timer",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Pomodoro timer notifications"
            }
            notificationManager.createNotificationChannel(pomodoroChannel)

            // Daily reminder channel
            val reminderChannel = NotificationChannel(
                CHANNEL_REMINDER,
                "Daily Reminders",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Daily study reminders"
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
