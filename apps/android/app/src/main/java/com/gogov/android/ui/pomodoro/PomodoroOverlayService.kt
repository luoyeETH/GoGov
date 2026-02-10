package com.gogov.android.ui.pomodoro

import android.app.Service
import android.content.Intent
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.provider.Settings
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.ViewConfiguration
import android.view.WindowManager
import android.widget.TextView
import com.gogov.android.data.local.PomodoroStorage
import com.gogov.android.ui.MainActivity
import com.gogov.android.util.DateUtils
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlin.math.abs

class PomodoroOverlayService : Service() {

    private val serviceJob: Job = SupervisorJob()
    private val serviceScope = CoroutineScope(Dispatchers.Main.immediate + serviceJob)

    private lateinit var windowManager: WindowManager
    private lateinit var storage: PomodoroStorage

    private var overlayView: TextView? = null
    private var overlayLayoutParams: WindowManager.LayoutParams? = null

    private var savedState: PomodoroStorage.PomodoroSavedState? = null
    private var collectJob: Job? = null
    private var tickJob: Job? = null

    override fun onCreate() {
        super.onCreate()
        storage = PomodoroStorage(this)
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (!Settings.canDrawOverlays(this)) {
            stopSelf()
            return START_NOT_STICKY
        }

        if (overlayView == null) {
            showOverlay()
            serviceScope.launch { storage.setOverlayEnabled(true) }
            startObservingState()
            startTicking()
        }

        return START_NOT_STICKY
    }

    override fun onDestroy() {
        collectJob?.cancel()
        tickJob?.cancel()
        serviceScope.launch { storage.setOverlayEnabled(false) }
        removeOverlay()
        serviceScope.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun startObservingState() {
        collectJob?.cancel()
        collectJob = serviceScope.launch {
            storage.savedState.collect { state ->
                savedState = state
                val status = state?.status
                if (state == null || (status != "running" && status != "paused")) {
                    stopSelf()
                }
            }
        }
    }

    private fun startTicking() {
        tickJob?.cancel()
        tickJob = serviceScope.launch {
            while (isActive) {
                val state = savedState
                if (state != null) {
                    val now = System.currentTimeMillis()
                    val elapsedSeconds = calculateElapsedSeconds(state, now)
                    val displaySeconds = if (state.mode == "countdown") {
                        (state.plannedMinutes * 60 - elapsedSeconds).coerceAtLeast(0)
                    } else {
                        elapsedSeconds
                    }
                    overlayView?.text = DateUtils.formatSeconds(displaySeconds)
                }
                delay(500)
            }
        }
    }

    private fun calculateElapsedSeconds(state: PomodoroStorage.PomodoroSavedState, now: Long): Int {
        val paused = state.status == "paused" && state.pauseStart != null
        val elapsedMs = if (paused) {
            (state.pauseStart!! - state.startTime - state.pausedTotalMs)
        } else {
            (now - state.startTime - state.pausedTotalMs)
        }
        return (elapsedMs / 1000).toInt().coerceAtLeast(0)
    }

    private fun showOverlay() {
        val view = TextView(this).apply {
            text = DateUtils.formatSeconds(0)
            setTextColor(0xFFFFFFFF.toInt())
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 18f)
            typeface = Typeface.MONOSPACE
            setPadding(dp(12), dp(8), dp(12), dp(8))
            background = GradientDrawable().apply {
                cornerRadius = dp(14).toFloat()
                setColor(0xB3000000.toInt())
            }
            elevation = dp(8).toFloat()
        }

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = dp(16)
            y = dp(96)
        }

        attachTouchHandler(view, params)

        overlayView = view
        overlayLayoutParams = params
        windowManager.addView(view, params)
    }

    private fun removeOverlay() {
        val view = overlayView ?: return
        overlayView = null
        overlayLayoutParams = null
        try {
            windowManager.removeView(view)
        } catch (_: Throwable) {
            // Ignore if already removed.
        }
    }

    private fun attachTouchHandler(view: TextView, params: WindowManager.LayoutParams) {
        val touchSlop = ViewConfiguration.get(this).scaledTouchSlop
        val longPressTimeout = ViewConfiguration.getLongPressTimeout().toLong()
        val handler = Handler(Looper.getMainLooper())

        var startX = 0
        var startY = 0
        var startRawX = 0f
        var startRawY = 0f
        var dragging = false
        var longPressTriggered = false

        val longPressRunnable = Runnable {
            longPressTriggered = true
            stopSelf()
        }

        view.setOnTouchListener { _, event ->
            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    startX = params.x
                    startY = params.y
                    startRawX = event.rawX
                    startRawY = event.rawY
                    dragging = false
                    longPressTriggered = false
                    handler.postDelayed(longPressRunnable, longPressTimeout)
                    true
                }

                MotionEvent.ACTION_MOVE -> {
                    val dx = (event.rawX - startRawX).toInt()
                    val dy = (event.rawY - startRawY).toInt()
                    if (!dragging && (abs(dx) > touchSlop || abs(dy) > touchSlop)) {
                        dragging = true
                        handler.removeCallbacks(longPressRunnable)
                    }
                    if (dragging) {
                        params.x = startX + dx
                        params.y = startY + dy
                        try {
                            windowManager.updateViewLayout(view, params)
                        } catch (_: Throwable) {
                        }
                    }
                    true
                }

                MotionEvent.ACTION_UP,
                MotionEvent.ACTION_CANCEL -> {
                    handler.removeCallbacks(longPressRunnable)
                    if (event.actionMasked == MotionEvent.ACTION_UP && !longPressTriggered && !dragging) {
                        openApp()
                    }
                    true
                }

                else -> false
            }
        }
    }

    private fun openApp() {
        val intent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        startActivity(intent)
    }

    private fun dp(value: Int): Int {
        val density = resources.displayMetrics.density
        return (value * density).toInt()
    }
}
