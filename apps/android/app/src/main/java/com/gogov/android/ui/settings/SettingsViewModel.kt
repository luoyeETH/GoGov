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
    // Profile edit
    val isEditingProfile: Boolean = false,
    val editUsername: String = "",
    val editGender: String = "hidden",
    val editAge: String = "",
    // Password change
    val isChangingPassword: Boolean = false,
    val oldPassword: String = "",
    val newPassword: String = "",
    val confirmPassword: String = "",
    val passwordError: String? = null,
    val passwordSuccess: String? = null,
    // AI Config form
    val aiProvider: String = "",
    val aiModel: String = "",
    val aiBaseUrl: String = "",
    val aiApiKey: String = "",
    val showApiKeyField: Boolean = false,
    // Reminder settings
    val reminderHour: Int = 8,
    val reminderMinute: Int = 0
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
                            aiBaseUrl = user.aiBaseUrl ?: "",
                            reminderHour = user.reminderHour ?: 8,
                            reminderMinute = user.reminderMinute ?: 0
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

    fun setReminderTime(hour: Int, minute: Int) {
        _state.update { it.copy(reminderHour = hour, reminderMinute = minute) }
    }

    fun saveReminderTime() {
        val current = _state.value

        viewModelScope.launch {
            val request = ProfileUpdateRequest(
                reminderHour = current.reminderHour,
                reminderMinute = current.reminderMinute
            )

            authRepository.updateProfile(request).fold(
                onSuccess = { user ->
                    _state.update {
                        it.copy(
                            user = user,
                            reminderHour = user.reminderHour ?: current.reminderHour,
                            reminderMinute = user.reminderMinute ?: current.reminderMinute
                        )
                    }
                },
                onFailure = { }
            )
        }
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
        _state.update { it.copy(error = null, successMessage = null, passwordError = null, passwordSuccess = null) }
    }

    // Profile editing
    fun startEditingProfile() {
        val user = _state.value.user ?: return
        _state.update {
            it.copy(
                isEditingProfile = true,
                editUsername = user.username ?: "",
                editGender = user.gender ?: "hidden",
                editAge = user.age?.toString() ?: ""
            )
        }
    }

    fun cancelEditingProfile() {
        _state.update { it.copy(isEditingProfile = false, error = null) }
    }

    fun setEditUsername(value: String) {
        _state.update { it.copy(editUsername = value) }
    }

    fun setEditGender(value: String) {
        _state.update { it.copy(editGender = value) }
    }

    fun setEditAge(value: String) {
        _state.update { it.copy(editAge = value) }
    }

    fun saveProfile() {
        val current = _state.value
        val username = current.editUsername.trim()
        if (username.length < 2 || username.length > 10) {
            _state.update { it.copy(error = "用户名需要 2-10 位字符") }
            return
        }

        viewModelScope.launch {
            _state.update { it.copy(isSaving = true, error = null) }

            val request = ProfileUpdateRequest(
                username = username,
                gender = current.editGender,
                age = current.editAge.toIntOrNull()
            )

            authRepository.updateProfile(request).fold(
                onSuccess = { user ->
                    _state.update {
                        it.copy(
                            user = user,
                            isSaving = false,
                            isEditingProfile = false,
                            successMessage = "资料已保存"
                        )
                    }
                },
                onFailure = { error ->
                    _state.update { it.copy(error = error.message, isSaving = false) }
                }
            )
        }
    }

    // Password change
    fun startChangingPassword() {
        _state.update {
            it.copy(
                isChangingPassword = true,
                oldPassword = "",
                newPassword = "",
                confirmPassword = "",
                passwordError = null,
                passwordSuccess = null
            )
        }
    }

    fun cancelChangingPassword() {
        _state.update { it.copy(isChangingPassword = false, passwordError = null) }
    }

    fun setOldPassword(value: String) {
        _state.update { it.copy(oldPassword = value) }
    }

    fun setNewPassword(value: String) {
        _state.update { it.copy(newPassword = value) }
    }

    fun setConfirmPassword(value: String) {
        _state.update { it.copy(confirmPassword = value) }
    }

    fun savePassword() {
        val current = _state.value
        if (current.oldPassword.isBlank()) {
            _state.update { it.copy(passwordError = "请输入原密码") }
            return
        }
        if (current.newPassword.length < 8) {
            _state.update { it.copy(passwordError = "新密码至少 8 位") }
            return
        }
        if (current.newPassword != current.confirmPassword) {
            _state.update { it.copy(passwordError = "两次密码不一致") }
            return
        }

        viewModelScope.launch {
            _state.update { it.copy(isSaving = true, passwordError = null) }

            authRepository.updatePassword(current.oldPassword, current.newPassword).fold(
                onSuccess = {
                    _state.update {
                        it.copy(
                            isSaving = false,
                            isChangingPassword = false,
                            passwordSuccess = "密码已更新",
                            oldPassword = "",
                            newPassword = "",
                            confirmPassword = ""
                        )
                    }
                },
                onFailure = { error ->
                    _state.update { it.copy(passwordError = error.message, isSaving = false) }
                }
            )
        }
    }
}
