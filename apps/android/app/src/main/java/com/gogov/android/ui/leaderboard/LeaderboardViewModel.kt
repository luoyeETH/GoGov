package com.gogov.android.ui.leaderboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gogov.android.data.repository.LeaderboardRepository
import com.gogov.android.domain.model.LeaderboardPeriod
import com.gogov.android.domain.model.LeaderboardResponse
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class LeaderboardViewModel(
    private val repository: LeaderboardRepository
) : ViewModel() {

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    private val _data = MutableStateFlow<LeaderboardResponse?>(null)
    val data: StateFlow<LeaderboardResponse?> = _data.asStateFlow()

    private val _selectedPeriod = MutableStateFlow(LeaderboardPeriod.DAY)
    val selectedPeriod: StateFlow<LeaderboardPeriod> = _selectedPeriod.asStateFlow()

    init {
        loadLeaderboard()
    }

    fun selectPeriod(period: LeaderboardPeriod) {
        if (_selectedPeriod.value != period) {
            _selectedPeriod.value = period
            loadLeaderboard()
        }
    }

    fun loadLeaderboard() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            repository.getLeaderboard(_selectedPeriod.value.value).fold(
                onSuccess = { response ->
                    _data.value = response
                },
                onFailure = { e ->
                    _error.value = e.message ?: "获取排行榜失败"
                }
            )

            _isLoading.value = false
        }
    }

    fun clearError() {
        _error.value = null
    }
}
