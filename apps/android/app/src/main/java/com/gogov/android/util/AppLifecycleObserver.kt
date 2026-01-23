package com.gogov.android.util

import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class AppLifecycleObserver : DefaultLifecycleObserver {

    private val _isInForeground = MutableStateFlow(true)
    val isInForeground: StateFlow<Boolean> = _isInForeground.asStateFlow()

    private val _onBackground = MutableStateFlow(0L)
    val onBackground: StateFlow<Long> = _onBackground.asStateFlow()

    override fun onStart(owner: LifecycleOwner) {
        _isInForeground.value = true
    }

    override fun onStop(owner: LifecycleOwner) {
        _isInForeground.value = false
        _onBackground.value = System.currentTimeMillis()
    }
}
