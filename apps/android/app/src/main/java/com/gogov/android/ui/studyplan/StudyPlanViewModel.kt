package com.gogov.android.ui.studyplan

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gogov.android.data.repository.AuthRepository
import com.gogov.android.domain.model.StudyPlanProfile
import com.gogov.android.domain.model.StudyPlanProfileUpdateRequest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class StudyPlanUiState(
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val error: String? = null,
    val successMessage: String? = null,
    val profile: StudyPlanProfile? = null,
    // Form fields
    val prepStartDate: String = "",
    val totalStudyDuration: String = "",
    val currentProgress: String = "",
    val targetExam: String = "",
    val targetExamDate: String = "",
    val studyResources: String = "",
    val interviewExperience: String = "",
    val notes: String = ""
)

class StudyPlanViewModel(private val authRepository: AuthRepository) : ViewModel() {

    private val _state = MutableStateFlow(StudyPlanUiState())
    val state: StateFlow<StudyPlanUiState> = _state.asStateFlow()

    fun loadProfile() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            authRepository.getStudyPlanProfile().fold(
                onSuccess = { profile ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            profile = profile,
                            prepStartDate = profile?.prepStartDate?.take(10) ?: "",
                            totalStudyDuration = profile?.totalStudyDurationText
                                ?: profile?.totalStudyHours?.let { h -> "$h 小时" }
                                ?: "",
                            currentProgress = profile?.currentProgress ?: "",
                            targetExam = profile?.targetExam ?: "",
                            targetExamDate = profile?.targetExamDate?.take(10) ?: "",
                            studyResources = listOfNotNull(
                                profile?.plannedMaterials,
                                profile?.learningGoals
                            ).filter { s -> s.isNotBlank() }.distinct().joinToString("\n"),
                            interviewExperience = when (profile?.interviewExperience) {
                                true -> "yes"
                                false -> "no"
                                else -> ""
                            },
                            notes = profile?.notes ?: ""
                        )
                    }
                },
                onFailure = { error ->
                    _state.update { it.copy(error = error.message, isLoading = false) }
                }
            )
        }
    }

    fun setPrepStartDate(value: String) {
        _state.update { it.copy(prepStartDate = value) }
    }

    fun setTotalStudyDuration(value: String) {
        _state.update { it.copy(totalStudyDuration = value) }
    }

    fun setCurrentProgress(value: String) {
        _state.update { it.copy(currentProgress = value) }
    }

    fun setTargetExam(value: String) {
        _state.update { it.copy(targetExam = value) }
    }

    fun setTargetExamDate(value: String) {
        _state.update { it.copy(targetExamDate = value) }
    }

    fun setStudyResources(value: String) {
        _state.update { it.copy(studyResources = value) }
    }

    fun setInterviewExperience(value: String) {
        _state.update { it.copy(interviewExperience = value) }
    }

    fun setNotes(value: String) {
        _state.update { it.copy(notes = value) }
    }

    fun saveProfile(onSuccess: () -> Unit) {
        val current = _state.value

        viewModelScope.launch {
            _state.update { it.copy(isSaving = true, error = null, successMessage = null) }

            val request = StudyPlanProfileUpdateRequest(
                prepStartDate = current.prepStartDate.takeIf { it.isNotBlank() },
                totalStudyDuration = current.totalStudyDuration.takeIf { it.isNotBlank() },
                currentProgress = current.currentProgress.takeIf { it.isNotBlank() },
                targetExam = current.targetExam.takeIf { it.isNotBlank() },
                targetExamDate = current.targetExamDate.takeIf { it.isNotBlank() },
                studyResources = current.studyResources.takeIf { it.isNotBlank() },
                interviewExperience = when (current.interviewExperience) {
                    "yes" -> true
                    "no" -> false
                    else -> null
                },
                notes = current.notes.takeIf { it.isNotBlank() }
            )

            authRepository.updateStudyPlanProfile(request).fold(
                onSuccess = { profile ->
                    _state.update {
                        it.copy(
                            isSaving = false,
                            profile = profile,
                            successMessage = "备考档案已保存"
                        )
                    }
                    onSuccess()
                },
                onFailure = { error ->
                    _state.update { it.copy(error = error.message, isSaving = false) }
                }
            )
        }
    }

    fun clearMessages() {
        _state.update { it.copy(error = null, successMessage = null) }
    }
}
