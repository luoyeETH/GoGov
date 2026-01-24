package com.gogov.android.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gogov.android.data.repository.AuthRepository
import com.gogov.android.domain.model.ProfileUpdateRequest
import com.gogov.android.domain.model.User
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class SettingsUiState(
    val user: User? = null,
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val isLoggingOut: Boolean = false,
    val error: String? = null,
    val successMessage: String? = null,
    // AI Config form
    val aiProvider: String = "",
    val aiModel: String = "",
    val aiBaseUrl: String = "",
    val aiApiKey: String = "",
    val showApiKeyField: Boolean = false
)

class SettingsViewModel(private val authRepository: AuthRepository) : ViewModel() {

    private val _state = MutableStateFlow(SettingsUiState())
    val state: StateFlow<SettingsUiState> = _state.asStateFlow()

    fun loadUser() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            authRepository.getCurrentUser().fold(
                onSuccess = { user ->
                    _state.update {
                        it.copy(
                            user = user,
                            isLoading = false,
                            aiProvider = user.aiProvider ?: "",
                            aiModel = user.aiModel ?: "",
                            aiBaseUrl = user.aiBaseUrl ?: ""
                        )
                    }
                },
                onFailure = { error ->
                    _state.update { it.copy(error = error.message, isLoading = false) }
                }
            )
        }
    }

    fun setAiProvider(value: String) {
        _state.update { it.copy(aiProvider = value) }
    }

    fun setAiModel(value: String) {
        _state.update { it.copy(aiModel = value) }
    }

    fun setAiBaseUrl(value: String) {
        _state.update { it.copy(aiBaseUrl = value) }
    }

    fun setAiApiKey(value: String) {
        _state.update { it.copy(aiApiKey = value) }
    }

    fun toggleApiKeyField() {
        _state.update { it.copy(showApiKeyField = !it.showApiKeyField) }
    }

    fun saveAiConfig() {
        val current = _state.value

        viewModelScope.launch {
            _state.update { it.copy(isSaving = true, error = null, successMessage = null) }

            val request = ProfileUpdateRequest(
                aiProvider = current.aiProvider.takeIf { it.isNotBlank() },
                aiModel = current.aiModel.takeIf { it.isNotBlank() },
                aiBaseUrl = current.aiBaseUrl.takeIf { it.isNotBlank() },
                aiApiKey = current.aiApiKey.takeIf { it.isNotBlank() }
            )

            authRepository.updateProfile(request).fold(
                onSuccess = { user ->
                    _state.update {
                        it.copy(
                            user = user,
                            isSaving = false,
                            successMessage = "AI 配置已保存！",
                            aiApiKey = "",
                            showApiKeyField = false
                        )
                    }
                },
                onFailure = { error ->
                    _state.update { it.copy(error = error.message, isSaving = false) }
                }
            )
        }
    }

    fun logout(onComplete: () -> Unit) {
        viewModelScope.launch {
            _state.update { it.copy(isLoggingOut = true) }
            try {
                authRepository.logout()
                onComplete()
            } finally {
                _state.update { it.copy(isLoggingOut = false) }
            }
        }
    }

    fun clearMessages() {
        _state.update { it.copy(error = null, successMessage = null) }
    }
}
