package com.gogov.android.ui.ledger

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.gogov.android.data.repository.ExpenseRepository
import com.gogov.android.domain.model.ExpenseCreateEntry
import com.gogov.android.domain.model.ExpenseCreateRequest
import com.gogov.android.domain.model.ExpenseOverviewResponse
import com.gogov.android.domain.model.ExpenseParsedEntry
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class LedgerUiState(
    val inputText: String = "",
    val parsedEntries: List<ExpenseParsedEntry> = emptyList(),
    val parseWarning: String? = null,
    val overview: ExpenseOverviewResponse? = null,
    val isParsing: Boolean = false,
    val isSaving: Boolean = false,
    val error: String? = null,
    val successMessage: String? = null
)

class LedgerViewModel(
    private val repository: ExpenseRepository
) : ViewModel() {

    private val _state = MutableStateFlow(LedgerUiState())
    val state: StateFlow<LedgerUiState> = _state.asStateFlow()

    fun loadOverview() {
        viewModelScope.launch {
            repository.getOverview().fold(
                onSuccess = { overview ->
                    _state.update { it.copy(overview = overview) }
                },
                onFailure = { error ->
                    _state.update { it.copy(error = error.message) }
                }
            )
        }
    }

    fun setInputText(text: String) {
        _state.update { it.copy(inputText = text, error = null, successMessage = null) }
    }

    fun parseInput() {
        val text = _state.value.inputText.trim()
        if (text.isBlank()) {
            _state.update { it.copy(error = "请输入记账描述。") }
            return
        }
        _state.update { it.copy(isParsing = true, error = null, successMessage = null) }
        viewModelScope.launch {
            repository.parseExpense(text).fold(
                onSuccess = { response ->
                    _state.update {
                        it.copy(
                            isParsing = false,
                            parsedEntries = response.entries,
                            parseWarning = response.warning
                        )
                    }
                },
                onFailure = { error ->
                    _state.update { it.copy(isParsing = false, error = error.message) }
                }
            )
        }
    }

    fun saveParsedEntries() {
        val entries = _state.value.parsedEntries
        if (entries.isEmpty()) {
            _state.update { it.copy(error = "请先解析出记录。") }
            return
        }
        _state.update { it.copy(isSaving = true, error = null, successMessage = null) }
        val payload = ExpenseCreateRequest(
            records = entries.map { entry ->
                ExpenseCreateEntry(
                    date = entry.date,
                    item = entry.item,
                    amount = entry.amount
                )
            },
            rawText = _state.value.inputText.trim().ifBlank { null }
        )
        viewModelScope.launch {
            repository.saveExpenses(payload).fold(
                onSuccess = { response ->
                    _state.update {
                        it.copy(
                            isSaving = false,
                            parsedEntries = emptyList(),
                            parseWarning = null,
                            inputText = "",
                            successMessage = "已保存 ${response.count} 条记录"
                        )
                    }
                    loadOverview()
                },
                onFailure = { error ->
                    _state.update { it.copy(isSaving = false, error = error.message) }
                }
            )
        }
    }

    fun clearMessage() {
        _state.update { it.copy(error = null, successMessage = null) }
    }
}
