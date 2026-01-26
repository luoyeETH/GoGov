package com.gogov.android.ui.mock

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Image
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.shape.CircleShape
import coil.compose.rememberAsyncImagePainter
import com.gogov.android.domain.model.MockHistoryRecord
import com.gogov.android.domain.model.MockAnalysisResponse
import com.gogov.android.domain.model.MockMetricInput
import java.time.OffsetDateTime
import kotlin.math.max
import kotlin.math.roundToInt

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MockAnalysisScreen(
    viewModel: MockAnalysisViewModel,
    onBack: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val context = LocalContext.current
    var selectedTab by remember { mutableStateOf(MockInputMode.IMAGE) }
    var selectedHistory by remember { mutableStateOf<MockHistoryRecord?>(null) }

    LaunchedEffect(Unit) {
        viewModel.loadHistory()
    }

    val photoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri: Uri? ->
        uri?.let { viewModel.setSelectedImage(it, context) }
    }

    if (state.error != null) {
        AlertDialog(
            onDismissRequest = {
                viewModel.clearError()
            },
            title = { Text("提示") },
            text = { Text(state.error ?: "") },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.clearError()
                }) {
                    Text("知道了")
                }
            }
        )
    }

    selectedHistory?.let { item ->
        AlertDialog(
            onDismissRequest = { selectedHistory = null },
            title = { Text(item.title) },
            text = {
                HistoryDetailContent(item)
            },
            confirmButton = {
                TextButton(onClick = { selectedHistory = null }) {
                    Text("关闭")
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        viewModel.deleteHistory(item.id)
                        selectedHistory = null
                    }
                ) {
                    Text("删除")
                }
            }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("模考解读") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "返回")
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
                    TabRow(selectedTabIndex = if (selectedTab == MockInputMode.IMAGE) 0 else 1) {
                        Tab(
                            selected = selectedTab == MockInputMode.IMAGE,
                            onClick = { selectedTab = MockInputMode.IMAGE },
                            text = { Text("上传图片") }
                        )
                        Tab(
                            selected = selectedTab == MockInputMode.MANUAL,
                            onClick = { selectedTab = MockInputMode.MANUAL },
                            text = { Text("手动录入") }
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = "模考数据录入",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    if (selectedTab == MockInputMode.IMAGE) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            OutlinedButton(
                                onClick = {
                                    photoPickerLauncher.launch(
                                        PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                                    )
                                }
                            ) {
                                Icon(Icons.Default.Image, contentDescription = null)
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("选择图片")
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            state.selectedImageUri?.let { uri ->
                                Image(
                                    painter = rememberAsyncImagePainter(uri),
                                    contentDescription = "模考图片",
                                    modifier = Modifier
                                        .size(80.dp),
                                    contentScale = ContentScale.Crop
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                IconButton(onClick = { viewModel.clearSelectedImage() }) {
                                    Icon(Icons.Default.Close, contentDescription = "移除图片")
                                }
                            }
                        }
                    } else {
                        Text(
                            text = "手动数据",
                            style = MaterialTheme.typography.titleSmall
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        state.metrics.forEachIndexed { index, metric ->
                            Card(modifier = Modifier.fillMaxWidth()) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    OutlinedTextField(
                                        value = metric.subject,
                                        onValueChange = { value ->
                                            viewModel.updateMetric(index) { it.copy(subject = value) }
                                        },
                                        label = { Text("科目") },
                                        modifier = Modifier.fillMaxWidth(),
                                        singleLine = true
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        OutlinedTextField(
                                            value = metric.correct,
                                            onValueChange = { value ->
                                                viewModel.updateMetric(index) { it.copy(correct = value) }
                                            },
                                            label = { Text("正确") },
                                            modifier = Modifier.weight(1f),
                                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                                        )
                                        OutlinedTextField(
                                            value = metric.total,
                                            onValueChange = { value ->
                                                viewModel.updateMetric(index) { it.copy(total = value) }
                                            },
                                            label = { Text("总题数") },
                                            modifier = Modifier.weight(1f),
                                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                                        )
                                        OutlinedTextField(
                                            value = metric.timeMinutes,
                                            onValueChange = { value ->
                                                viewModel.updateMetric(index) { it.copy(timeMinutes = value) }
                                            },
                                            label = { Text("耗时(分)") },
                                            modifier = Modifier.weight(1f),
                                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
                                        )
                                    }
                                }
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                        }
                        Text(
                            text = "只填写正确与总题即可，时间可选填。",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    OutlinedTextField(
                        value = state.title,
                        onValueChange = { viewModel.setTitle(it) },
                        label = { Text("标题（可选）") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = state.note,
                        onValueChange = { viewModel.setNote(it) },
                        label = { Text("备注（可选）") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Button(
                        onClick = {
                            viewModel.submitAnalysis(selectedTab)
                        },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !state.isSubmitting
                    ) {
                        if (state.isSubmitting) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(18.dp),
                                strokeWidth = 2.dp,
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                        }
                        Text("开始解读")
                    }
                }
            }

            state.result?.let { result ->
                ResultSection(result)
            }

            MockTrendSection(history = state.history)

            Text(text = "历史记录", style = MaterialTheme.typography.titleMedium)
            if (state.isLoadingHistory) {
                CircularProgressIndicator(modifier = Modifier.size(24.dp))
            } else {
                if (state.history.isEmpty()) {
                    Text(
                        text = "暂无模考解读记录。",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                } else {
                    state.history.forEach { item ->
                        HistoryCard(
                            item = item,
                            onClick = { selectedHistory = item }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ResultSection(result: MockAnalysisResponse) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = "解读结果", style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = Modifier.height(8.dp))
            if (!result.summary.isNullOrBlank()) {
                Text(text = result.summary, style = MaterialTheme.typography.bodyMedium)
            }
            result.details?.takeIf { it.isNotEmpty() }?.let { list ->
                Spacer(modifier = Modifier.height(8.dp))
                Text(text = "关键发现", style = MaterialTheme.typography.titleSmall)
                list.forEach { line ->
                    Text(text = "• $line", style = MaterialTheme.typography.bodySmall)
                }
            }
            result.practiceFocus?.takeIf { it.isNotEmpty() }?.let { list ->
                Spacer(modifier = Modifier.height(8.dp))
                Text(text = "练习建议", style = MaterialTheme.typography.titleSmall)
                list.forEach { line ->
                    Text(text = "• $line", style = MaterialTheme.typography.bodySmall)
                }
            }
            result.nextWeekPlan?.takeIf { it.isNotEmpty() }?.let { list ->
                Spacer(modifier = Modifier.height(8.dp))
                Text(text = "下周安排", style = MaterialTheme.typography.titleSmall)
                list.forEach { line ->
                    Text(text = "• $line", style = MaterialTheme.typography.bodySmall)
                }
            }
        }
    }
}

private data class TrendEntry(
    val id: String,
    val title: String,
    val createdAt: String,
    val metrics: List<MockMetricInput>,
    val overallAccuracy: Double?
)

private data class TrendSeries(
    val key: String,
    val label: String,
    val values: List<Double?>,
    val hasData: Boolean
)

@Composable
private fun MockTrendSection(history: List<MockHistoryRecord>) {
    val sortedHistory = remember(history) {
        history.sortedBy { parseEpochMillis(it.createdAt) }
    }
    val entries = remember(sortedHistory) {
        sortedHistory.map { record ->
            val normalizedMetrics = record.metrics.mapNotNull { metric ->
                val subject = normalizeSubjectName(metric.subject)
                if (subject.isNullOrBlank()) {
                    null
                } else {
                    metric.copy(subject = subject)
                }
            }
            TrendEntry(
                id = record.id,
                title = record.title,
                createdAt = record.createdAt,
                metrics = normalizedMetrics,
                overallAccuracy = normalizeAccuracy(record.overallAccuracy)
                    ?: computeOverallAccuracy(normalizedMetrics)
            )
        }
    }
    val labels = remember(entries) { entries.map { formatTrendDate(it.createdAt) } }
    val subjects = remember(entries) {
        val subjectSet = entries.flatMap { it.metrics }.mapNotNull { it.subject }.toMutableSet()
        DefaultSubjects + subjectSet.filterNot { DefaultSubjects.contains(it) }.sorted()
    }
    val seriesList = remember(entries, subjects) {
        val overallValues = entries.map { it.overallAccuracy }
        val series = mutableListOf(
            TrendSeries(
                key = "overall",
                label = "整体",
                values = overallValues,
                hasData = overallValues.any { it != null }
            )
        )
        subjects.forEach { subject ->
            val values = entries.map { entry ->
                val metric = entry.metrics.firstOrNull { it.subject == subject }
                metricAccuracy(metric)
            }
            series.add(
                TrendSeries(
                    key = subject,
                    label = subject,
                    values = values,
                    hasData = values.any { it != null }
                )
            )
        }
        series
    }
    val availableSeries = remember(seriesList) { seriesList.filter { it.hasData } }

    var selectedSeriesKey by rememberSaveable { mutableStateOf("all") }
    var selectedIndex by rememberSaveable { mutableStateOf<Int?>(null) }

    LaunchedEffect(entries.size) {
        selectedIndex = if (entries.isEmpty()) null else entries.size - 1
    }

    val activeIndex = remember(entries.size, selectedIndex) {
        if (entries.isEmpty()) {
            null
        } else {
            val fallbackIndex = entries.size - 1
            val candidate = selectedIndex ?: fallbackIndex
            candidate.coerceIn(0, fallbackIndex)
        }
    }

    val activeEntry = activeIndex?.let { entries.getOrNull(it) }

    val visibleSeries = remember(selectedSeriesKey, availableSeries) {
        if (selectedSeriesKey == "all") {
            availableSeries
        } else {
            availableSeries.filter { it.key == selectedSeriesKey }.ifEmpty { availableSeries }
        }
    }

    val colorScheme = MaterialTheme.colorScheme
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(text = "历史正确率走势", style = MaterialTheme.typography.titleMedium)
            Text(
                text = "覆盖常识判断、政治理论、言语理解与表达、数量关系、判断推理、资料分析",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                item {
                    FilterChip(
                        selected = selectedSeriesKey == "all",
                        onClick = { selectedSeriesKey = "all" },
                        label = { Text("全部") }
                    )
                }
                items(seriesList) { series ->
                    FilterChip(
                        selected = selectedSeriesKey == series.key,
                        onClick = { selectedSeriesKey = series.key },
                        enabled = series.hasData,
                        label = { Text(series.label, maxLines = 1) },
                        leadingIcon = {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .background(seriesColor(series.key, colorScheme), shape = CircleShape)
                            )
                        }
                    )
                }
            }

            if (entries.isEmpty()) {
                Text(
                    text = "暂无历史记录，先生成一次解读。",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                return@Column
            }

            val scrollState = rememberScrollState()
            val density = LocalDensity.current

            BoxWithConstraints(modifier = Modifier.fillMaxWidth()) {
                val viewportWidthPx = with(density) { maxWidth.toPx() }
                val maxVisible = if (maxWidth <= 720.dp) 8 else 18
                val paddingLeftPx = with(density) { 44.dp.toPx() }
                val paddingRightPx = with(density) { 16.dp.toPx() }
                val paddingTopPx = with(density) { 20.dp.toPx() }
                val paddingBottomPx = with(density) { 32.dp.toPx() }
                val plotWidth = max(1f, viewportWidthPx - paddingLeftPx - paddingRightPx)
                val slotSpacing = plotWidth / max(1, maxVisible - 1)
                val count = entries.size
                val chartWidthPx = if (count <= maxVisible) {
                    viewportWidthPx
                } else {
                    paddingLeftPx + paddingRightPx + slotSpacing * (count - 1)
                }
                val chartWidthDp = with(density) { chartWidthPx.toDp() }
                val chartHeightDp: Dp = if (maxWidth <= 720.dp) 200.dp else 240.dp
                val chartHeightPx = with(density) { chartHeightDp.toPx() }
                val labelOffsetPx = with(density) { 14.dp.toPx() }
                val labelYOffset = (chartHeightPx - with(density) { 18.dp.toPx() }).roundToInt()

                LaunchedEffect(count, chartWidthPx, viewportWidthPx) {
                    if (count > maxVisible) {
                        scrollState.scrollTo(scrollState.maxValue)
                    } else {
                        scrollState.scrollTo(0)
                    }
                }

                val xLabelIndices = remember(count, maxVisible) {
                    if (count <= maxVisible) {
                        (0 until count).toList()
                    } else {
                        listOf(0, count / 3, (2 * count) / 3, count - 1).distinct()
                    }
                }

                val activeX = activeIndex?.let { paddingLeftPx + slotSpacing * it }

                Box(
                    modifier = Modifier
                        .horizontalScroll(scrollState)
                        .width(chartWidthDp)
                        .height(chartHeightDp)
                ) {
                    Canvas(
                        modifier = Modifier
                            .matchParentSize()
                            .pointerInput(count, slotSpacing, scrollState.value) {
                                detectTapGestures { tap ->
                                    val x = tap.x + scrollState.value
                                    val rawIndex = ((x - paddingLeftPx) / slotSpacing).roundToInt()
                                    val clamped = rawIndex.coerceIn(0, max(0, count - 1))
                                    selectedIndex = clamped
                                }
                            }
                    ) {
                        val backgroundColor = colorScheme.surfaceVariant
                        val borderColor = colorScheme.outlineVariant
                        drawRoundRect(
                            color = backgroundColor,
                            topLeft = Offset.Zero,
                            size = Size(chartWidthPx, chartHeightPx),
                            cornerRadius = androidx.compose.ui.geometry.CornerRadius(14.dp.toPx())
                        )
                        drawRoundRect(
                            color = borderColor,
                            topLeft = Offset.Zero,
                            size = Size(chartWidthPx, chartHeightPx),
                            cornerRadius = androidx.compose.ui.geometry.CornerRadius(14.dp.toPx()),
                            style = Stroke(width = 1.dp.toPx())
                        )

                        val gridColor = colorScheme.onSurface.copy(alpha = 0.08f)
                        listOf(0f, 0.25f, 0.5f, 0.75f, 1f).forEach { tick ->
                            val y =
                                paddingTopPx + (1 - tick) * (chartHeightPx - paddingTopPx - paddingBottomPx)
                            drawLine(
                                color = gridColor,
                                start = Offset(paddingLeftPx, y),
                                end = Offset(chartWidthPx - paddingRightPx, y),
                                strokeWidth = 1.dp.toPx()
                            )
                        }

                        activeX?.let { x ->
                            drawLine(
                                color = colorScheme.onSurface.copy(alpha = 0.2f),
                                start = Offset(x, paddingTopPx),
                                end = Offset(x, chartHeightPx - paddingBottomPx),
                                strokeWidth = 1.dp.toPx(),
                                pathEffect = PathEffect.dashPathEffect(floatArrayOf(8f, 8f), 0f)
                            )
                        }

                        visibleSeries.forEach { series ->
                            val color = seriesColor(series.key, colorScheme)
                            val path = Path()
                            var started = false
                            series.values.forEachIndexed { index, value ->
                                val normalized = normalizeAccuracy(value)?.toFloat()
                                if (normalized == null) {
                                    started = false
                                } else {
                                    val x = paddingLeftPx + slotSpacing * index
                                    val y =
                                        paddingTopPx +
                                            (1f - normalized) * (chartHeightPx - paddingTopPx - paddingBottomPx)
                                    if (!started) {
                                        path.moveTo(x, y)
                                        started = true
                                    } else {
                                        path.lineTo(x, y)
                                    }
                                }
                            }
                            drawPath(
                                path = path,
                                color = color,
                                style = Stroke(width = 2.5.dp.toPx(), cap = StrokeCap.Round)
                            )
                            series.values.forEachIndexed { index, value ->
                                val normalized = normalizeAccuracy(value)?.toFloat() ?: return@forEachIndexed
                                val x = paddingLeftPx + slotSpacing * index
                                val y =
                                    paddingTopPx +
                                        (1f - normalized) * (chartHeightPx - paddingTopPx - paddingBottomPx)
                                val radius = if (activeIndex == index) 4.5.dp.toPx() else 3.5.dp.toPx()
                                drawCircle(
                                    color = color,
                                    radius = radius,
                                    center = Offset(x, y)
                                )
                            }
                        }
                    }

                    xLabelIndices.forEach { index ->
                        val label = labels.getOrNull(index) ?: return@forEach
                        val x = paddingLeftPx + slotSpacing * index
                        Text(
                            text = label,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier
                                .align(Alignment.TopStart)
                                .offset {
                                    IntOffset((x - labelOffsetPx).roundToInt(), labelYOffset)
                                }
                        )
                    }
                }
            }

            activeEntry?.let { entry ->
                Card(
                    colors = androidx.compose.material3.CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                    ),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(text = "当日正确率", style = MaterialTheme.typography.titleSmall)
                            Text(
                                text = formatTrendDate(entry.createdAt),
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        subjectsWithOverall(seriesList).forEach { series ->
                            val value = activeIndex?.let { series.values.getOrNull(it) }
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                        .background(seriesColor(series.key, colorScheme), shape = CircleShape)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = series.label,
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                }
                                Text(
                                    text = value?.let { formatAccuracy(it) } ?: "--",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun HistoryCard(item: MockHistoryRecord, onClick: () -> Unit) {
    val accuracyText = formatAccuracy(item.overallAccuracy)
    val timeText = item.timeTotalMinutes?.let { "${it.toInt()} 分钟" } ?: "--"
    val dateText = item.createdAt.takeIf { it.isNotBlank() }?.let {
        runCatching { OffsetDateTime.parse(it).toLocalDate().toString() }.getOrNull()
    } ?: item.createdAt

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = item.title,
                style = MaterialTheme.typography.titleSmall,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "正确率：$accuracyText · 总耗时：$timeText",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (!dateText.isNullOrBlank()) {
                Text(
                    text = dateText,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            item.analysis?.summary?.takeIf { it.isNotBlank() }?.let { summary ->
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = summary,
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}

@Composable
private fun HistoryDetailContent(item: MockHistoryRecord) {
    val accuracyText = formatAccuracy(item.overallAccuracy)
    val timeText = item.timeTotalMinutes?.let { "${it.toInt()} 分钟" } ?: "--"
    val dateText = item.createdAt.takeIf { it.isNotBlank() }?.let {
        runCatching { OffsetDateTime.parse(it).toLocalDate().toString() }.getOrNull()
    } ?: item.createdAt
    val summary = item.analysis?.summary?.takeIf { it.isNotBlank() }
        ?: item.analysisRaw?.takeIf { it.isNotBlank() }?.take(180)
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(max = 420.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Text(
            text = "正确率：$accuracyText · 总耗时：$timeText",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        if (!dateText.isNullOrBlank()) {
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = dateText,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        if (!summary.isNullOrBlank()) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = summary, style = MaterialTheme.typography.bodyMedium)
        }
        if (item.metrics.isNotEmpty()) {
            Spacer(modifier = Modifier.height(12.dp))
            Text(text = "科目数据", style = MaterialTheme.typography.titleSmall)
            Spacer(modifier = Modifier.height(6.dp))
            item.metrics.forEach { metric ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(text = metric.subject ?: "-", style = MaterialTheme.typography.bodySmall)
                    val correctText = metric.correct?.toString() ?: "-"
                    val totalText = metric.total?.toString() ?: "-"
                    val timeTextMetric = metric.timeMinutes?.let { "${it}m" } ?: "-"
                    Text(
                        text = "$correctText/$totalText · $timeTextMetric",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
            }
        }
        item.analysis?.details?.takeIf { it.isNotEmpty() }?.let { list ->
            Spacer(modifier = Modifier.height(12.dp))
            Text(text = "关键发现", style = MaterialTheme.typography.titleSmall)
            list.forEach { line ->
                Text(text = "• $line", style = MaterialTheme.typography.bodySmall)
            }
        }
        item.analysis?.practiceFocus?.takeIf { it.isNotEmpty() }?.let { list ->
            Spacer(modifier = Modifier.height(12.dp))
            Text(text = "练习建议", style = MaterialTheme.typography.titleSmall)
            list.forEach { line ->
                Text(text = "• $line", style = MaterialTheme.typography.bodySmall)
            }
        }
        item.analysis?.nextWeekPlan?.takeIf { it.isNotEmpty() }?.let { list ->
            Spacer(modifier = Modifier.height(12.dp))
            Text(text = "下周安排", style = MaterialTheme.typography.titleSmall)
            list.forEach { line ->
                Text(text = "• $line", style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}

private fun formatAccuracy(value: Double?): String {
    if (value == null) return "--"
    val percent = if (value <= 1.0) value * 100 else value
    return String.format("%.1f%%", percent)
}

private val DefaultSubjects = listOf(
    "政治理论",
    "常识判断",
    "言语理解与表达",
    "数量关系",
    "判断推理",
    "资料分析"
)

private val SubjectAliases = mapOf(
    "常识" to "常识判断",
    "言语理解" to "言语理解与表达"
)

private fun normalizeSubjectName(subject: String?): String? {
    val trimmed = subject?.trim().orEmpty()
    if (trimmed.isBlank()) return null
    return SubjectAliases[trimmed] ?: trimmed
}

private fun parseEpochMillis(value: String): Long {
    return runCatching { OffsetDateTime.parse(value).toInstant().toEpochMilli() }
        .getOrElse { 0L }
}

private fun formatTrendDate(value: String): String {
    return runCatching {
        val date = OffsetDateTime.parse(value)
        "${date.monthValue.toString().padStart(2, '0')}-${date.dayOfMonth.toString().padStart(2, '0')}"
    }.getOrElse { value }
}

private fun normalizeAccuracy(value: Double?): Double? {
    if (value == null || value.isNaN()) return null
    var normalized = value
    normalized = when {
        normalized > 1 && normalized <= 100 -> normalized / 100.0
        normalized > 1000 -> normalized / 10000.0
        else -> normalized
    }
    if (normalized < 0) normalized = 0.0
    if (normalized > 1) normalized = 1.0
    return normalized
}

private fun metricAccuracy(metric: MockMetricInput?): Double? {
    if (metric == null) return null
    val correct = metric.correct
    val total = metric.total
    return if (correct != null && total != null && total > 0) {
        normalizeAccuracy(correct.toDouble() / total.toDouble())
    } else {
        null
    }
}

private fun computeOverallAccuracy(metrics: List<MockMetricInput>): Double? {
    var correctSum = 0
    var totalSum = 0
    metrics.forEach { metric ->
        val correct = metric.correct
        val total = metric.total
        if (correct != null && total != null) {
            correctSum += correct
            totalSum += total
        }
    }
    if (totalSum == 0) return null
    return normalizeAccuracy(correctSum.toDouble() / totalSum.toDouble())
}

private fun seriesColor(key: String, colorScheme: androidx.compose.material3.ColorScheme): Color {
    return when (key) {
        "overall" -> colorScheme.primary
        "政治理论" -> Color(0xFF2563EB)
        "常识判断" -> Color(0xFF22C55E)
        "言语理解与表达" -> Color(0xFF0EA5E9)
        "数量关系" -> Color(0xFFEF4444)
        "判断推理" -> Color(0xFF14B8A6)
        "资料分析" -> Color(0xFFEAB308)
        else -> colorScheme.secondary
    }
}

private fun subjectsWithOverall(seriesList: List<TrendSeries>): List<TrendSeries> = seriesList
