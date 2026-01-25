package com.gogov.android.ui.ledger

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.gogov.android.domain.model.ExpenseParsedEntry
import com.gogov.android.domain.model.ExpenseBreakdownItem
import com.gogov.android.domain.model.ExpenseRecord
import com.gogov.android.domain.model.ExpenseSeriesItem

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LedgerScreen(
    viewModel: LedgerViewModel,
    onBack: () -> Unit
) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadOverview()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("记账本") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "返回")
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.loadOverview() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "刷新")
                    }
                }
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "快速记一笔",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = state.inputText,
                        onValueChange = { viewModel.setInputText(it) },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("输入支出描述") },
                        placeholder = { Text("例如：今天买资料 59 元") },
                        minLines = 2
                    )
                    state.parseWarning?.let {
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = it,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.tertiary
                        )
                    }
                    state.error?.let {
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = it,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.error
                        )
                    }
                    state.successMessage?.let {
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = it,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(
                            onClick = { viewModel.parseInput() },
                            enabled = !state.isParsing
                        ) {
                            if (state.isParsing) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(16.dp),
                                    strokeWidth = 2.dp
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                            }
                            Text("解析")
                        }
                        Button(
                            onClick = { viewModel.saveParsedEntries() },
                            enabled = !state.isSaving && state.parsedEntries.isNotEmpty()
                        ) {
                            if (state.isSaving) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(16.dp),
                                    strokeWidth = 2.dp,
                                    color = MaterialTheme.colorScheme.onPrimary
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                            }
                            Text("保存")
                        }
                    }
                }
            }

            if (state.parsedEntries.isNotEmpty()) {
                ParsedEntriesCard(entries = state.parsedEntries)
            }

            state.overview?.let { overview ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "本月概览",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "支出：¥${overview.totals?.amount ?: 0} · 记录：${overview.totals?.count ?: 0}",
                            style = MaterialTheme.typography.bodyMedium
                        )
                        if (overview.breakdown.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = "分类统计",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.SemiBold
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            BreakdownSection(overview.breakdown)
                        }
                        if (overview.series.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = "趋势",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.SemiBold
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            TrendList(overview.series)
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "最近记录",
                            style = MaterialTheme.typography.titleSmall
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        if (overview.records.isEmpty()) {
                            Text(
                                text = "暂无记录。",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        } else {
                            overview.records.take(8).forEach { record ->
                                LedgerRecordRow(record)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun BreakdownSection(items: List<ExpenseBreakdownItem>) {
    val colors = listOf(
        MaterialTheme.colorScheme.primary,
        MaterialTheme.colorScheme.tertiary,
        MaterialTheme.colorScheme.secondary,
        MaterialTheme.colorScheme.primaryContainer,
        MaterialTheme.colorScheme.secondaryContainer,
        MaterialTheme.colorScheme.tertiaryContainer
    )
    val sliceItems = items.take(6)
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        LedgerPieChart(sliceItems, colors)
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            sliceItems.forEachIndexed { index, item ->
                LegendRow(item, colors[index % colors.size])
                Spacer(modifier = Modifier.height(8.dp))
            }
        }
    }
    Spacer(modifier = Modifier.height(12.dp))
    sliceItems.take(5).forEach { item ->
        BreakdownRow(item)
        Spacer(modifier = Modifier.height(8.dp))
    }
}

@Composable
private fun LedgerPieChart(items: List<ExpenseBreakdownItem>, colors: List<androidx.compose.ui.graphics.Color>) {
    val total = items.sumOf { it.percent }
    Canvas(modifier = Modifier.size(140.dp)) {
        if (items.isEmpty() || total <= 0.0) {
            drawArc(
                color = MaterialTheme.colorScheme.surfaceVariant,
                startAngle = 0f,
                sweepAngle = 360f,
                useCenter = true
            )
            return@Canvas
        }
        var startAngle = -90f
        items.forEachIndexed { index, item ->
            val sweep = (item.percent / 100.0 * 360.0).toFloat().coerceAtLeast(0f)
            if (sweep > 0f) {
                drawArc(
                    color = colors[index % colors.size],
                    startAngle = startAngle,
                    sweepAngle = sweep,
                    useCenter = true,
                    size = Size(size.width, size.height)
                )
            }
            startAngle += sweep
        }
    }
}

@Composable
private fun LegendRow(item: ExpenseBreakdownItem, color: androidx.compose.ui.graphics.Color) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.fillMaxWidth()
    ) {
        Canvas(modifier = Modifier.size(10.dp)) {
            drawCircle(color = color)
        }
        Spacer(modifier = Modifier.width(8.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(text = item.item, style = MaterialTheme.typography.bodySmall)
            Text(
                text = "¥${item.amount} · ${item.percent}%",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun BreakdownRow(item: ExpenseBreakdownItem) {
    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(text = item.item, style = MaterialTheme.typography.bodyMedium)
            Text(
                text = "¥${item.amount} · ${item.percent}%",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        Spacer(modifier = Modifier.height(6.dp))
        LinearProgressIndicator(
            progress = (item.percent / 100.0).toFloat().coerceIn(0f, 1f),
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
private fun TrendList(series: List<ExpenseSeriesItem>) {
    val maxAmount = series.maxOfOrNull { it.amount } ?: 0.0
    val safeMax = if (maxAmount <= 0.0) 1.0 else maxAmount
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        series.takeLast(7).forEach { item ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = item.label,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.width(52.dp)
                )
                LinearProgressIndicator(
                    progress = (item.amount / safeMax).toFloat().coerceIn(0f, 1f),
                    modifier = Modifier
                        .weight(1f)
                        .height(6.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "¥${item.amount}",
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}

@Composable
private fun ParsedEntriesCard(entries: List<ExpenseParsedEntry>) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = "解析预览", style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = Modifier.height(8.dp))
            entries.forEach { entry ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(text = entry.item, style = MaterialTheme.typography.bodyMedium)
                        Text(
                            text = entry.date,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Text(text = "¥${entry.amount}", style = MaterialTheme.typography.bodyMedium)
                }
                Spacer(modifier = Modifier.height(6.dp))
            }
        }
    }
}

@Composable
private fun LedgerRecordRow(record: ExpenseRecord) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column {
            Text(text = record.item, style = MaterialTheme.typography.bodyMedium)
            Text(
                text = record.date,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        Text(text = "¥${record.amount}", style = MaterialTheme.typography.bodyMedium)
    }
    Spacer(modifier = Modifier.height(6.dp))
}
