package com.gogov.android.domain.model

data class ExpenseParseRequest(
    val text: String
)

data class ExpenseParsedEntry(
    val date: String,
    val item: String,
    val amount: Double,
    val formatted: String? = null
)

data class ExpenseParseResponse(
    val entries: List<ExpenseParsedEntry> = emptyList(),
    val warning: String? = null
)

data class ExpenseCreateEntry(
    val date: String,
    val item: String,
    val amount: Double
)

data class ExpenseCreateRequest(
    val records: List<ExpenseCreateEntry>,
    val rawText: String? = null
)

data class ExpenseRecord(
    val id: String,
    val date: String,
    val item: String,
    val amount: Double,
    val rawText: String? = null,
    val createdAt: String
)

data class ExpenseCreateResponse(
    val count: Int = 0,
    val records: List<ExpenseRecord> = emptyList(),
    val record: ExpenseRecord? = null
)

data class ExpenseTotals(
    val amount: Double = 0.0,
    val count: Int = 0
)

data class ExpenseOverviewResponse(
    val totals: ExpenseTotals? = null,
    val breakdown: List<ExpenseBreakdownItem> = emptyList(),
    val series: List<ExpenseSeriesItem> = emptyList(),
    val records: List<ExpenseRecord> = emptyList()
)

data class ExpenseBreakdownItem(
    val item: String,
    val amount: Double,
    val count: Int,
    val percent: Double
)

data class ExpenseSeriesItem(
    val label: String,
    val amount: Double
)
